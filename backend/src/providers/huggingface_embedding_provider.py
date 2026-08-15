import os
from typing import Any

from langchain_huggingface import HuggingFaceEmbeddings

from .base import EmbeddingProvider


class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    """
    Embedding provider backed by a local sentence-transformers model.

    Runs fully in-process — no API key, no quota, no network calls after the
    initial model download. The model is cached in ~/.cache/huggingface by
    HuggingFace's transformers library, so subsequent runs are instant.

    Configuration (read from environment):
        EMBEDDING_MODEL_NAME - sentence-transformers model ID
                               (default: sentence-transformers/all-MiniLM-L6-v2)
                               → 384-dim, ~22 MB, fast, good quality for MVP RAG

    Other popular free options (just change the env var — no code changes):
        all-mpnet-base-v2          768-dim, higher quality, slower
        paraphrase-MiniLM-L3-v2   384-dim, smallest/fastest
    """

    def __init__(self):
        self.model_name = os.getenv(
            "EMBEDDING_MODEL_NAME",
            "sentence-transformers/all-MiniLM-L6-v2",
        )

    def get_embeddings(self) -> Any:
        """
        Return a HuggingFaceEmbeddings instance loaded from the local model cache.

        model_kwargs device="cpu" is explicit — change to "mps" on Apple Silicon
        or "cuda" if a GPU is available for faster embedding.
        """
        return HuggingFaceEmbeddings(
            model_name=self.model_name,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
