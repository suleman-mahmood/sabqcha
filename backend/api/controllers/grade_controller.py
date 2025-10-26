import asyncio
import base64
import os
import tempfile
from asyncio.log import logger
from pathlib import Path

import pikepdf
from google.cloud.storage import Bucket
from openai import OpenAI
from pdf2image import convert_from_path

from api.dal import past_paper_db, quiz_db
from api.dependencies import DataContext
from api.job_utils import background_job_decorator
from api.prompts import GRADER_SYSTEM_PROMPT


@background_job_decorator(
    lambda _, __, kwargs: f"{kwargs.get('quiz_id')}-{kwargs.get('solution_id')}"
)
async def grade_quiz(
    data_context: DataContext, bucket: Bucket, openai_client: OpenAI, quiz_id: str, solution_id: str
):
    """
    Find the quiz_content -> Rubrics and Answer_sheet
    Get the file path for solution_id
    Download the file
    Convert the file to images
    Grading prompt
    """
    logger.info("Grading quiz {} for solution {}", quiz_id, solution_id)

    quiz = await quiz_db.get_quiz(data_context, quiz_id=quiz_id)
    assert quiz
    assert quiz.ms_llm_content_extract_content and quiz.rubric_llm_content_extract_content

    solution = await quiz_db.get_student_solution(data_context, solution_id=solution_id)
    assert solution

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path_obj = Path(solution.solution_path)
        extension = file_path_obj.suffix
        assert extension == ".pdf"

        storage_file = tempfile.NamedTemporaryFile(suffix=extension, dir=temp_dir, delete=False)
        blob = bucket.blob(solution.solution_path)
        await asyncio.to_thread(blob.download_to_filename, storage_file.name)

        compressed_pdf = tempfile.NamedTemporaryFile(suffix=extension, dir=temp_dir, delete=False)
        await asyncio.to_thread(compress_pdf, storage_file.name, compressed_pdf.name)
        images = await asyncio.to_thread(pdf_to_images, compressed_pdf.name, temp_dir, dpi=150)

        response = await asyncio.to_thread(
            openai_client.responses.create,
            model="gpt-5-mini",
            input=[
                {"role": "system", "content": GRADER_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"Rubric for grading guidelines: {quiz.rubric_llm_content_extract_content}",
                        },
                        {
                            "type": "input_text",
                            "text": f"Correct solution for reference: {quiz.ms_llm_content_extract_content}",
                        },
                        {
                            "type": "input_text",
                            "text": "Student's answer to be graded:",
                        },
                        *[get_model_input_for_img(img) for img in images],
                        {
                            "type": "input_text",
                            "text": (
                                "Grade the student's answer based on the rubric and correct solution."
                            ),
                        },
                    ],
                },
            ],
        )

    await quiz_db.update_llm_contents_for_solution(data_context, solution_id, response.output_text)

    logger.info(
        "LLM responded with solution: {} ... {}",
        response.output_text[:10],
        response.output_text[-10:],
    )
    if response.usage:
        logger.info(
            "{} Input and {} Output tokens used",
            response.usage.input_tokens,
            response.usage.output_tokens,
        )


@background_job_decorator(
    lambda _, __, kwargs: f"{kwargs.get('user_id')}-{kwargs.get('past_paper_id')}"
)
async def grade_question(
    data_context: DataContext,
    bucket: Bucket,
    openai_client: OpenAI,
    *,
    past_paper_id: str,
    solution_file_path: str,
    user_id: str,
) -> str:
    """
    1. In a temp_dir download the question_paper, marking_scheme, student_solution
    2. Send to OpenAI for grading
    3. Return response
    """

    logger.info("Grading past paper {} for user {}", past_paper_id, user_id)

    solution_id = await past_paper_db.insert_student_solution(
        data_context, past_paper_id, solution_file_path, user_id
    )

    past_paper = await past_paper_db.get_past_paper(data_context, past_paper_id)
    assert past_paper

    rubric = await past_paper_db.get_rubric_for_past_paper(data_context, past_paper_id)
    assert rubric

    with tempfile.TemporaryDirectory() as temp_dir:
        solution_file = await download_temp_img_file(bucket, solution_file_path, temp_dir)
        question_file = await download_temp_img_file(
            bucket, past_paper.question_file_path, temp_dir
        )
        marking_scheme_file = await download_temp_img_file(
            bucket, past_paper.marking_scheme_file_path, temp_dir
        )

        response = await asyncio.to_thread(
            openai_client.responses.create,
            model="gpt-5-mini",
            input=[
                {"role": "system", "content": GRADER_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"Rubric for grading guidelines: {rubric}",
                        },
                        {
                            "type": "input_text",
                            "text": "Question for reference: ",
                        },
                        get_model_input_for_img(question_file),
                        {
                            "type": "input_text",
                            "text": "Correct solution for reference: ",
                        },
                        get_model_input_for_img(marking_scheme_file),
                        {
                            "type": "input_text",
                            "text": "Student's answer to be graded:",
                        },
                        get_model_input_for_img(solution_file),
                        {
                            "type": "input_text",
                            "text": (
                                "Grade the student's answer based on the rubric and correct solution."
                            ),
                        },
                    ],
                },
            ],
        )

    logger.info(
        "LLM responded with solution: {} ... {}",
        response.output_text[:10],
        response.output_text[-10:],
    )
    if response.usage:
        logger.info(
            "{} Input and {} Output tokens used",
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

    await past_paper_db.update_llm_contents_for_solution(
        data_context, solution_id, response.output_text
    )

    return response.output_text


async def download_temp_img_file(bucket: Bucket, file_path: str, dir: str) -> str:
    file_path_obj = Path(file_path)
    extension = file_path_obj.suffix
    assert extension in [".jpg", ".jpeg", ".png"]
    storage_file = tempfile.NamedTemporaryFile(suffix=extension, dir=dir, delete=False)

    blob = bucket.blob(file_path)
    await asyncio.to_thread(blob.download_to_filename, storage_file.name)

    return storage_file.name


def pdf_to_images(pdf_path: str, output_dir: str = "pdf_images", dpi: int = 300):
    """
    Converts all pages of a PDF into images.

    Args:
        pdf_path (str): Path to the PDF file.
        output_dir (str): Directory to save images.
        dpi (int): Image resolution (higher = sharper but larger).

    Returns:
        list[str]: Paths of the saved image files.
    """
    base_name = os.path.basename(pdf_path)
    file_name = os.path.splitext(base_name)[0]

    # Create output folder if not exists
    os.makedirs(output_dir, exist_ok=True)

    # Convert PDF pages to images
    pages = convert_from_path(pdf_path, dpi=dpi)
    image_paths = []

    # Save each page as an image
    for i, page in enumerate(pages, start=1):
        image_path = os.path.join(output_dir, f"{file_name}_p_{i}.jpg")
        page.save(image_path, "JPEG")
        image_paths.append(image_path)
        logger.info("Saved {}", image_path)

    return image_paths


def encode_image(image_path) -> str:
    """Function to encode the image"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def get_model_input_for_img(path):
    base64_image = encode_image(path)
    return {
        "type": "input_image",
        "image_url": f"data:image/jpeg;base64,{base64_image}",
    }


def compress_pdf(input_path: str, output_path: str):
    pdf = pikepdf.open(input_path)
    pdf.save(output_path)
    pdf.close()
    logger.info("Compressed PDF saved to {}", output_path)
