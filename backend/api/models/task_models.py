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
