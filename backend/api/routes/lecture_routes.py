from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google.cloud.storage import Bucket
from openai import OpenAI

from api.dependencies import DataContext, get_data_context, get_bucket, get_openai_client
from api.dal import lecture_db
from api.models.user_models import UserRole
from api.controllers import transcribe_controller

router = APIRouter(prefix="/lecture")


class CreateLectureBody(BaseModel):
    room_id: str
    file_path: str
    title: str


@router.post("")
async def create_lecture(
    body: CreateLectureBody,
    background_tasks: BackgroundTasks,
    data_context: DataContext = Depends(get_data_context),
    openai_client: OpenAI = Depends(get_openai_client),
    bucket: Bucket = Depends(get_bucket),
):
    assert data_context.user_role == UserRole.TEACHER

    lecture_id = await lecture_db.insert_lecture(
        data_context, body.room_id, body.file_path, body.title
    )

    background_tasks.add_task(
        transcribe_controller.transcribe, data_context, bucket, openai_client, lecture_id
    )


@router.get("")
async def get_lecture(data_context: DataContext = Depends(get_data_context)):
    pass


@router.get("/room/{room_id}")
async def list_lectures(room_id: str, data_context: DataContext = Depends(get_data_context)):
    lectures = await lecture_db.list_lectures(data_context, room_id)

    return JSONResponse({"lectures": [le.model_dump(mode="json") for le in lectures]})
