from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from api.dependencies import DataContext, get_data_context
from api.dal import user_db


router = APIRouter(prefix="/leaderboard")


@router.get("")
async def get_leaderboard(data_context: DataContext = Depends(get_data_context)):
    user_docs = await user_db.list_students(data_context)
    user_docs = sorted(user_docs, key=lambda u: u.score, reverse=True)

    res = [
        {**ud.model_dump(mode="json"), "rank": rank} for rank, ud in enumerate(user_docs, start=1)
    ]

    return JSONResponse(content=res)
