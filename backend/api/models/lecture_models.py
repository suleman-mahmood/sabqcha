from datetime import datetime

from pydantic import BaseModel

from api.models.room_models import Room
from api.models.task_models import WeekDay


class Lecture(BaseModel):
    id: str
    room_id: str
    file_path: str
    title: str


class LectureEntryRes(BaseModel):
    id: str
    title: str
    file_path: str
    created_at: datetime


class TaskSetRes(BaseModel):
    id: str
    day: WeekDay


class LectureWeekRes(BaseModel):
    lecture_group_id: str
    week_name: str
    lectures: list[LectureEntryRes]
    task_sets: list[TaskSetRes]


class ListLecturesRes(BaseModel):
    room: Room
    this_week: LectureWeekRes
    past_weeks: list[LectureWeekRes]
