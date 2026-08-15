from .providers.factory import get_stt_provider
from .providers.base import SpeechToTextProvider

_stt_provider: SpeechToTextProvider | None = None


def get_speech_processor() -> SpeechToTextProvider:
    """
    Return the singleton STT provider, creating it on first call.

    The provider type is resolved from the STT_PROVIDER environment variable
    via the factory. Consumers call .load_model_async() and .is_ready() on
    the returned instance, exactly as before.
    """
    global _stt_provider
    if _stt_provider is None:
        _stt_provider = get_stt_provider()
    return _stt_provider


def is_speech_model_ready() -> bool:
    """Return True when the STT provider has finished loading its model."""
    return _stt_provider is not None and _stt_provider.is_ready()
