import os
import math
import ffmpeg
import asyncio


from fastapi.responses import JSONResponse
from google.cloud.firestore import Client
from google.cloud.storage import Bucket
from openai import OpenAI
from psycopg import AsyncCursor
import requests
import tempfile

from fastapi import APIRouter, Depends, Response
from loguru import logger
from pydantic import BaseModel

from api.models.transcription_models import LlmMcqResponse, TranscriptionDoc, UserDoc
from api.prompts import (
    DUMMY_DATA_SYSTEM_PROMPT,
    MCQ_SYSTEM_PROMPT,
    generate_dummy_data_user_prompt,
    generate_mcq_user_prompt,
)
from api.dependencies import get_bucket, get_cursor, get_firestore, get_openai_client
from api.utils import internal_id
from api.dal import id_map
from api.dal import mcq_db, transcription_db
from api import utils


router = APIRouter(prefix="/transcribe")

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")

# One hour in seconds
MAX_AUDIO_DURATION = 60 * 60
AUDIO_CHUNK_LEN = 60  # In seconds


class TranscribeBody(BaseModel):
    file_path: str | None = None
    yt_video_link: str | None = None
    title: str
    user_id: str


class UpliftAiApiError(Exception):
    pass


@router.post("")
async def transcribe(
    body: TranscribeBody,
    cur: AsyncCursor = Depends(get_cursor),
    openai_client: OpenAI = Depends(get_openai_client),
    bucket: Bucket = Depends(get_bucket),
):
    all_transcripts: list[str] = []

    with tempfile.TemporaryDirectory() as temp_dir:
        input_file_name: str
        if body.yt_video_link:
            # download youtube audio (blocking) in thread
            input_file_name = await asyncio.to_thread(
                utils.download_youtube_audio_temp, body.yt_video_link, temp_dir
            )
        else:
            assert body.file_path
            input_file = tempfile.NamedTemporaryFile(suffix=".mp3", dir=temp_dir, delete=False)
            input_file_name = input_file.name

            blob = bucket.blob(body.file_path)
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

            logger.info("Response Status: {}", status_code)
            logger.info("Json: {}", res_json)

            if status_code != 200:
                logger.error("Uplift API returned non 200 error: {}", status_code)
                raise UpliftAiApiError

            if not res_json or "transcript" not in res_json:
                logger.error("No transcript in response")
                raise UpliftAiApiError

            return res_json["transcript"]

        try:
            all_transcripts = await asyncio.gather(
                *[
                    asyncio.to_thread(_post_chunk, sharded_file_name)
                    for sharded_file_name, _ in make_chunk_args
                ]
            )
        except UpliftAiApiError:
            return Response("Uplift API Failed", status_code=400)

    final_transcript = " ".join(all_transcripts)
    db_file_path = body.yt_video_link or body.file_path
    assert db_file_path

    trans_id = await transcription_db.insert_transcription(
        cur, db_file_path, body.title, body.user_id, final_transcript
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
        return Response("Invalid response from OpenAI", status_code=400)

    # Save these mcqs
    for m in llm_res.mcqs:
        await mcq_db.insert_mcq(cur, trans_id, m.question, m.options, m.answer)


class TranscriptionListEntryResponse(BaseModel):
    doc_id: str
    title: str


@router.get("/list")
async def get_all_transcription_docs(cur: AsyncCursor = Depends(get_cursor)):
    entries = await transcription_db.list_transcriptions(cur)
    return JSONResponse(content={"data": [e.model_dump(mode="json") for e in entries]})


@router.get("/mcqs/{transcription_id}")
async def get_transcription_mcqs(transcription_id: str, cur: AsyncCursor = Depends(get_cursor)):
    trans = await transcription_db.get_transcription(cur, transcription_id)
    assert trans
    mcqs = await mcq_db.list_mcqs(cur, transcription_id)

    res = {"mcqs": [m.model_dump(mode="json") for m in mcqs], "title": trans.title}
    return JSONResponse(content=res)


@router.get("/create-demo-mcqs")
async def create_demo_mcqs(
    cur: AsyncCursor = Depends(get_cursor), openai_client: OpenAI = Depends(get_openai_client)
):
    topics = [
        # "Newton's law of motion",
        # "Work, Engergy, Power",
        # "Waves and Sound",
        # "Quadratic Equations and Functions"
        # "Trigonometric Identities and Applications"
        # "Distributed Systems",
        # "Computer Graphics",
        # "Computer Vision",
        # "Business Communication",
        # "Psychology",
    ]

    for topic in topics:
        # Define the messages
        openai_res = openai_client.responses.parse(
            model="gpt-5-mini",
            input=[
                {"role": "system", "content": DUMMY_DATA_SYSTEM_PROMPT},
                {"role": "user", "content": generate_dummy_data_user_prompt(topic)},
            ],
            text_format=LlmMcqResponse,
        )
        llm_res = openai_res.output_parsed
        if not llm_res:
            logger.error("Invalid Response form OpenAI: {}", openai_res.model_dump(mode="json"))
            return Response("Invalid response from OpenAI", status_code=400)

        # Save transcription
        trans_id = await transcription_db.insert_transcription(
            cur, "dummy.mp3", topic, "system-user-id", "dummy-content"
        )

        # Save these mcqs
        for m in llm_res.mcqs:
            await mcq_db.insert_mcq(cur, trans_id, m.question, m.options, m.answer)


@router.get("/migration")
async def do_migration_to_pg(
    db: Client = Depends(get_firestore), cur: AsyncCursor = Depends(get_cursor)
):
    await cur.execute(
        """
        insert into sabqcha_user (
            public_id, display_name, score
        )
        values (%s, %s, %s)
        returning id
        """,
        ("system-user-id", "System User", 0),
    )
    system_user_row = await cur.fetchone()
    assert system_user_row
    system_user_id: int = system_user_row[0]
    logger.info("System user id: {}", system_user_id)

    for doc in db.collection("user").stream():
        user_doc = UserDoc.model_validate(doc.to_dict())
        await cur.execute(
            """
            insert into sabqcha_user (
                public_id, display_name, score
            )
            values (%s, %s, %s)
            """,
            (doc.id, user_doc.display_name, user_doc.score),
        )
        logger.info("Inserting user_id: {}", doc.id)

    for doc in db.collection("transcription").stream():
        trans = TranscriptionDoc.model_validate(doc.to_dict())

        user_row_id = (
            await id_map.get_user_row_id(cur, trans.user_id) if trans.user_id else system_user_id
        )
        assert user_row_id is not None
        await cur.execute(
            """
            insert into transcription (
                public_id, file_path, title, sabqcha_user_row_id, transcribed_content
            )
            values (%s, %s, %s, %s, %s)
            returning id
            """,
            (
                internal_id(),
                trans.audio_file_path,
                trans.title or "No Title",
                user_row_id,
                trans.transcribed_content,
            ),
        )
        trans_row = await cur.fetchone()
        assert trans_row
        trans_row_id: int = trans_row[0]

        for mcq in trans.mcqs:
            await cur.execute(
                """
                insert into mcq (
                    public_id, transcription_row_id, question, options, answer
                )
                values (%s, %s, %s, %s, %s)
                """,
                (internal_id(), trans_row_id, mcq.question, mcq.options, mcq.answer),
            )

    await cur.connection.commit()
