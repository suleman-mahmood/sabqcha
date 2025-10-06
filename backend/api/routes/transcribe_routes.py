import os
from fastapi.responses import JSONResponse
from google.cloud.firestore import Client
from google.cloud.storage import Bucket
from openai import OpenAI
import requests
import tempfile

from fastapi import APIRouter, Depends, Response
from loguru import logger
from pydantic import BaseModel

from api.models.transcription_models import LlmMcqResponse, TranscriptionDoc
from api.prompts import DUMMY_DATA_SYSTEM_PROMPT, MCQ_SYSTEM_PROMPT, generate_dummy_data_user_prompt, generate_mcq_user_prompt
from api.dependencies import get_bucket, get_firestore, get_openai_client


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
    db: Client = Depends(get_firestore),
    openai_client: OpenAI = Depends(get_openai_client),
    bucket: Bucket = Depends(get_bucket),
):
    with tempfile.NamedTemporaryFile(suffix=".mp3") as temp_file:
        blob = bucket.blob(body.file_path)
        blob.download_to_filename(temp_file.name)

        files = {
            "file": ("audio.mp3", temp_file, "audio/mpeg")
        }
        data = {
            "model": "scribe",
            "language": "ur"
        }
        headers = {
            "Authorization": f"Bearer {UPLIFT_API_KEY}"
        }

        response = requests.post(f"{UPLIFT_BASE_URL}/transcribe/speech-to-text", headers=headers, files=files, data=data)

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

    doc = TranscriptionDoc(
        audio_file_path=body.file_path,
        transcribed_content=transcript,
        title=body.title,
        user_id=body.user_id
    )
    _, doc_ref = db.collection("transcription").add(doc.model_dump())
    doc_id: str = doc_ref.id

    # Define the messages
    openai_res = openai_client.responses.parse(
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": MCQ_SYSTEM_PROMPT},
            {"role": "user", "content": generate_mcq_user_prompt(transcript)}
        ],
        text_format=LlmMcqResponse
    )
    llm_res = openai_res.output_parsed
    if not llm_res:
        logger.error("Invalid Response form OpenAI: {}", openai_res.model_dump(mode="json"))
        return Response("Invalid response from OpenAI", status_code=400)

    doc_ref = db.collection("transcription").document(doc_id)

    # Save these mcqs
    doc_ref.update({
        "mcqs": [m.model_dump(mode="json") for m in llm_res.mcqs]
    })

class TranscriptionListEntryResponse(BaseModel):
    doc_id: str
    title: str

@router.get("/list")
async def get_all_transcription_docs(db: Client = Depends(get_firestore)):
    res = [
        TranscriptionListEntryResponse(doc_id=doc.id, title=doc.to_dict().get("title", "No Title")).model_dump(mode="json")
        for doc in db.collection("transcription").stream()
    ]
    return JSONResponse(content={"data": res})

@router.get("/mcqs/{transcription_id}")
async def get_transcription_mcqs(transcription_id: str, db: Client = Depends(get_firestore)):
    doc = db.collection("transcription").document(transcription_id).get()
    trans = TranscriptionDoc.model_validate(doc.to_dict())

    res = {"mcqs": [m.model_dump(mode="json") for m in trans.mcqs], "title": trans.title}
    return JSONResponse(content=res)

@router.get("/create-demo-mcqs")
async def create_demo_mcqs(db: Client = Depends(get_firestore), openai_client: OpenAI = Depends(get_openai_client)):
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
                {"role": "user", "content": generate_dummy_data_user_prompt(topic)}
            ],
            text_format=LlmMcqResponse
        )
        llm_res = openai_res.output_parsed
        if not llm_res:
            logger.error("Invalid Response form OpenAI: {}", openai_res.model_dump(mode="json"))
            return Response("Invalid response from OpenAI", status_code=400)

        doc = TranscriptionDoc(
            user_id="system",
            title=topic,
            audio_file_path="dummy.mp3",
            transcribed_content="dummy-data",
            mcqs=llm_res.mcqs,
        )
        db.collection("transcription").add(doc.model_dump(mode="json"))
