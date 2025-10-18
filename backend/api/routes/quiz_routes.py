from ..controllers import grade_controller
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google.cloud.storage import Bucket
from openai import OpenAI

from api.dependencies import DataContext, get_data_context, get_bucket, get_openai_client
from api.models.user_models import UserRole
from api.dal import quiz_db
from api.controllers import transcribe_controller


router = APIRouter(prefix="/quiz")


class CreateQuizBody(BaseModel):
    room_id: str
    title: str
    answer_sheet_path: str | None = None
    rubric_path: str | None = None
    lecture_ids: list[str] | None = None

class UploadSolutionBody(BaseModel):
    title: str
    solution_path: str

class UpdateAttachmentsBody(BaseModel):
    answer_sheet_path: str | None = None
    rubric_path: str | None = None


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

    if body.answer_sheet_path or body.rubric_path:
        background_tasks.add_task(
            transcribe_controller.transcribe_quiz, data_context, bucket, openai_client, quiz_id
        )

    return JSONResponse({"id": quiz_id})

@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str, data_context: DataContext = Depends(get_data_context)):
    quiz = await quiz_db.get_quiz(data_context, quiz_id)
    assert quiz
    return JSONResponse(quiz.model_dump(mode="json"))

@router.post("/{quiz_id}/transcribe")
async def transcribe_quiz(
    quiz_id: str,
    background_tasks: BackgroundTasks,
    bucket: Bucket = Depends(get_bucket),
    openai_client: OpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER
    background_tasks.add_task(transcribe_controller.transcribe_quiz, data_context, bucket, openai_client, quiz_id)
    return JSONResponse({"status": "scheduled"})

@router.get("/room/{room_id}")
async def list_quizzes(room_id: str, data_context: DataContext = Depends(get_data_context)):
    assert data_context.user_role == UserRole.TEACHER
    
    quizzes = await quiz_db.list_quizzes_for_room(data_context, room_id)
    return JSONResponse([q.model_dump(mode="json") for q in quizzes])

@router.post("/{quiz_id}/solutions", status_code=201)
async def upload_solution(
    quiz_id: str,
    body: UploadSolutionBody,
    background_tasks: BackgroundTasks,
    bucket: Bucket = Depends(get_bucket),
    openai_client: OpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER
    title = body.title.strip()
    solution_path = body.solution_path.strip()

    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    if not solution_path:
        raise HTTPException(status_code=400, detail="solution_path is required")

    solution_id = await quiz_db.insert_student_solution(
        data_context,
        quiz_id,
        title,
        solution_path,
    )

    background_tasks.add_task(
        transcribe_controller.transcribe_solution,
        data_context,
        bucket,
        openai_client,
        solution_id,
    )

    return JSONResponse({"id": solution_id})


@router.get("/{quiz_id}/solutions")
async def list_solutions(
    quiz_id: str,
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER
    solutions = await quiz_db.list_student_solutions_for_quiz(data_context, quiz_id)
    return JSONResponse([s.model_dump(mode="json") for s in solutions])


@router.post("/{quiz_id}/attachments", status_code=202)
async def upload_quiz_attachments(
    quiz_id: str,
    body: UpdateAttachmentsBody,
    background_tasks: BackgroundTasks,
    bucket: Bucket = Depends(get_bucket),
    openai_client: OpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER

    answer_path = body.answer_sheet_path.strip() if body.answer_sheet_path else None
    rubric_path = body.rubric_path.strip() if body.rubric_path else None

    if not answer_path and not rubric_path:
        raise HTTPException(status_code=400, detail="Provide answer_sheet_path and/or rubric_path")

    await quiz_db.update_quiz_paths(
        data_context,
        quiz_id,
        answer_sheet_path=answer_path,
        rubric_path=rubric_path,
    )

    background_tasks.add_task(
        transcribe_controller.transcribe_quiz,
        data_context,
        bucket,
        openai_client,
        quiz_id,
    )

    return JSONResponse({"status": "scheduled"})


@router.post("/{quiz_id}/grade")
async def grade_quiz(
    quiz_id: str,
    bucket: Bucket = Depends(get_bucket),
    openai_client: OpenAI = Depends(get_openai_client),
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER
    
    solution_ids = await quiz_db.list_student_solutions_for_quiz(quiz_id=quiz_id)

    for solution_id in solution_ids:
        await grade_controller.grade_quiz( data_context, bucket, openai_client, quiz_id = quiz_id, solution_id = solution_id)

    return JSONResponse({"status": "scheduled"})