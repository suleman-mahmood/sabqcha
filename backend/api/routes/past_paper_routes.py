from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse
from google.cloud.storage import Bucket
from openai import AsyncOpenAI
from pydantic import BaseModel

from api.controllers import grade_controller
from api.dal import past_paper_db
from api.dependencies import DataContext, get_bucket, get_data_context, get_openai_client
from api.models.past_paper_models import PastPaper
from api.models.user_models import UserRole

router = APIRouter(prefix="/past-paper")


@router.get("/room/{room_id}/random", response_model=PastPaper)
async def get_random_past_paper(
    room_id: str, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.STUDENT

    subject_id = await past_paper_db.get_subject_id_for_room(data_context, room_id)
    if not subject_id:
        raise HTTPException(status_code=400, detail="No subject found for this room")

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
    background_tasks: BackgroundTasks,
    bucket: Bucket = Depends(get_bucket),
    openai_client: AsyncOpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    in_progress = await grade_controller.grade_question(
        background_tasks,
        data_context,
        bucket,
        openai_client,
        past_paper_id=past_paper_id,
        solution_file_path=body.solution_file_path,
        user_id=data_context.user_id,
    )
    if in_progress:
        return JSONResponse(
            GradeSolutionResponse(comment="Task in progress, submit again in a min").model_dump(
                mode="json"
            )
        )

    comment = await past_paper_db.get_student_graded_solution(
        data_context, data_context.user_id, past_paper_id
    )
    assert comment

    # TODO: Fetch solution and return
    return JSONResponse(GradeSolutionResponse(comment=comment).model_dump(mode="json"))
