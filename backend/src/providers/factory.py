import os

from .base import ModelProvider
from .gemini_provider import GeminiProvider


def get_model_provider() -> ModelProvider:
    """
    Factory function that reads MODEL_PROVIDER from the environment and returns
    the corresponding ModelProvider instance.

    Supported values:
        "gemini"  - Google Gemini via LangChain (default)

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
