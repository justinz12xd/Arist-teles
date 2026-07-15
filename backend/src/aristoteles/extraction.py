from dataclasses import dataclass
from io import BytesIO

import fitz
from PIL import Image
from pytesseract import TesseractNotFoundError, image_to_string


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str
    method: str
    quality_score: float


def _quality(text: str) -> float:
    if not text.strip():
        return 0.0
    words = [word for word in text.split() if len(word) > 1]
    return min(1.0, len(words) / 80)


def extract_pdf(data: bytes) -> list[ExtractedPage]:
    pages: list[ExtractedPage] = []
    with fitz.open(stream=data, filetype="pdf") as document:
        for index, page in enumerate(document, start=1):
            text = page.get_text("text").strip()
            score = _quality(text)
            method = "native"
            if score < 0.25:
                pixmap = page.get_pixmap(dpi=180, alpha=False)
                image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
                try:
                    text = image_to_string(image, lang="spa").strip()
                except TesseractNotFoundError:
                    text = ""
                score = _quality(text)
                method = "ocr"
            pages.append(ExtractedPage(index, text, method, score))
    return pages


def extract_image(data: bytes) -> list[ExtractedPage]:
    image = Image.open(BytesIO(data))
    try:
        text = image_to_string(image, lang="spa").strip()
    except TesseractNotFoundError:
        text = ""
    return [ExtractedPage(1, text, "ocr", _quality(text))]
