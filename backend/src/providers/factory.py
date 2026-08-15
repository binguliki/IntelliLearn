import os

from .base import EmbeddingProvider, ModelProvider, SpeechToTextProvider
from .gemini_embedding_provider import GeminiEmbeddingProvider
from .gemini_provider import GeminiProvider
from .huggingface_embedding_provider import HuggingFaceEmbeddingProvider
from .whisper_stt_provider import WhisperSTTProvider


def get_model_provider() -> ModelProvider:
    """
    Factory that returns the configured LLM provider.

    Reads MODEL_PROVIDER from environment (default: "gemini").

    Supported values:
        "gemini"  - Google Gemini via LangChain

    To add a new provider (e.g. OpenAI), implement ModelProvider in a new file,
    import it here, and add an elif branch.

    Raises:
        ValueError: If MODEL_PROVIDER is set to an unsupported value.
    """
    provider = os.getenv("MODEL_PROVIDER", "gemini").strip().lower()

    if provider == "gemini":
        return GeminiProvider()

    raise ValueError(
        f"Unsupported MODEL_PROVIDER: '{provider}'. "
        f"Supported values: 'gemini'."
    )


def get_embedding_provider() -> EmbeddingProvider:
    """
    Factory that returns the configured embedding provider.

    Reads EMBEDDING_PROVIDER from environment (default: "huggingface").

    Supported values:
        "huggingface" - Local sentence-transformers model (free, no quota, in-process)
        "gemini"      - Google Gemini text-embedding via LangChain (requires API key)

    To add a new provider (e.g. OpenAI), implement EmbeddingProvider in a new
    file, import it here, and add an elif branch.

    Raises:
        ValueError: If EMBEDDING_PROVIDER is set to an unsupported value.
    """
    provider = os.getenv("EMBEDDING_PROVIDER", "huggingface").strip().lower()

    if provider == "huggingface":
        return HuggingFaceEmbeddingProvider()

    if provider == "gemini":
        return GeminiEmbeddingProvider()

    raise ValueError(
        f"Unsupported EMBEDDING_PROVIDER: '{provider}'. "
        f"Supported values: 'huggingface', 'gemini'."
    )


def get_stt_provider() -> SpeechToTextProvider:
    """
    Factory that returns the configured speech-to-text provider.

    Reads STT_PROVIDER from environment (default: "whisper").

    Supported values:
        "whisper" - OpenVINO-optimised Whisper model via HuggingFace

    To add a new provider (e.g. Deepgram, Google STT), implement
    SpeechToTextProvider in a new file, import it here, and add an elif branch.

    Raises:
        ValueError: If STT_PROVIDER is set to an unsupported value.
    """
    provider = os.getenv("STT_PROVIDER", "whisper").strip().lower()

    if provider == "whisper":
        return WhisperSTTProvider()

    raise ValueError(
        f"Unsupported STT_PROVIDER: '{provider}'. "
        f"Supported values: 'whisper'."
    )
