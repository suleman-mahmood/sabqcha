from fastapi import APIRouter, Depends
from psycopg import AsyncCursor
from pydantic import BaseModel

from api.dependencies import get_cursor
from api.dal import mcq_db, user_db


router = APIRouter(prefix="/task")

class McqAttempted(BaseModel):
    answer: str
    did_skip: bool


class SubmitTaskBody(BaseModel):
    transcription_id: str
    user_id: str
    display_name: str
    mcqs: list[McqAttempted]

@router.post("")
async def submit_task(body: SubmitTaskBody, cur: AsyncCursor = Depends(get_cursor)):
    mcqs = await mcq_db.list_mcqs(cur, body.transcription_id)

    score = 0

    for mcq, mcq_attempt in zip(mcqs, body.mcqs):
        if mcq_attempt.did_skip:
            continue

        if mcq_attempt.answer != mcq.answer:
            score -= 1
        else:
            score += 3

    score = max(score, 0)

    user_doc = await user_db.get_user(cur, body.user_id)
    if user_doc:
        await user_db.update_user_score(cur, body.user_id, user_doc.score + score)
    else:
        await user_db.insert_user(cur, body.display_name, score)
