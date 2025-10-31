import base64
import os
import sys
from io import BytesIO

import fitz
from api.prompts import GRADER_SYSTEM_PROMPT
from loguru import logger
from openai import AsyncOpenAI
from pdf2image import convert_from_path
from PIL import Image, ImageDraw, ImageOps
from pydantic import BaseModel

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Setup logger
logger.remove()

# Configure output to console
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
    "<level>{message}</level>",
)

physics_p1_rubrics = [
    "content/pdf_images/rubric-p2_p_1.jpg",
    "content/pdf_images/rubric-p2_p_2.jpg",
    "content/pdf_images/rubric-p2_p_3.jpg",
    "content/pdf_images/rubric-p2_p_4.jpg",
    "content/pdf_images/rubric-p2_p_5.jpg",
    "content/pdf_images/rubric-p2_p_6.jpg",
]

physics_p1_answers = [
    "content/pdf_images/ms-p2_p_8.jpg",
    "content/pdf_images/ms-p2_p_9.jpg",
    "content/pdf_images/ms-p2_p_10.jpg",
    "content/pdf_images/ms-p2_p_11.jpg",
    "content/pdf_images/ms-p2_p_12.jpg",
    "content/pdf_images/ms-p2_p_13.jpg",
    "content/pdf_images/ms-p2_p_14.jpg",
]

physics_p1_solutions = [
    "s-1.jpg",
    "s-2.jpg",
    "s-3.jpg",
    "s-4.jpg",
    "s-5.jpg",
    "s-6.jpg",
]


def main():
    logger.info("Hello from grader!")

    # pdf_to_images("content/ms-p2-2025.pdf")
    # pdf_to_images("content/sol-p2-maryam.pdf")
    # pdf_to_images("content/marking-scheme-p2.pdf")
    # grader()
    # draw_annotations()
    # simple_grader()
    read_pdf()


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


async def grader() -> str:
    # "text": "Extract handwritten notes from the images provided",
    # "text": "Extract printed text from the images, maintain the text structure",
    response = await openai_client.responses.create(
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": GRADER_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "Rubric for grading guidelines:",
                    },
                    *[get_model_input_for_img(img) for img in physics_p1_rubrics],
                    {
                        "type": "input_text",
                        "text": "Correct solution for reference:",
                    },
                    *[get_model_input_for_img(img) for img in physics_p1_answers],
                    {
                        "type": "input_text",
                        "text": "Student's answer to be graded:",
                    },
                    *[get_model_input_for_img(img) for img in physics_p1_solutions],
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

    logger.info("Response: {}", response.output_text)
    if response.usage:
        logger.info(
            "{} Input and {} Output tokens used",
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

    return response.output_text


def pdf_to_images(pdf_path: str, output_dir: str = "content/pdf_images", dpi: int = 300):
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


class Anno(BaseModel):
    x: float
    y: float
    width: float
    height: float


class AnnotationRes(BaseModel):
    annotations: list[Anno]


async def draw_annotations():
    img = Image.open("s-1-cropped.jpg")
    img = ImageOps.exif_transpose(img)

    buffer = BytesIO()
    img.save(buffer, format="jpeg")
    img_64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    response = await openai_client.responses.parse(
        model="gpt-5-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": "Student's solution"},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{img_64}",
                    },
                    {
                        "type": "input_text",
                        "text": """Return annotations around each question in the provided image.
                            Each annotation should have: {x, y, width, height}.
                            The coordinates should be normalized between 0 and 1 relative to image dimensions.
                        """,
                    },
                ],
            },
        ],
        text_format=AnnotationRes,
    )
    output = response.output_parsed
    assert output

    logger.info("Annotations: {}", output.model_dump(mode="json"))

    draw = ImageDraw.Draw(img)
    w, h = img.size

    for ann in output.annotations:
        x, y = ann.x * w, ann.y * h
        ww, hh = ann.width * w, ann.height * h
        draw.rectangle([x, y, x + ww, y + hh], outline="red", width=3)

    img.save("annotated_answer.jpg")


async def simple_grader():
    """
    Single Question grader
    - Randomly get a question from bank
    - Student writes answer on a piece of paper
    - Student uploads image
    - AI grades in realtime and responds with answer
    """
    response = await openai_client.responses.create(
        model="gpt-5-mini",
        input=[
            {"role": "system", "content": GRADER_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "Rubric for grading guidelines:",
                    },
                    *[get_model_input_for_img(img) for img in physics_p1_rubrics],
                    {
                        "type": "input_text",
                        "text": "Correct solution for reference:",
                    },
                    get_model_input_for_img("content/pdf_images/ms-p2-2025.jpg"),
                    {
                        "type": "input_text",
                        "text": "Student's answer to be graded:",
                    },
                    get_model_input_for_img("content/pdf_images/sol-p2-maryam_p_1.jpg"),
                    get_model_input_for_img("content/pdf_images/sol-p2-maryam_p_2.jpg"),
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

    logger.info("Response: {}", response.output_text)
    if response.usage:
        logger.info(
            "{} Input and {} Output tokens used",
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

    return response.output_text


def read_pdf():
    doc = fitz.open("content/qp-p2.pdf")  # open a document

    for page_num, page in enumerate(doc.pages(), start=1):
        # Extract text as a list of blocks
        blocks = page.get_text("blocks")
        # Each block: (x0, y0, x1, y1, "text", block_no, ...)

        # Sort by vertical position (top to bottom)
        blocks = sorted(blocks, key=lambda b: b[1])

        for block in blocks:
            text: str = block[4].strip()
            if text.startswith("1"):
                logger.info("[Page {}] {}", page_num, text)
                logger.info("Blocks: {}", block)


if __name__ == "__main__":
    main()
