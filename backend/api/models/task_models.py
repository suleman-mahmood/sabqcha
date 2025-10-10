from pydantic import BaseModel


class Task(BaseModel):
    id: str
    question: str
    answer: str
    options: list[str]
