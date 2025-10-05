import os
from fastapi.responses import JSONResponse
import requests
import tempfile

from fastapi import APIRouter, Response
from loguru import logger
from pydantic import BaseModel

from api.models.transcription_models import LlmMcqResponse, TranscriptionDoc
from api.prompts import DUMMY_DATA_SYSTEM_PROMPT, MCQ_SYSTEM_PROMPT, generate_dummy_data_user_prompt, generate_mcq_user_prompt


router = APIRouter(prefix="/transcribe")

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")

class TranscribeBody(BaseModel):
    file_path: str

@router.post("")
async def transcribe(body: TranscribeBody):
    from api.main import bucket, db, openai_client # Circular import bs

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

    doc = TranscriptionDoc(audio_file_path=body.file_path, transcribed_content=transcript)
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
    doc_ref.update({"llm_raw_response": llm_res})

    # Save these mcqs
    doc_ref.update({
        "mcqs": [m.model_dump(mode="json") for m in llm_res.mcqs]
    })

@router.get("/list")
async def get_all_transcription_docs():
    from api.main import db  # Circular import bs

    docs = [doc.id for doc in db.collection("transcription").stream()]
    return JSONResponse(content={"doc_ids": docs})

@router.get("/mcqs/{transcription_id}")
async def get_transcription_mcqs(transcription_id: str):
    from api.main import db  # Circular import bs

    doc = db.collection("transcription").document(transcription_id).get()
    trans = TranscriptionDoc.model_validate(doc.to_dict())

    res = {"mcqs": [m.model_dump(mode="json") for m in trans.mcqs]}
    return JSONResponse(content=res)

@router.get("/create-demo-mcqs")
async def create_demo_mcqs():
    from api.main import db, openai_client  # Circular import bs


    topics = [
        # "Newton's law of motion",
        # "Work, Engergy, Power",
        # "Waves and Sound",
        # "Quadratic Equations and Functions"
        # "Trigonometric Identities and Applications"
        "Distributed Systems",
        "Computer Graphics",
        "Computer Vision",
        "Business Communication",
        "Psychology",
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
            audio_file_path="dummy.mp3",
            transcribed_content="dummy-data",
            mcqs=llm_res.mcqs,
        )
        db.collection("transcription").add(doc.model_dump(mode="json"))
