import os
from typing import List

import fitz
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


MAX_PDF_COUNT = int(os.getenv("MAX_PDF_COUNT", "2"))
MAX_PDF_SIZE_BYTES = int(os.getenv("MAX_PDF_SIZE_MB", "10")) * 1024 * 1024
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "64"))


class PDFValidationError(ValueError):
    """Raised when an uploaded PDF fails validation."""


def validate_pdf(
    pdf_bytes: bytes,
    filename: str,
    current_count: int,
) -> None:
    """
    Validate a PDF upload against size, count, and MIME constraints.

    Args:
        pdf_bytes:     Raw bytes of the uploaded file.
        filename:      Original filename (used in error messages).
        current_count: Number of PDFs already indexed for this user.

    Raises:
        PDFValidationError: With a human-readable message on any violation.
    """
    if current_count >= MAX_PDF_COUNT:
        raise PDFValidationError(
            f"Maximum of {MAX_PDF_COUNT} PDFs allowed per session. "
            "Please reset your session to upload new documents."
        )

    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        size_mb = len(pdf_bytes) / (1024 * 1024)
        raise PDFValidationError(
            f"'{filename}' is {size_mb:.1f} MB — exceeds the {MAX_PDF_SIZE_BYTES // (1024 * 1024)} MB limit."
        )

    # Check PDF magic bytes — PyMuPDF will also catch this, but an early check
    # gives a clearer error before we attempt to open the document.
    if not pdf_bytes.startswith(b"%PDF"):
        raise PDFValidationError(
            f"'{filename}' does not appear to be a valid PDF file."
        )


def extract_text(pdf_bytes: bytes, filename: str) -> str:
    """
    Extract all text from a PDF document.

    Args:
        pdf_bytes: Raw bytes of the PDF.
        filename:  Used in log messages.

    Returns:
        Concatenated plain text from all pages.

    Raises:
        PDFValidationError: If the PDF cannot be opened or has no extractable text.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise PDFValidationError(f"Could not open '{filename}' as a PDF: {e}") from e

    pages_text = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages_text.append(text)
    doc.close()

    if not pages_text:
        raise PDFValidationError(
            f"No extractable text found in '{filename}'. "
            "The PDF may be image-based or encrypted."
        )

    return "\n\n".join(pages_text)


def chunk_text(text: str, filename: str) -> List[Document]:
    """
    Split extracted text into overlapping chunks with source metadata.

    Args:
        text:     Full extracted text from the PDF.
        filename: Stored in each chunk's metadata for provenance tracking.

    Returns:
        List of LangChain Document objects, each representing one chunk.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.create_documents(
        texts=[text],
        metadatas=[{"source": filename}],
    )
    return chunks


def process_pdf(
    pdf_bytes: bytes,
    filename: str,
    current_count: int,
) -> List[Document]:
    """
    Full PDF processing pipeline: validate → extract → chunk.

    Args:
        pdf_bytes:     Raw bytes of the uploaded PDF.
        filename:      Original filename.
        current_count: Number of PDFs already indexed for this user.

    Returns:
        List of Document chunks ready for embedding and storage.

    Raises:
        PDFValidationError: On any validation or extraction failure.
    """
    validate_pdf(pdf_bytes, filename, current_count)
    text = extract_text(pdf_bytes, filename)
    return chunk_text(text, filename)
