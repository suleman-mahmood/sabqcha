from enum import StrEnum

from pydantic import BaseModel


class Quiz(BaseModel):
    id: str
    room_id: str
    title: str
    answer_sheet_path: str
    rubric_path: str
    ms_llm_content_extract_content: str | None = None
    rubric_llm_content_extract_content: str | None = None


class StudentSolution(BaseModel):
    id: str
    quiz_id: str
    title: str
    solution_path: str
    graded_llm_content_extract_content: str | None = None


class LLM_CONTENT_EXTRACT_TYPE(StrEnum):
    RUBRIC = "RUBRIC"
    MARKING_SCHEME = "MARKING_SCHEME"
    GRADED_STUDENT_SOLUTION = "GRADED_STUDENT_SOLUTION"


class LlmContentExtract(BaseModel):
    id: str
    content: str
    content_type: LLM_CONTENT_EXTRACT_TYPE
