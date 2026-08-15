from abc import ABC, abstractmethod
from typing import Any


class ModelProvider(ABC):
    """
    Abstract base class for LLM model providers.

    Implement this interface to add a new model backend (e.g. OpenAI, Anthropic).
    The Agent class depends only on this interface — swapping providers requires
    changing the MODEL_PROVIDER env var, not the Agent code.
    """

    @abstractmethod
    def get_llm(self, tools: list) -> Any:
        """
        Return a LangChain-compatible chat model instance with tools bound.

        Args:
            tools: List of LangChain tool callables to bind to the model.

        Returns:
            A LangChain Runnable (e.g. ChatModel.bind_tools(tools)).
        """
        ...


class EmbeddingProvider(ABC):
    """
    Abstract base class for embedding model providers.

    Implement this interface to add a new embedding backend (e.g. OpenAI, HuggingFace).
    The RAG pipeline depends only on this interface — swapping embedding models
    requires changing the EMBEDDING_PROVIDER env var, not the pipeline code.
    """

    @abstractmethod
    def get_embeddings(self) -> Any:
        """
        Return a LangChain-compatible Embeddings instance.

        Returns:
            A LangChain Embeddings object (e.g. GoogleGenerativeAIEmbeddings).
        """
        ...


class SpeechToTextProvider(ABC):
    """
    Abstract base class for speech-to-text model providers.

    Implement this interface to add a new STT backend (e.g. Whisper, Deepgram).
    The speech_to_text shim depends only on this interface — swapping STT models
    requires changing the STT_PROVIDER env var, not the server code.
    """

    @abstractmethod
    def load_model_async(self) -> None:
        """
        Kick off model loading in a background daemon thread.
        Should be called once at application startup.
        """
        ...

    @abstractmethod
    def is_ready(self) -> bool:
        """
        Return True when the model is fully loaded and ready to transcribe.
        """
        ...

    @abstractmethod
    def transcribe_audio_bytes(self, audio_bytes: bytes) -> str:
        """
        Transcribe raw audio bytes to a text string.

        Args:
            audio_bytes: Raw audio file bytes (any format supported by soundfile).

        Returns:
            Transcribed text string.
        """
        ...
