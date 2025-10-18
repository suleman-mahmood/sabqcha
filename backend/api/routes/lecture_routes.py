from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from google.cloud.storage import Bucket
from loguru import logger
from openai import OpenAI
from pydantic import BaseModel

from api.controllers import transcribe_controller
from api.dal import lecture_db, room_db
from api.dependencies import DataContext, get_bucket, get_data_context, get_openai_client
from api.models.lecture_models import LectureWeekRes, ListLecturesRes
from api.models.user_models import UserRole

router = APIRouter(prefix="/lecture")


class CreateLectureBody(BaseModel):
    room_id: str
    file_path: str
    title: str


@router.post("")
async def create_lecture(
    body: CreateLectureBody,
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER

    lecture_group_id = await lecture_db.get_this_week_lecture_group(data_context, body.room_id)
    await lecture_db.insert_lecture(data_context, lecture_group_id, body.file_path, body.title)


@router.post("/group/{lecture_group_id}")
async def transcribe_lecture_group(
    lecture_group_id: str,
    background_tasks: BackgroundTasks,
    openai_client: OpenAI = Depends(get_openai_client),
    bucket: Bucket = Depends(get_bucket),
    data_context: DataContext = Depends(get_data_context),
):
    in_progress = await transcribe_controller.transcribe(
        background_tasks, data_context, bucket, openai_client, lecture_group_id=lecture_group_id
    )
    if in_progress:
        return JSONResponse({"message": "Tasks are being generated..."})
    return JSONResponse({"message": "Tasks generated, please refresh page"})


@router.get("/room/{room_id}", response_model=ListLecturesRes)
async def list_lectures(room_id: str, data_context: DataContext = Depends(get_data_context)):
    this_week, pas_weeks = await lecture_db.list_lectures_ui(data_context, room_id)
    room = await room_db.get_room(data_context, room_id)
    assert room

    res = ListLecturesRes(
        room=room,
        this_week=this_week
        or LectureWeekRes(
            week_name="Current Week",
            lecture_group_id="no-lecture-group-yet",
            lectures=[],
            task_sets=[],
        ),
        past_weeks=pas_weeks,
    )

    return JSONResponse(res.model_dump(mode="json"))
