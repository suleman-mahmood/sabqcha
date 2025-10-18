from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse
from google.cloud.storage import Bucket
from openai import OpenAI
from pydantic import BaseModel

from api.controllers import transcribe_controller
from api.dal import quiz_db
from api.dependencies import DataContext, get_bucket, get_data_context, get_openai_client
from api.models.user_models import UserRole

from ..controllers import grade_controller

router = APIRouter(prefix="/quiz")


class CreateQuizBody(BaseModel):
    room_id: str
    title: str
    answer_sheet_path: str
    rubric_path: str


class UploadSolutionBody(BaseModel):
    title: str
    solution_path: str


@router.post("", status_code=201)
async def create_quiz(
    body: CreateQuizBody,
    background_tasks: BackgroundTasks,
    bucket: Bucket = Depends(get_bucket),
    openai_client: OpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER

    quiz_id = await quiz_db.insert_quiz(
        data_context,
        body.room_id,
        body.title,
        answer_sheet_path=body.answer_sheet_path,
        rubric_path=body.rubric_path,
    )

    await transcribe_controller.transcribe_quiz(
        background_tasks, data_context, bucket, openai_client, quiz_id=quiz_id
    )

    return JSONResponse({"id": quiz_id})


@router.get("/room/{room_id}")
async def list_quizzes(room_id: str, data_context: DataContext = Depends(get_data_context)):
    assert data_context.user_role == UserRole.TEACHER

    quizzes = await quiz_db.list_quizzes_for_room(data_context, room_id)
    return JSONResponse([q.model_dump(mode="json") for q in quizzes])


@router.post("/{quiz_id}/solutions", status_code=201)
async def upload_solution(
    quiz_id: str, body: UploadSolutionBody, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.TEACHER
    title = body.title.strip()
    solution_path = body.solution_path.strip()

    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    if not solution_path:
        raise HTTPException(status_code=400, detail="solution_path is required")

    solution_id = await quiz_db.insert_student_solution(data_context, quiz_id, title, solution_path)

    return JSONResponse({"id": solution_id})


@router.get("/{quiz_id}/solutions")
async def list_solutions(
    quiz_id: str,
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER
    solutions = await quiz_db.list_student_solutions_for_quiz(data_context, quiz_id)
    return JSONResponse([s.model_dump(mode="json") for s in solutions])


@router.post("/{quiz_id}/grade")
async def grade_quiz(
    quiz_id: str,
    background_tasks: BackgroundTasks,
    bucket: Bucket = Depends(get_bucket),
    openai_client: OpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER

    all_solutions = await quiz_db.list_student_solutions_for_quiz(data_context, quiz_id=quiz_id)
    all_solutions_ids = [si.id for si in all_solutions]

    for solution_id in all_solutions_ids:
        await grade_controller.grade_quiz(
            background_tasks,
            data_context,
            bucket,
            openai_client,
            quiz_id=quiz_id,
            solution_id=solution_id,
        )

    return JSONResponse({"status": "scheduled"})
