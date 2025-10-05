import os
import requests
import tempfile

from fastapi import APIRouter, Response
from loguru import logger
from pydantic import BaseModel


router = APIRouter(prefix="/transcribe")

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")

class TranscribeBody(BaseModel):
    file_url: str

@router.post("")
async def transcribe(body: TranscribeBody):
    from api.main import bucket # Circular import bs

    with tempfile.NamedTemporaryFile(suffix=".mp3") as temp_file:
        blob = bucket.blob(body.file_url)
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
