import os
import firebase_admin
from loguru import logger

from psycopg_pool import AsyncConnectionPool
from firebase_admin import credentials, storage, firestore
from openai import OpenAI


# Setup PG
pool: AsyncConnectionPool | None = None

# Setup Firebase
_cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(_cred, {"storageBucket": "sabqcha.firebasestorage.app"})
_bucket = storage.bucket()
_db = firestore.client()


# Setup OpenAI
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def get_cursor():
    if not pool:
        logger.error("Getting cursor before pool is initialized")
        raise Exception("Getting cursor before pool is initialized")

    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            yield cur


def get_bucket():
    return _bucket


def get_firestore():
    return _db


def get_openai_client():
    return _openai_client
