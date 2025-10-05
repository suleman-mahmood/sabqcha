import firebase_admin
import sys

from fastapi import FastAPI
from dotenv import load_dotenv
from loguru import logger
from firebase_admin import credentials, storage
from api.routes import transcribe_routes

load_dotenv()

# Setup logger
logger.remove()

# Configure output to console
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level> | "
           "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
           "<level>{message}</level>"
)

# Setup Firebase
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "sabqcha.firebasestorage.app"
})
bucket = storage.bucket()

# Setup FastAPI
app = FastAPI()

app.include_router(transcribe_routes.router)

@app.get("/health-check")
async def health_check():
    return "Hii there!"
