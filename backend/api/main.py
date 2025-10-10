from contextlib import asynccontextmanager
import os
import sys

from psycopg import AsyncCursor

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from loguru import logger
from psycopg_pool import AsyncConnectionPool

from api.routes import task_routes
from api.routes import leaderboard_routes
from api.dependencies import get_cursor
from api import dependencies
from api.dal import session_db
from api.routes import user_routes
from api.routes import lecture_routes, room_routes


# Setup logger
logger.remove()

# Configure output to console
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
    "<level>{message}</level>",
)


# Setup PG lifcycle
dbname = os.getenv("SABQCHA_PG_DB")
user = os.getenv("SABQCHA_PG_USER")
password = os.getenv("SABQCHA_PG_PASSWORD")
host = os.getenv("SABQCHA_PG_HOST")
port = os.getenv("SABQCHA_PG_PORT")

assert dbname and user and password and host and port


@asynccontextmanager
async def lifespan(_: FastAPI):
    dependencies.pool = AsyncConnectionPool(
        f"dbname={dbname} user={user} password={password} host={host} port={port}",
        min_size=5,
        max_size=10,
        open=False,
    )
    await dependencies.pool.open()
    logger.info("PG Pool initialized")

    yield

    await dependencies.pool.close()
    dependencies.pool = None
    logger.info("PG Pool closed")


# Setup FastAPI
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,  # Allow cookies, authorization headers, etc.
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if (
        request.url.path.startswith("/user/device")
        or request.url.path.startswith("/user/login-teacher")
        or request.url.path.startswith("/docs")
        or request.url.path.startswith("/openapi.json")
    ):
        response = await call_next(request)
        return response

    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(401, detail="Unauthorized")
    if not dependencies.pool:
        raise HTTPException(500, detail="PG Pool not initialized in auth middleware")

    async with dependencies.pool.connection() as conn:
        async with conn.cursor() as cur:
            auth_data = await session_db.get_session(cur, token)

    if not auth_data:
        raise HTTPException(401, detail="Unauthorized")

    request.state.auth_data = auth_data.model_dump(mode="json")
    response = await call_next(request)
    return response


app.include_router(user_routes.router)
app.include_router(leaderboard_routes.router)
app.include_router(lecture_routes.router)
app.include_router(room_routes.router)
app.include_router(task_routes.router)


@app.get("/health-check")
async def health_check():
    return "Hii there!"


@app.get("/health-check-pg")
async def health_check_pg(cur: AsyncCursor = Depends(get_cursor)):
    await cur.execute("select version();")
    v = await cur.fetchone()
    logger.info("PG Version: {}", v)

    return "PG works!"
