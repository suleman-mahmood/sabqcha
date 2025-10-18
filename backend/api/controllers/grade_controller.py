import asyncio
from asyncio.log import logger
from openai import OpenAI
import base64
import os
from pathlib import Path
from ..dependencies import DataContext
from ..job_utils import background_job_decorator
from ..dal import quiz_db
from ..prompts import GRADER_SYSTEM_PROMPT
from google.cloud.storage import Bucket
from pdf2image import convert_from_path
import tempfile

@background_job_decorator(lambda _, args, kwargs: f"{kwargs.get("quiz_id")}-{kwargs.get("solution_id")}")
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

    quiz = await quiz_db.get_quiz(data_context, quiz_id= quiz_id)
    assert quiz.rubric_content and quiz.answer_sheet_content

    solution = await quiz_db.get_student_solution(data_context, solution_id=solution_id)
    assert solution.solution_path

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path_obj = Path(solution.solution_path)
        extension = file_path_obj.suffix or ""
        storage_file = tempfile.NamedTemporaryFile(suffix=extension, dir=temp_dir, delete=False)
        blob = bucket.blob(solution.solution_path)
        await asyncio.to_thread(blob.download_to_filename, storage_file.name)
        images = pdf_to_images(storage_file.name, temp_dir)
        
        response = openai_client.responses.create(
            model="gpt-5-mini",
            input=[
                {"role": "system", "content": GRADER_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"Rubric for grading guidelines: {quiz.rubric_content}",
                        },
                        {
                            "type": "input_text",
                            "text": f"Correct solution for reference: {quiz.answer_sheet_content}",
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
    
    quiz_db.update_student_solution_transcription(response.output_text)

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
