import os
from fastapi import APIRouter, Response
from loguru import logger
import requests

router = APIRouter(prefix="/transcribe")

UPLIFT_BASE_URL = "https://api.upliftai.org/v1"
UPLIFT_API_KEY = os.getenv("UPLIFT_API_KEY")


@router.get("")
async def check_transcribe():
    return Response("Inside transcribe")

@router.post("")
async def transcribe():
    files = {
        "file": open("physics_class_9_part_1.mp3", "rb")
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
        return
