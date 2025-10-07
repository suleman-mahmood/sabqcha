import os
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


router = APIRouter(prefix="/transcribe")

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")


class TranscribeBody(BaseModel):
    file_path: str
    title: str
    user_id: str


@router.post("")
async def transcribe(
    body: TranscribeBody,
    cur: AsyncCursor = Depends(get_cursor),
    openai_client: OpenAI = Depends(get_openai_client),
    bucket: Bucket = Depends(get_bucket),
):
    with tempfile.NamedTemporaryFile(suffix=".mp3") as temp_file:
        blob = bucket.blob(body.file_path)
        blob.download_to_filename(temp_file.name)

        files = {"file": ("audio.mp3", temp_file, "audio/mpeg")}
        data = {"model": "scribe", "language": "ur"}
        headers = {"Authorization": f"Bearer {UPLIFT_API_KEY}"}

        response = requests.post(
            f"{UPLIFT_BASE_URL}/transcribe/speech-to-text", headers=headers, files=files, data=data
        )

    logger.info("Response Status: {}", response.status_code)

    res_json = response.json()
    logger.info("Json: {}", res_json)

    if response.status_code != 200:
        logger.error("Uplift API Failed")
        return Response("Uplift API Failed", status_code=400)

    if "transcript" not in res_json:
        logger.error("No transcribtions in response")
        return Response("Uplift API Failed", status_code=400)

    transcript = res_json["transcript"]

    trans_id = await transcription_db.insert_transcription(
        cur, body.file_path, body.title, body.user_id, transcript
    )

    openai_res = openai_client.responses.parse(
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": MCQ_SYSTEM_PROMPT},
            {"role": "user", "content": generate_mcq_user_prompt(transcript)},
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
