from fastapi import APIRouter
from google.cloud.firestore import Increment
from loguru import logger
from pydantic import BaseModel

from api.models.transcription_models import TranscriptionDoc, UserDoc


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
async def submit_task(body: SubmitTaskBody):
    from api.main import db  # Circular import bs

    logger.info("Got data: {}", body.model_dump(mode="json"))

    doc = db.collection("transcription").document(body.transcription_id).get()
    trans = TranscriptionDoc.model_validate(doc.to_dict())

    score = 0

    for mcq_db, mcq_answer in zip(trans.mcqs, body.mcqs):
        if mcq_answer.did_skip:
            continue

        if mcq_answer.answer != mcq_db.answer:
            score -= 1
        else:
            score += 3

    score = max(score, 0)

    user_doc_ref = db.collection("user").document(body.user_id)
    user_doc = user_doc_ref.get()
    if user_doc.exists:
        user_doc_ref.update({"score": Increment(score)})
    else:
        user = UserDoc(display_name=body.display_name, score=score)
        db.collection("user").add(user.model_dump(mode="json"), document_id=body.user_id)
