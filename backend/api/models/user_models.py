from enum import StrEnum

from pydantic import BaseModel


class UserRole(StrEnum):
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


class AuthData(BaseModel):
    user_id: str
    role: UserRole


class User(BaseModel):
    id: str
    display_name: str


class StudentUser(User):
    score: int
