import os
from typing import Any

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from .base import EmbeddingProvider


class GeminiEmbeddingProvider(EmbeddingProvider):
    """
    Embedding provider backed by Google Gemini via LangChain.

    Configuration (read from environment):
        EMBEDDING_MODEL_NAME - Gemini embedding model ID
                               (default: models/text-embedding-004)
        GOOGLE_API_KEY       - Google API key (shared with LLM provider)
    """

    def __init__(self):
        self.model_name = os.getenv(
            "EMBEDDING_MODEL_NAME", "models/text-embedding-004"
        )

    def get_embeddings(self) -> Any:
        """
        Return a GoogleGenerativeAIEmbeddings instance configured with the
        model specified by EMBEDDING_MODEL_NAME.
        """
        return GoogleGenerativeAIEmbeddings(model=self.model_name)
