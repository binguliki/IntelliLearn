import asyncio
from typing import Dict, List, Optional

from ..providers.factory import get_embedding_provider
from . import pdf_processor, vector_store
from .pdf_processor import PDFValidationError


class RAGPipeline:
    """
    Orchestrates PDF ingestion and RAG retrieval for all user sessions.

    Thread-safety note: _pdf_metadata is mutated only inside async methods
    that run in FastAPI's event loop. If you switch to multi-process deployment,
    move this dict to Redis (keyed by user_id) alongside the session state.
    """

    def __init__(self):
        self._embeddings = None
        self._pdf_metadata: Dict[str, List[dict]] = {}

    async def ingest_pdf(
        self, user_id: str, pdf_bytes: bytes, filename: str
    ) -> dict:
        """
        Full ingestion pipeline for a single PDF.

        Args:
            user_id:   Authenticated user's UUID.
            pdf_bytes: Raw bytes of the uploaded PDF file.
            filename:  Original filename, stored in chunk metadata.

        Returns:
            dict with keys: filename, chunks (int), pdf_count (int).

        Raises:
            PDFValidationError: On size, count, or format violations.
        """
        current_count = self.get_pdf_count(user_id)

        chunks = await asyncio.get_event_loop().run_in_executor(
            None,
            pdf_processor.process_pdf,
            pdf_bytes,
            filename,
            current_count,
        )

        embeddings = self._get_embeddings()

        stored = await asyncio.get_event_loop().run_in_executor(
            None,
            vector_store.upsert,
            user_id,
            chunks,
            embeddings,
        )

        if user_id not in self._pdf_metadata:
            self._pdf_metadata[user_id] = []
        self._pdf_metadata[user_id].append({"filename": filename, "chunks": stored})

        return {
            "filename": filename,
            "chunks": stored,
            "pdf_count": len(self._pdf_metadata[user_id]),
        }

    async def retrieve_context(self, user_id: str, query: str) -> str | None:
        """
        Retrieve the most relevant document chunks for a query.

        Args:
            user_id: Authenticated user's UUID.
            query:   The user's natural-language question.

        Returns:
            A formatted context block string to prepend to the LLM message,
            or None if no relevant chunks were found above the threshold.

        Raises:
            Exception: Re-raised on embedding/search failure so server can
                       return a meaningful error response.
        """
        if not self._pdf_metadata.get(user_id):
            return None

        embeddings = self._get_embeddings()

        try:
            relevant_chunks = await asyncio.get_event_loop().run_in_executor(
                None,
                vector_store.query,
                user_id,
                query,
                embeddings,
            )
        except Exception as e:
            print(f"[RAGPipeline] retrieve_context failed for user {user_id[:8]}...: {e}")
            raise

        if not relevant_chunks:
            return None

        context_block = (
            "[CONTEXT FROM UPLOADED DOCUMENTS]\n"
            + "\n\n---\n\n".join(relevant_chunks)
            + "\n[END OF DOCUMENT CONTEXT]\n\n"
        )
        return context_block

    def delete_user_data(self, user_id: str) -> None:
        """
        Remove all RAG state for a user (Chroma collection + PDF count).

        Called on session reset and TTL-based cleanup.

        Args:
            user_id: Authenticated user's UUID.
        """
        vector_store.delete_user_collection(user_id)
        self._pdf_metadata.pop(user_id, None)

    def get_pdf_count(self, user_id: str) -> int:
        """Return the number of PDFs currently indexed for a user."""
        return len(self._pdf_metadata.get(user_id, []))

    def get_pdf_list(self, user_id: str) -> List[dict]:
        """Return metadata list for all PDFs indexed for a user."""
        return self._pdf_metadata.get(user_id, [])

    def _get_embeddings(self):
        """Lazily initialise and cache the embedding provider."""
        if self._embeddings is None:
            provider = get_embedding_provider()
            self._embeddings = provider.get_embeddings()
        return self._embeddings

rag_pipeline = RAGPipeline()
