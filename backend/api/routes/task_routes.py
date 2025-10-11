from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.dependencies import DataContext, get_data_context
from api.dal import task_db
from api.models.user_models import UserRole
from api.dal import room_db


router = APIRouter(prefix="/task")


class TaskAttempted(BaseModel):
    answer: str
    did_skip: bool


class SubmitTaskBody(BaseModel):
    tasks: list[TaskAttempted]


@router.post("/set/{task_set_id}")
async def submit_task_set(
    task_set_id: str, body: SubmitTaskBody, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.STUDENT

    mcqs = await task_db.get_task_set(data_context, task_set_id)
    assert mcqs

    score = 0

    for mcq, mcq_attempt in zip(mcqs.tasks, body.tasks):
        if mcq_attempt.did_skip:
            continue

        if mcq_attempt.answer != mcq.answer:
            score -= 1
        else:
            score += 3

    score = max(score, 0)

    room_id = await room_db.get_room_for_task_set(data_context, task_set_id)
    assert room_id
    await room_db.update_user_score(data_context, data_context.user_id, room_id, score)


@router.get("/lecture/{lecture_id}")
async def list_task_sets(data_context: DataContext = Depends(get_data_context)):
    pass


@router.get("/set/{task_set_id}")
async def get_task_set(task_set_id: str, data_context: DataContext = Depends(get_data_context)):
    task_set = await task_db.get_task_set(data_context, task_set_id)
    assert task_set

    return JSONResponse(task_set.model_dump(mode="json"))


@router.get("/{task_id}")
async def get_task(data_context: DataContext = Depends(get_data_context)):
    pass
