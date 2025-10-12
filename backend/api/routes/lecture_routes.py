from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from loguru import logger
from pydantic import BaseModel

from api.dependencies import DataContext, get_data_context
from api.dal import lecture_db
from api.models.user_models import UserRole
from api.dal import room_db
from api.models.lecture_models import LectureWeekRes, ListLecturesRes

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
    await lecture_db.insert_lecture(
        data_context, body.room_id, lecture_group_id, body.file_path, body.title
    )


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

    logger.info("This week: {}", this_week)

    return JSONResponse(res.model_dump(mode="json"))
