import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from loguru import logger
from openai import OpenAI
from pydantic import BaseModel

from api.dependencies import DataContext, get_data_context, get_openai_client
from api.dal import task_db
from api.models.user_models import UserRole
from api.dal import room_db
from api.models.task_models import TaskAttempted, TaskSetRes
from api.dal import lecture_db
from api.prompts import (
    MISTAKE_ANALYSIS_SYSTEM_PROMPT,
    ConceptLlmRes,
    MistakeAnalysisLlmRes,
    generate_mistake_user_prompt,
)
from api.exceptions import OpenAiApiError
from api.job_utils import background_job_decorator


router = APIRouter(prefix="/task")


class SubmitTaskBody(BaseModel):
    tasks: list[TaskAttempted]
    time_elapsed: int


@router.post("/set/{task_set_id}")
async def submit_task_set(
    task_set_id: str, body: SubmitTaskBody, data_context: DataContext = Depends(get_data_context)
):
    assert data_context.user_role == UserRole.STUDENT

    mcqs = await task_db.get_task_set(data_context, task_set_id)
    assert mcqs

    correct = 0
    incorrect = 0
    skip = 0
    score = 0

    for mcq, mcq_attempt in zip(mcqs.tasks, body.tasks):
        if mcq_attempt.did_skip:
            skip += 1
            continue

        if mcq_attempt.answer != mcq.answer:
            incorrect += 1
            score -= 1
        else:
            correct += 1
            score += 3

    score = max(score, 0)

    room_id = await room_db.get_room_for_task_set(data_context, task_set_id)
    assert room_id
    await room_db.update_user_score(data_context, data_context.user_id, room_id, score)
    await task_db.insert_attempt(
        data_context,
        data_context.user_id,
        task_set_id,
        body.tasks,
        correct,
        incorrect,
        skip,
        body.time_elapsed,
    )


in_progres_res = MistakeAnalysisLlmRes(
    weak_concepts=[
        ConceptLlmRes(
            weak_concept="Analysis in Progress",
            explanation="Please refresh after 2 mins to view your analysis",
        )
    ]
).model_dump(mode="json")


@router.post("/set/{task_set_id}/analyze", response_model=MistakeAnalysisLlmRes)
async def analyze_task_set(
    task_set_id: str,
    background_tasks: BackgroundTasks,
    data_context: DataContext = Depends(get_data_context),
    openai_client: OpenAI = Depends(get_openai_client),
):
    in_progress = await _do_analysis(
        background_tasks, data_context, openai_client=openai_client, task_set_id=task_set_id
    )
    if not in_progress:
        recent_analysis = await task_db.get_recent_mistake_analysis(
            data_context, data_context.user_id, task_set_id
        )
        assert recent_analysis
        return JSONResponse(recent_analysis)

    return JSONResponse(in_progres_res)


def _job_identifier(data_context: DataContext, _: tuple, kwargs: dict) -> str:
    task_set_id: str | None = kwargs.get("task_set_id")
    assert task_set_id
    return f"{task_set_id}-{data_context.user_id}"


@background_job_decorator(_job_identifier)
async def _do_analysis(data_context: DataContext, openai_client: OpenAI, task_set_id: str):
    room_id = await task_db.get_room_id_for_task_set(data_context, task_set_id)
    assert room_id
    all_task_sets = await task_db.list_task_sets_for_room(
        data_context, data_context.user_id, room_id
    )

    task_set_attempts: TaskSetRes | None = None
    for ts in all_task_sets:
        if ts.id == task_set_id:
            task_set_attempts = ts
            break
    assert task_set_attempts

    task_set = await task_db.get_task_set(data_context, task_set_id)
    assert task_set

    mistake_str = ""
    for attempt in task_set_attempts.attempts:
        for at, task in zip(attempt.user_attempts, task_set.tasks):
            if at.did_skip:
                continue

            if at.answer != task.answer:
                mistake_str += f"""
                    Question: {task.question}
                    User Answer: {at.answer}
                    Correct Answer: {task.answer}
                """

    lecture_group_id = await lecture_db.get_lecture_group_for_task_set(data_context, task_set_id)
    assert lecture_group_id

    transcriptions = await lecture_db.get_transcriptions_for_lecture_group(
        data_context, lecture_group_id
    )
    combined_transcript = " ".join(transcriptions)

    logger.info(
        "Calling llm to analyze mistakes for transcript: {} ... {}",
        combined_transcript[:10],
        combined_transcript[-10:],
    )

    openai_res = await asyncio.to_thread(
        openai_client.responses.parse,
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": MISTAKE_ANALYSIS_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": generate_mistake_user_prompt(combined_transcript, mistake_str),
            },
        ],
        text_format=MistakeAnalysisLlmRes,
    )

    if openai_res.usage:
        logger.info("Input tokens: {}", openai_res.usage.input_tokens)
        logger.info("Output tokens: {}", openai_res.usage.output_tokens)
        logger.info("Total tokens used: {}", openai_res.usage.total_tokens)

    llm_res = openai_res.output_parsed
    if not llm_res:
        logger.error("Invalid Response form OpenAI: {}", openai_res.model_dump(mode="json"))
        raise OpenAiApiError("Invalid response from OpenAI")

    res = llm_res.model_dump(mode="json")
    await task_db.insert_analysis(data_context, data_context.user_id, task_set_id, res)


@router.get("/set/{task_set_id}")
async def get_task_set(task_set_id: str, data_context: DataContext = Depends(get_data_context)):
    task_set = await task_db.get_task_set(data_context, task_set_id)
    assert task_set

    return JSONResponse(task_set.model_dump(mode="json"))
