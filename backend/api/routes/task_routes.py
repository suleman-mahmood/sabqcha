from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.dependencies import DataContext, get_data_context
from api.dal import task_db
from api.models.user_models import UserRole
from api.dal import room_db
from api.models.task_models import TaskAttempted


router = APIRouter(prefix="/task")


class SubmitTaskBody(BaseModel):
    tasks: list[TaskAttempted]
    time_elapsed: int


@router.post("/set/{task_set_id}")
async def submit_task_set(
    task_set_id: str, body: SubmitTaskBody, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.STUDENT

    mcqs = await task_db.get_task_set(data_context, task_set_id)
    assert mcqs

    correct = 0
    incorrect = 0
    skip = 0
    score = 0

    for mcq, mcq_attempt in zip(mcqs.tasks, body.tasks):
        if mcq_attempt.did_skip:
            skip += 1
            continue

        if mcq_attempt.answer != mcq.answer:
            incorrect += 1
            score -= 1
        else:
            correct += 1
            score += 3

    score = max(score, 0)

    room_id = await room_db.get_room_for_task_set(data_context, task_set_id)
    assert room_id
    await room_db.update_user_score(data_context, data_context.user_id, room_id, score)
    await task_db.insert_attempt(
        data_context, task_set_id, body.tasks, correct, incorrect, skip, body.time_elapsed
    )


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
