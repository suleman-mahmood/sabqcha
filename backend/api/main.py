import os
import firebase_admin
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
from loguru import logger
from firebase_admin import credentials, storage, firestore
from openai import OpenAI

from api.routes import transcribe_routes
from api.routes import task_routes


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
db = firestore.client()

# Setup OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Setup FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins
    allow_credentials=True,   # Allow cookies, authorization headers, etc.
    allow_methods=["*"],      # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],      # Allow all headers
)

app.include_router(transcribe_routes.router)
app.include_router(task_routes.router)

@app.get("/health-check")
async def health_check():
    return "Hii there!"
