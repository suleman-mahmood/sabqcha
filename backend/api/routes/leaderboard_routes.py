
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from google.cloud.firestore import Client

from api.models.transcription_models import UserDocWithId
from api.dependencies import get_firestore


router = APIRouter(prefix="/leaderboard")

@router.get("")
async def get_leaderboard(db: Client = Depends(get_firestore)):
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

