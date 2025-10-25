import re
from collections import defaultdict

import pdfplumber
from pdfplumber.pdf import PDF
from PIL import Image

# Configuration
PDF_PATH = "content/marking-scheme-p2.pdf"
OUTPUT_DIR = "content/extraction_ms"
DPI = 150  # Resolution for PDF to image conversion
PADDING = 10  # Padding in pixels around extracted regions


def extract_question_boundaries(pdf: PDF):
    """
    Extract all questions and their positions from the PDF.
    Returns a list of question dictionaries with page, position, and grouping info.
    """
    question_data = []
    question_pattern = re.compile(r"^(\d+)\(([a-z]+)\)(\([ivx]+\))?$")

    for page_num, page in enumerate(pdf.pages):
        words = page.extract_words()

        for i, word in enumerate(words):
            match = question_pattern.match(word["text"])
            if match:
                main_q = match.group(1)
                sub_q = match.group(2)
                sub_sub_q = match.group(3) if match.group(3) else ""
                full_q = f"{main_q}({sub_q}){sub_sub_q}"

                question_data.append(
                    {
                        "page": page_num,
                        "question": full_q,
                        "main_q": main_q,
                        "sub_q": sub_q,
                        "sub_sub_q": sub_sub_q,
                        "y_start": word["top"],
                        "x_start": word["x0"],
                    }
                )

    # Sort by page and y position
    question_data.sort(key=lambda q: (q["page"], q["y_start"]))

    # Add end boundaries (where next question starts or page ends)
    for i, q in enumerate(question_data):
        if i < len(question_data) - 1:
            next_q = question_data[i + 1]
            if next_q["page"] == q["page"]:
                q["y_end"] = next_q["y_start"]
            else:
                q["y_end"] = None  # End of page
        else:
            q["y_end"] = None  # Last question

    return question_data


def group_questions_by_main(question_data):
    """
    Group sub-questions by their main question number.
    Returns a dict: {main_q_num: [list of sub-questions]}
    """
    grouped = defaultdict(list)
    for q in question_data:
        grouped[q["main_q"]].append(q)
    return grouped


def extract_question_region(pdf, page_num, y_start, y_end):
    """
    Extract a region from a PDF page as an image.
    """
    page = pdf.pages[page_num]

    # If y_end is None, use page height
    if y_end is None:
        y_end = page.height

    # Define the crop box (x0, y0, x1, y1)
    # Leave some margin at the top and sides
    crop_box = (
        50,  # x0 - left margin
        y_start - 5,  # y0 - start with small padding
        page.width - 20,  # x1 - right margin
        y_end,  # y1 - end
    )

    # Crop the page
    cropped = page.crop(crop_box)

    # Convert to image
    img = cropped.to_image(resolution=DPI)
    return img.original


def combine_images_vertically(images, spacing=10):
    """
    Combine multiple PIL images vertically with spacing between them.
    """
    if not images:
        return None

    if len(images) == 1:
        return images[0]

    # Calculate total height and max width
    total_height = sum(img.height for img in images) + spacing * (len(images) - 1)
    max_width = max(img.width for img in images)

    # Create new image
    combined = Image.new("RGB", (max_width, total_height), color="white")

    # Paste images
    y_offset = 0
    for img in images:
        combined.paste(img, (0, y_offset))
        y_offset += img.height + spacing

    return combined


def main():
    print(f"Processing PDF: {PDF_PATH}\n")

    with pdfplumber.open(PDF_PATH) as pdf:
        # Extract all question boundaries
        print("Extracting question boundaries...")
        questions = extract_question_boundaries(pdf)
        print(f"Found {len(questions)} sub-questions")

        # Group by main question
        grouped = group_questions_by_main(questions)
        print(f"Found {len(grouped)} main questions\n")

        # Process each main question
        for main_q_num in sorted(grouped.keys(), key=int):
            sub_questions = grouped[main_q_num]
            print(f"Processing Question {main_q_num} ({len(sub_questions)} parts):")

            # Extract images for each sub-question
            images = []
            for sub_q in sub_questions:
                print(
                    f"  - {sub_q['question']} (Page {sub_q['page'] + 1}, y={sub_q['y_start']:.1f}-{sub_q['y_end'] if sub_q['y_end'] else 'end'})"
                )

                # Extract the region as image
                img = extract_question_region(pdf, sub_q["page"], sub_q["y_start"], sub_q["y_end"])
                images.append(img)

            # Combine all sub-question images
            combined_img = combine_images_vertically(images, spacing=15)
            if not combined_img:
                print("Error combining image")
                continue

            # Save combined image
            output_path = f"{OUTPUT_DIR}/question_{main_q_num}.png"
            combined_img.save(output_path, "PNG", quality=95, optimize=True)
            print(f"  → Saved: question_{main_q_num}.png\n")

    print(f"✓ Complete! All questions extracted to {OUTPUT_DIR}")
    print(f"  Total files: {len(grouped)}")


if __name__ == "__main__":
    main()
