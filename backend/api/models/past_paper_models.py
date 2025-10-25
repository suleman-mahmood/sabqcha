from pydantic import BaseModel


class PastPaper(BaseModel):
    id: str
    subject: str
    season: str
    year: int
    paper: int
    variant: int
    question_file_path: str
    marking_scheme_file_path: str
