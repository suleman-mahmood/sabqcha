from enum import StrEnum
from pydantic import BaseModel


class UserRole(StrEnum):
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


class AuthData(BaseModel):
    user_id: str
    role: UserRole


class StudentUser(BaseModel):
    id: str
    display_name: str
    score: int
