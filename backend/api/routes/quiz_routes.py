from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google.cloud.storage import Bucket
from openai import OpenAI

from api.dependencies import DataContext, get_data_context, get_bucket, get_openai_client
from api.models.user_models import UserRole
from api.models.quiz_model import StudentSolutions
from api.dal import quiz_db
from api.controllers import transcribe_controller


router = APIRouter(prefix="/quiz")


class CreateQuizBody(BaseModel):
    room_id: str
    title: str
    answer_sheet_path: str | None = None
    rubric_path: str | None = None
    answer_sheet_content: str | None = None
    rubric_content: str | None = None
    lecture_ids: list[str] | None = None


class UploadSolutionBody(BaseModel):
    solution_content: str


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
        answer_sheet_content=body.answer_sheet_content,
        rubric_content=body.rubric_content,
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
    quiz_id: str, body: UploadSolutionBody, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.TEACHER

    solution_id = await quiz_db.insert_student_solution(data_context, quiz_id, body.solution_content)
    return JSONResponse({"id": solution_id})
