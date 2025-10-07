
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from psycopg import AsyncCursor

from api.dependencies import get_cursor
from api.dal import user_db


router = APIRouter(prefix="/leaderboard")

@router.get("")
async def get_leaderboard(cur: AsyncCursor = Depends(get_cursor)):
    user_docs = await user_db.list_users(cur)
    user_docs = sorted(user_docs, key=lambda u: u.score, reverse=True)

    res = [
        {**ud.model_dump(mode="json"), "rank": rank}
        for rank, ud in enumerate(user_docs, start=1)
    ]

    return JSONResponse(content=res)

