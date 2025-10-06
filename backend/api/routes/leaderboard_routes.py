
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.models.transcription_models import UserDocWithId


router = APIRouter(prefix="/leaderboard")

@router.get("")
async def get_leaderboard():
    from api.main import db  # Circular import bs

    user_docs = [
        UserDocWithId.model_validate({**doc.to_dict(), "user_id": doc.id})
        for doc in db.collection("user").stream()
    ]
    user_docs = sorted(user_docs, key=lambda u: u.score, reverse=True)

    res = [
        {**ud.model_dump(mode="json"), "rank": rank}
        for rank, ud in enumerate(user_docs, start=1)
    ]

    return JSONResponse(content=res)

