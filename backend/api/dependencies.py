import os
import firebase_admin

from psycopg_pool import ConnectionPool
from firebase_admin import credentials, storage, firestore
from openai import OpenAI


# Setup PG
dbname = os.getenv("SABQCHA_PG_DB")
user = os.getenv("SABQCHA_PG_USER")
password = os.getenv("SABQCHA_PG_PASSWORD")
host = os.getenv("SABQCHA_PG_HOST")
port = os.getenv("SABQCHA_PG_PORT")

assert dbname and user and password and host and port

_pool = ConnectionPool(f"dbname={dbname} user={user} password={password} host={host} port={port}", min_size=1, max_size=10)


# Setup Firebase
_cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(_cred, {
    "storageBucket": "sabqcha.firebasestorage.app"
})
_bucket = storage.bucket()
_db = firestore.client()


# Setup OpenAI
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_cursor():
    with _pool.connection() as conn:
        with conn.cursor() as cur:
            yield cur

def get_bucket():
    return _bucket

def get_firestore():
    return _db

def get_openai_client():
    return _openai_client
