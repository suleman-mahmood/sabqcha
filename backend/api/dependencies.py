import os
from contextlib import asynccontextmanager
from typing import TypeVar

import firebase_admin
from fastapi import Request
from firebase_admin import credentials, firestore, storage
from loguru import logger
from openai import OpenAI
from psycopg.rows import class_row
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel

from api.models.user_models import AuthData, UserRole

# Setup PG
pool: AsyncConnectionPool | None = None

# Setup Firebase
_cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(_cred, {"storageBucket": "sabqcha.firebasestorage.app"})
_bucket = storage.bucket()
_db = firestore.client()


# Setup OpenAI
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

T = TypeVar("T", bound=BaseModel)


class DataContext:
    def __init__(self, user_id: str, role: UserRole) -> None:
        self.user_id = user_id
        self.user_role = role

    @asynccontextmanager
    async def get_cursor(self):
        assert pool
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                yield cur
                await cur.connection.commit()

    @asynccontextmanager
    async def get_model_cursor(self, model: type[T]):
        assert pool
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=class_row(model)) as cur:
                yield cur
                await cur.connection.commit()


class UnAuthDataContext:
    @asynccontextmanager
    async def get_cursor(self):
        assert pool
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                yield cur
                await cur.connection.commit()


def get_un_auth_data_context() -> UnAuthDataContext:
    return UnAuthDataContext()


def get_data_context(request: Request) -> DataContext:
    auth_data: AuthData = AuthData.model_validate(request.state.auth_data)
    return DataContext(user_id=auth_data.user_id, role=auth_data.role)


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
