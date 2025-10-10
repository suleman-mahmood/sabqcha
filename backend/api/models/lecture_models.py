from pydantic import BaseModel

from api.models.task_models import TaskSet


class Lecture(BaseModel):
    id: str
    room_id: str
    file_path: str
    title: str
    transcribed_content: str | None


class LectureEntry(BaseModel):
    id: str
    title: str
    task_sets: list[TaskSet]
