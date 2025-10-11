import os
import math
import ffmpeg
import asyncio
import requests
import tempfile

from google.cloud.storage import Bucket
from openai import OpenAI

from loguru import logger

from api.exceptions import OpenAiApiError, UpliftAiApiError
from api.models.transcription_models import LlmMcqResponse
from api.prompts import MCQ_SYSTEM_PROMPT, generate_mcq_user_prompt
from api.dal import lecture_db, task_db
from api.dependencies import DataContext

MAX_AUDIO_DURATION = 60 * 60  # In seconds, 1 hour
AUDIO_CHUNK_LEN = 60  # In seconds

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")


async def transcribe(
    data_context: DataContext, bucket: Bucket, openai_client: OpenAI, lecture_id: str
):
    lecture = await lecture_db.get_lecture(data_context, lecture_id)
    assert lecture

    all_transcripts: list[str] = []

    with tempfile.TemporaryDirectory() as temp_dir:
        input_file_name: str
        input_file = tempfile.NamedTemporaryFile(suffix=".mp3", dir=temp_dir, delete=False)
        input_file_name = input_file.name

        blob = bucket.blob(lecture.file_path)
        await asyncio.to_thread(blob.download_to_filename, input_file_name)

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
            logger.info("Got transcription: {} ... {}", t[10:], t[-10:])
            return t

        all_transcripts = await asyncio.gather(
            *[
                asyncio.to_thread(_post_chunk, sharded_file_name)
                for sharded_file_name, _ in make_chunk_args
            ]
        )

    final_transcript = " ".join(all_transcripts)
    await lecture_db.add_transcription(data_context, lecture_id, final_transcript)

    logger.info(
        "Calling llm to create mcqs for transcript: {} {}",
        final_transcript[:10],
        final_transcript[-10:],
    )
    openai_res = await asyncio.to_thread(
        openai_client.responses.parse,
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": MCQ_SYSTEM_PROMPT},
            {"role": "user", "content": generate_mcq_user_prompt(final_transcript)},
        ],
        text_format=LlmMcqResponse,
    )

    llm_res = openai_res.output_parsed
    if not llm_res:
        logger.error("Invalid Response form OpenAI: {}", openai_res.model_dump(mode="json"))
        raise OpenAiApiError("Invalid response from OpenAI")

    logger.info("LLM returned {} mcqs", len(llm_res.mcqs))

    await task_db.insert_task_set(data_context, lecture_id, llm_res.mcqs)
