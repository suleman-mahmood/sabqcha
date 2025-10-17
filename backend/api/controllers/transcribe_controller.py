import os
import math
import ffmpeg
import asyncio
import requests
import tempfile

from pathlib import Path

from google.cloud.storage import Bucket
from openai import OpenAI
from api.dal import quiz_db

from loguru import logger

from api.exceptions import OpenAiApiError, UpliftAiApiError
from api.models.transcription_models import LlmMcqResponse
from api.prompts import MCQ_SYSTEM_PROMPT, extract_text_from_file_prompt, generate_mcq_user_prompt
from api.dal import lecture_db, task_db
from api.dependencies import DataContext
from api.models.task_models import WeekDay
from api import utils
from api.job_utils import background_job_decorator

MAX_AUDIO_DURATION = 60 * 60  # In seconds, 1 hour
AUDIO_CHUNK_LEN = 60  # In seconds

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")


@background_job_decorator(lambda _, args, kwargs: kwargs.get("lecture_group_id") or args[2])
async def transcribe(
    data_context: DataContext, bucket: Bucket, openai_client: OpenAI, lecture_group_id: str
):
    logger.info("Generating task sets for lecture group {}", lecture_group_id)

    lectures = await lecture_db.list_lectures_for_group(data_context, lecture_group_id)
    assert lectures

    all_lecture_transcripts: list[str] = []
    for le in lectures:
        lecture_transcript = await transcribe_lecture(bucket, le.file_path)
        await lecture_db.add_transcription(data_context, le.id, lecture_transcript)
        all_lecture_transcripts.append(lecture_transcript)

    final_mega_transcript = " ".join(all_lecture_transcripts)

    logger.info(
        "Calling llm to create mcqs for transcript: {} ... {}",
        final_mega_transcript[:10],
        final_mega_transcript[-10:],
    )
    openai_res = await asyncio.to_thread(
        openai_client.responses.parse,
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": MCQ_SYSTEM_PROMPT},
            {"role": "user", "content": generate_mcq_user_prompt(final_mega_transcript)},
        ],
        text_format=LlmMcqResponse,
    )

    if openai_res.usage:
        logger.info("Input tokens: {}", openai_res.usage.input_tokens)
        logger.info("Output tokens: {}", openai_res.usage.output_tokens)
        logger.info("Total tokens used: {}", openai_res.usage.total_tokens)

    llm_res = openai_res.output_parsed
    if not llm_res:
        logger.error("Invalid Response form OpenAI: {}", openai_res.model_dump(mode="json"))
        raise OpenAiApiError("Invalid response from OpenAI")

    logger.info("LLM returned {} task_sets", len(llm_res.task_sets))
    for ts, day in zip(llm_res.task_sets, WeekDay):
        logger.info("LLM returned {} tasks for {}", len(ts.mcqs), day)

        await task_db.insert_task_set(data_context, lecture_group_id, ts.mcqs, day)

    logger.info("Task sets generated for lecture group {}", lecture_group_id)


