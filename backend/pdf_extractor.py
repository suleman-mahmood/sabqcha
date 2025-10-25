import argparse
import json
import os
import re

import pdfplumber
from pdf2image import convert_from_path
from PIL import Image


class QuestionExtractor:
    """Advanced question extraction from exam PDFs"""

    def __init__(
        self, pdf_path, output_dir, dpi=300, stitch_pages=False, format="png", extract_metadata=True
    ):
        self.pdf_path = pdf_path
        self.output_dir = output_dir
        self.dpi = dpi
        self.stitch_pages = stitch_pages
        self.format = format.lower()
        self.extract_metadata = extract_metadata

        # Margin settings (in PDF points) - keep full width
        self.margins = {"left": 20, "right_offset": 20, "top": 60, "bottom": 45}

        self.metadata = {}

    def setup_output_dir(self):
        """Create output directory structure"""
        os.makedirs(self.output_dir, exist_ok=True)
        if self.extract_metadata:
            os.makedirs(os.path.join(self.output_dir, "metadata"), exist_ok=True)

    def find_question_boundaries(self):
        """Detect question boundaries with metadata extraction"""
        question_map = {}

        with pdfplumber.open(self.pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if not text:
                    continue

                # Pattern 1: Standard format "1 (a)", "2 (a)"
                main_q_match = re.search(r"^\s*(\d+)\s+\(a\)", text, re.MULTILINE)
                if main_q_match:
                    q_num = int(main_q_match.group(1))
                    if q_num not in question_map:
                        question_map[q_num] = {
                            "start_page": page_num,
                            "end_page": None,
                            "total_marks": None,
                            "parts": [],
                        }
                else:
                    # Pattern 2: Direct format "6 A nichrome"
                    if page_num > 3:
                        alt_match = re.search(r"^\s*(\d+)\s+[A-Z]", text, re.MULTILINE)
                        if alt_match:
                            q_num = int(alt_match.group(1))
                            if q_num not in question_map:
                                question_map[q_num] = {
                                    "start_page": page_num,
                                    "end_page": None,
                                    "total_marks": None,
                                    "parts": [],
                                }

                # Extract metadata if requested
                if self.extract_metadata:
                    # Find total marks
                    total_match = re.search(r"\[Total:\s*(\d+)\]", text)
                    if total_match:
                        total_marks = int(total_match.group(1))
                        for q_num in sorted(question_map.keys(), reverse=True):
                            if (
                                question_map[q_num]["start_page"] <= page_num
                                and question_map[q_num]["end_page"] is None
                            ):
                                question_map[q_num]["end_page"] = page_num
                                question_map[q_num]["total_marks"] = total_marks
                                break

                    # Find question parts and their marks
                    part_matches = re.finditer(r"\(([a-z]+)\).*?\[(\d+)\]", text)
                    for match in part_matches:
                        part_letter = match.group(1)
                        marks = int(match.group(2))
                        # Add to the current question
                        for q_num in sorted(question_map.keys(), reverse=True):
                            if question_map[q_num]["start_page"] <= page_num:
                                if (part_letter, marks) not in question_map[q_num]["parts"]:
                                    question_map[q_num]["parts"].append((part_letter, marks))
                                break

        return question_map

    def get_content_bbox(self, page_width, page_height):
        """Calculate content bounding box"""
        return (
            self.margins["left"],
            self.margins["top"],
            page_width - self.margins["right_offset"],
            page_height - self.margins["bottom"],
        )

    def stitch_images_vertically(self, images, spacing=20):
        """Combine multiple images vertically with spacing"""
        if not images:
            return None

        total_width = max(img.width for img in images)
        total_height = sum(img.height for img in images) + spacing * (len(images) - 1)

        # Create new image with white background
        stitched = Image.new("RGB", (total_width, total_height), (255, 255, 255))

        y_offset = 0
        for img in images:
            # Center the image horizontally if needed
            x_offset = (total_width - img.width) // 2
            stitched.paste(img, (x_offset, y_offset))
            y_offset += img.height + spacing

        return stitched

    def extract_questions(self, question_map):
        """Extract questions as images"""
        print(f"\nConverting PDF to images at {self.dpi} DPI...")
        images = convert_from_path(self.pdf_path, dpi=self.dpi)

        with pdfplumber.open(self.pdf_path) as pdf:
            page_width = pdf.pages[0].width
            page_height = pdf.pages[0].height

        scale_factor = self.dpi / 72
        bbox_pts = self.get_content_bbox(page_width, page_height)
        bbox_px = tuple(int(coord * scale_factor) for coord in bbox_pts)

        print(f"Content area: {bbox_px} pixels\n")

        for q_num in sorted(question_map.keys()):
            q_info = question_map[q_num]
            start_page = q_info["start_page"]
            end_page = q_info["end_page"]

            print(f"Question {q_num}: Pages {start_page}-{end_page}", end="")
            if self.extract_metadata:
                print(f" | Marks: {q_info['total_marks']}")
            else:
                print()

            # Collect cropped images
            cropped_images = []
            for page_num in range(start_page, end_page + 1):
                page_img = images[page_num - 1]
                x0, y0, x1, y1 = bbox_px
                cropped = page_img.crop((x0, y0, x1, y1))
                cropped_images.append(cropped)

            # Save based on stitch option
            if self.stitch_pages and len(cropped_images) > 1:
                # Stitch pages together
                stitched = self.stitch_images_vertically(cropped_images)
                output_file = f"Q{q_num}.{self.format}"
                output_path = os.path.join(self.output_dir, output_file)
                stitched.save(output_path, self.format.upper(), optimize=True)
                print(f"  Saved: {output_file} (stitched, {stitched.width}x{stitched.height} px)")
            else:
                # Save pages separately
                for idx, cropped in enumerate(cropped_images, 1):
                    if len(cropped_images) == 1:
                        output_file = f"Q{q_num}.{self.format}"
                    else:
                        output_file = f"Q{q_num}_page{idx}.{self.format}"

                    output_path = os.path.join(self.output_dir, output_file)
                    cropped.save(output_path, self.format.upper(), optimize=True)
                    print(f"  Saved: {output_file} ({cropped.width}x{cropped.height} px)")

        # Save metadata if requested
        if self.extract_metadata:
            metadata_path = os.path.join(self.output_dir, "metadata", "questions_metadata.json")
            with open(metadata_path, "w") as f:
                json.dump(question_map, f, indent=2)
            print(f"\nMetadata saved to: {metadata_path}")

    def run(self):
        """Main execution"""
        print("=" * 80)
        print("ENHANCED QUESTION EXTRACTOR")
        print("=" * 80)
        print(f"Input: {self.pdf_path}")
        print(f"Output: {self.output_dir}")
        print(f"DPI: {self.dpi}")
        print(f"Format: {self.format.upper()}")
        print(f"Stitch pages: {self.stitch_pages}")
        print(f"Extract metadata: {self.extract_metadata}")
        print("=" * 80)

        self.setup_output_dir()

        print("\nAnalyzing PDF structure...")
        question_map = self.find_question_boundaries()
        print(f"Found {len(question_map)} questions")

        print("\nExtracting questions...")
        self.extract_questions(question_map)

        print("\n" + "=" * 80)
        print("EXTRACTION COMPLETE!")
        print("=" * 80)


def main():
    parser = argparse.ArgumentParser(
        description="Extract questions from exam PDFs with advanced options"
    )
    parser.add_argument(
        "pdf_path", nargs="?", default="/mnt/user-data/uploads/qp-p2.pdf", help="Path to input PDF"
    )
    parser.add_argument(
        "-o",
        "--output",
        default="/mnt/user-data/outputs/questions_enhanced",
        help="Output directory",
    )
    parser.add_argument(
        "-d", "--dpi", type=int, default=300, help="Resolution in DPI (default: 300)"
    )
    parser.add_argument(
        "-s", "--stitch", action="store_true", help="Stitch multi-page questions into single images"
    )
    parser.add_argument(
        "-f",
        "--format",
        choices=["png", "jpg", "jpeg"],
        default="png",
        help="Output image format (default: png)",
    )
    parser.add_argument("--no-metadata", action="store_true", help="Disable metadata extraction")

    args = parser.parse_args()

    extractor = QuestionExtractor(
        pdf_path=args.pdf_path,
        output_dir=args.output,
        dpi=args.dpi,
        stitch_pages=args.stitch,
        format=args.format,
        extract_metadata=not args.no_metadata,
    )

    extractor.run()


if __name__ == "__main__":
    main()
