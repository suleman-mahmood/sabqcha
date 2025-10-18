from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class Task(BaseModel):
    id: str
    question: str
    answer: str
    options: list[str]


class WeekDay(StrEnum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"


class TaskSet(BaseModel):
    id: str
    day: WeekDay
    lecture_name: str
    tasks: list[Task]


class TaskAttempted(BaseModel):
    answer: str
    did_skip: bool


class TaskSetAttemptRes(BaseModel):
    id: str
    time_elapsed: int
    correct_count: int
    incorrect_count: int
    skip_count: int
    accuracy: float
    created_at: datetime
    user_attempts: list[TaskAttempted]


class TaskSetRes(BaseModel):
    id: str
    day: WeekDay
    attempts: list[TaskSetAttemptRes]


class ListTaskSetAttemptsRes(BaseModel):
    room_id: str
    room_display_name: str
    score: int
    task_sets: list[TaskSetRes]
