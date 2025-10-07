import os
import sys

from psycopg import AsyncCursor

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from loguru import logger
from psycopg_pool import AsyncConnectionPool

from api.routes import transcribe_routes
from api.routes import task_routes
from api.routes import leaderboard_routes
from api.dependencies import get_cursor
from api import dependencies


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


# Setup FastAPI
app = FastAPI()

# Setup PG lifcycle
dbname = os.getenv("SABQCHA_PG_DB")
user = os.getenv("SABQCHA_PG_USER")
password = os.getenv("SABQCHA_PG_PASSWORD")
host = os.getenv("SABQCHA_PG_HOST")
port = os.getenv("SABQCHA_PG_PORT")

assert dbname and user and password and host and port


@app.on_event("startup")
async def on_startup():
    dependencies.pool = AsyncConnectionPool(
        f"dbname={dbname} user={user} password={password} host={host} port={port}",
        min_size=1,
        max_size=10,
    )
    logger.info("PG Pool initialized")


@app.on_event("shutdown")
async def on_shutdown():
    if dependencies.pool:
        await dependencies.pool.close()
        logger.info("PG Pool closed")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,  # Allow cookies, authorization headers, etc.
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.include_router(transcribe_routes.router)
app.include_router(task_routes.router)
app.include_router(leaderboard_routes.router)


@app.get("/health-check")
async def health_check():
    return "Hii there!"


@app.get("/health-check-pg")
async def health_check_pg(cur: AsyncCursor = Depends(get_cursor)):
    await cur.execute("select version();")
    v = await cur.fetchone()
    logger.info("PG Version: {}", v)

    return "PG works!"
