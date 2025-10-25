from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.dependencies import DataContext, get_data_context
from api.models.past_paper_models import PastPaper

router = APIRouter(prefix="/past-paper")


@router.get("/random", response_model=PastPaper)
async def get_random_past_paper(data_context: DataContext = Depends(get_data_context)):
    pass


class GradeSolutionBody(BaseModel):
    solution_file_path: str


class GradeSolutionResponse(BaseModel):
    comment: str


@router.post("/bank/{past_paper_id}", response_model=GradeSolutionResponse)
async def grade_solution(
    past_paper_id: str,
    body: GradeSolutionBody,
    data_context: DataContext = Depends(get_data_context),
):
    pass
