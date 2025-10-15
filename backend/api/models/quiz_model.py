from datetime import datetime
from pydantic import BaseModel

class Quiz(BaseModel):
    title: str
    answer_sheet_content: str
    rubric_content: str
    created_by: str
    created_at_utc: datetime
    updated_by: str
    updated_at_utc: datetime

class StudentSolutions(BaseModel):
    id: str
    solution_content: str