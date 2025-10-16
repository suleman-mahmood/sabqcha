import os
import base64
import sys

from openai import OpenAI
from loguru import logger
from pdf2image import convert_from_path

from api.prompts import GRADER_SYSTEM_PROMPT

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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
    "pdf_images/ms-p2_p_2.jpg",
    "pdf_images/ms-p2_p_3.jpg",
    "pdf_images/ms-p2_p_4.jpg",
    "pdf_images/ms-p2_p_5.jpg",
    "pdf_images/ms-p2_p_6.jpg",
    "pdf_images/ms-p2_p_7.jpg",
]

physics_p1_answers = [
    "pdf_images/ms-p2_p_8.jpg",
    "pdf_images/ms-p2_p_9.jpg",
    "pdf_images/ms-p2_p_10.jpg",
    "pdf_images/ms-p2_p_11.jpg",
    "pdf_images/ms-p2_p_12.jpg",
    "pdf_images/ms-p2_p_13.jpg",
    "pdf_images/ms-p2_p_14.jpg",
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

    # pdf_to_images("qp-p2.pdf")
    # pdf_to_images("ms-p2.pdf")
    # grader()


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


def grader() -> str:
    # "text": "Extract handwritten notes from the images provided",
    # "text": "Extract printed text from the images, maintain the text structure",
    response = openai_client.responses.create(
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


if __name__ == "__main__":
    main()