async def transcribe_lecture(bucket: Bucket, file_path: str) -> str:
    all_transcripts: list[str] = []

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path_obj = Path(file_path)
        extension = file_path_obj.suffix  # .mp3, .mp4

        storage_file = tempfile.NamedTemporaryFile(suffix=extension, dir=temp_dir, delete=False)
        blob = bucket.blob(file_path)
        await asyncio.to_thread(blob.download_to_filename, storage_file.name)
        input_file_name = storage_file.name

        if extension != ".mp3":
            logger.info("Converting {} to .mp3", extension)

            output_file = tempfile.NamedTemporaryFile(suffix=".mp3", dir=temp_dir, delete=False)
            await utils.audio_video_to_mp3(storage_file.name, output_file.name)
            input_file_name = output_file.name

        # probe is blocking
        probe = await asyncio.to_thread(ffmpeg.probe, input_file_name)
        duration = math.floor(float(probe["format"]["duration"]))

        if duration > MAX_AUDIO_DURATION:
            logger.error("User uploaded a {} mins audio", duration / 60)

        num_chunks = math.ceil(duration / AUDIO_CHUNK_LEN)

        # If last chunk is very small ignore it
        if duration - (num_chunks - 1) * AUDIO_CHUNK_LEN < 5:
            num_chunks -= 1

        logger.info("Total audio duration: {}", duration)
        logger.info("Num chunks: {}", num_chunks)

        make_chunk_args: list[tuple[str, int]] = []
        for i in range(num_chunks):
            start_time = i * AUDIO_CHUNK_LEN
            temp_chunk = tempfile.NamedTemporaryFile(
                suffix=os.path.splitext(input_file_name)[1],
                dir=temp_dir,
                delete=False,
            )

            make_chunk_args.append((temp_chunk.name, start_time))

        # run ffmpeg (blocking) in thread
        def _make_chunk(outname: str, ss: int) -> None:
            (
                ffmpeg.input(input_file_name, ss=ss, t=AUDIO_CHUNK_LEN)
                .output(outname, c="copy")
                .overwrite_output()
                .run(quiet=True)
            )

        await asyncio.gather(
            *[
                asyncio.to_thread(_make_chunk, temp_chunk_name, start_time)
                for temp_chunk_name, start_time in make_chunk_args
            ]
        )

        # helper to post a chunk to uplift (blocking) in thread
        def _post_chunk(file_path: str) -> str:
            logger.info("Sending file {} to API", file_path)

            with open(file_path, "rb") as f:
                files = {"file": ("audio.mp3", f, "audio/mpeg")}
                data = {"model": "scribe-mini", "language": "ur"}
                headers = {"Authorization": f"Bearer {UPLIFT_API_KEY}"}
                response = requests.post(
                    f"{UPLIFT_BASE_URL}/transcribe/speech-to-text",
                    headers=headers,
                    files=files,
                    data=data,
                )

            status_code = response.status_code
            try:
                res_json = response.json()
            except Exception:
                res_json = None

            if status_code != 200:
                logger.error("Uplift API returned non 200 error: {}", status_code, json=res_json)
                raise UpliftAiApiError("Uplift API returned non 200 error")

            if not res_json or "transcript" not in res_json:
                logger.error("No transcript in response", json=res_json)
                raise UpliftAiApiError("No transcript in response")

            t = res_json["transcript"]
            logger.info("Got transcription: {} ... {}", t[:10], t[-10:])
            return t

        all_transcripts = await asyncio.gather(
            *[
                asyncio.to_thread(_post_chunk, sharded_file_name)
                for sharded_file_name, _ in make_chunk_args
            ]
        )

    return " ".join(all_transcripts)


async def _extract_text_from_file(
    bucket: Bucket, file_path: str, openai_client: OpenAI
) -> str:
    if not file_path:
        return FileNotFoundError

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path_obj = Path(file_path)
        extension = file_path_obj.suffix or ""
        storage_file = tempfile.NamedTemporaryFile(suffix=extension, dir=temp_dir, delete=False)
        blob = bucket.blob(file_path)
        await asyncio.to_thread(blob.download_to_filename, storage_file.name)

        with open(storage_file.name, "rb") as f:
            data = f.read()

    try:
        text_payload = data.decode("utf-8")
    except UnicodeDecodeError:
        text_payload = data.decode("utf-8", errors="ignore")

    prompt = extract_text_from_file_prompt(text_payload)

    try:
        openai_res = await asyncio.to_thread(
            openai_client.responses.parse,
            model="gpt-5-mini",
            input=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        logger.exception("OpenAI call failed for {}: {}", file_path, e)
        return OpenAiApiError(e)

    try:
        parsed = openai_res.output_parsed
    except:
        logger.error("OpenAI returned no parsed output for {}", file_path)
        return 

    return str(parsed)


async def transcribe_quiz(
    data_context: DataContext, bucket: Bucket, openai_client: OpenAI, quiz_id: str
):
    """Download quiz files (answer sheet and rubric) from storage, run multimodal OCR,
    and update the quiz row with extracted text."""

    # Fetch current quiz record
    quiz = await quiz_db.get_quiz(data_context, quiz_id)
    if not quiz:
        logger.error("Quiz not found: {}", quiz_id)
        return

    answer_field = quiz.answer_sheet_path
    rubric_field = quiz.rubric_path

    answer_text = ""
    rubric_text = ""
    if answer_field and "/" in answer_field:
        answer_text = await _extract_text_from_file(bucket, answer_field, openai_client)

    if rubric_field and "/" in rubric_field:
        rubric_text = await _extract_text_from_file(bucket, rubric_field, openai_client)

    await quiz_db.update_quiz_transcription(data_context, quiz_id, answer_text, rubric_text)


async def transcribe_solution(
    data_context: DataContext,
    bucket: Bucket,
    openai_client: OpenAI,
    solution_id: str,
):
    solution = await quiz_db.get_student_solution(data_context, solution_id)
    if not solution:
        logger.error("Student solution not found: {}", solution_id)
        return FileNotFoundError

    if not solution.solution_path:
        logger.error("Student solution {} is missing a storage path", solution_id)
        return

    solution_text = await _extract_text_from_file(bucket, solution.solution_path, openai_client)
    await quiz_db.update_student_solution_transcription(
        data_context,
        solution_id,
        solution_text,
    )
