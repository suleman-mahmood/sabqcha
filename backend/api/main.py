import sys

from psycopg import Cursor

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from loguru import logger

from api.routes import transcribe_routes
from api.routes import task_routes
from api.routes import leaderboard_routes
from api.dependencies import get_cursor


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
app.include_router(leaderboard_routes.router)

@app.get("/health-check")
async def health_check():
    return "Hii there!"

@app.get("/health-check-pg")
async def health_check_pg(cur: Cursor = Depends(get_cursor)):
    cur.execute("select version();")
    v = cur.fetchone()
    logger.info("PG Version: {}", v)

    return f"PG works!"
