from datetime import datetime
from pydantic import BaseModel

class Quiz(BaseModel):
    id: str
    room_id: str
    title: str
    answer_sheet_content: str | None
    rubric_content: str | None
    answer_sheet_path: str | None = None
    rubric_path: str | None = None
    created_by: str
    created_at_utc: datetime
    updated_by: str
    updated_at_utc: datetime

class StudentSolutions(BaseModel):
    id: str
    solution_content: str