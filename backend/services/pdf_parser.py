"""
PDF and text file parser.
Extracts raw text from uploaded files.
"""

import io
from PyPDF2 import PdfReader


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF or plain text file."""
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension == "pdf":
        return _extract_pdf(file_bytes)
    else:
        # treat as plain text (.txt, .doc fallback, etc.)
        return file_bytes.decode("utf-8", errors="ignore")


def _extract_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)
