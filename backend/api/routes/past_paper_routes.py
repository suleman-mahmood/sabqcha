from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.dal import past_paper_db
from api.dependencies import DataContext, get_data_context
from api.models.past_paper_models import PastPaper
from api.models.user_models import UserRole

router = APIRouter(prefix="/past-paper")


@router.get("/room/{room_id}/random", response_model=PastPaper)
async def get_random_past_paper(
    room_id: str, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.STUDENT

    subject_id = await past_paper_db.get_subject_id_for_room(data_context, room_id)
    assert subject_id

    paper = await past_paper_db.get_random_past_paper(data_context, subject_id)
    assert paper

    return JSONResponse(paper.model_dump(mode="json"))


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
    return JSONResponse(
        GradeSolutionResponse(comment="Grading in progress, refresh in 2 mins").model_dump(
            mode="json"
        )
    )
