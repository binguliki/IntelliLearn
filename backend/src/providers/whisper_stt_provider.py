import io
import os
import threading

import librosa
import numpy as np
import soundfile as sf
from optimum.intel.openvino import OVModelForSpeechSeq2Seq
from transformers import AutoProcessor

from .base import SpeechToTextProvider


class WhisperSTTProvider(SpeechToTextProvider):
    """
    Speech-to-text provider backed by an OpenVINO-optimised Whisper model.

    Configuration (read from environment):
        STT_MODEL_ID - HuggingFace model ID for the Whisper OpenVINO variant
                       (default: OpenVINO/whisper-tiny-fp16-ov)

    The model is heavy to load, so it is always loaded asynchronously via
    load_model_async(). Call is_ready() to check whether transcription can
    begin before accepting audio requests.
    """

    # Special tokens emitted by Whisper that should be stripped from output.
    _SPECIAL_TOKENS = [
        "<|startoftranscript|>",
        "<|endoftext|>",
        "<|transcribe|>",
        "<|notimestamps|>",
        "<|en|>",
    ]

    def __init__(self):
        self.model_id = os.getenv("STT_MODEL_ID", "OpenVINO/whisper-tiny-fp16-ov")
        self._model = None
        self._processor = None
        self._ready = False

    # ------------------------------------------------------------------
    # SpeechToTextProvider interface
    # ------------------------------------------------------------------

    def load_model_async(self) -> None:
        """Start model loading in a background daemon thread."""
        thread = threading.Thread(target=self._load_model, daemon=True)
        thread.start()

    def is_ready(self) -> bool:
        return self._ready

    def transcribe_audio_bytes(self, audio_bytes: bytes) -> str:
        """
        Transcribe raw audio bytes to a text string.

        Audio is resampled to 16 kHz mono before being passed to Whisper.
        Special tokens and redundant whitespace are stripped from the output.

        Args:
            audio_bytes: Raw audio file bytes.

        Returns:
            Clean transcription string.

        Raises:
            RuntimeError: If called before the model has finished loading.
            Exception:    Propagated from the underlying model on failure.
        """
        if not self._ready:
            raise RuntimeError(
                "Whisper model is not yet loaded. "
                "Call load_model_async() at startup and check is_ready() first."
            )
        try:
            waveform, sample_rate = sf.read(io.BytesIO(audio_bytes))

            # Convert stereo / multi-channel to mono
            if len(waveform.shape) > 1:
                waveform = np.mean(waveform, axis=1)

            # Resample to 16 kHz (Whisper requirement)
            if sample_rate != 16000:
                waveform = librosa.resample(
                    waveform, orig_sr=sample_rate, target_sr=16000
                )

            inputs = self._processor(
                waveform, sampling_rate=16000, return_tensors="pt"
            )
            outputs = self._model.generate(inputs.input_features)
            transcription = self._processor.batch_decode(
                outputs, skip_special_tokens=True
            )[0].strip()

            for token in self._SPECIAL_TOKENS:
                transcription = transcription.replace(token, "")

            return " ".join(transcription.split())

        except Exception as e:
            print(f"[WhisperSTTProvider] Error transcribing audio: {e}")
            raise

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load_model(self) -> None:
        """Load the processor and model from HuggingFace / local cache."""
        try:
            self._processor = AutoProcessor.from_pretrained(self.model_id)
            self._model = OVModelForSpeechSeq2Seq.from_pretrained(self.model_id)
            self._ready = True
            print(f"[WhisperSTTProvider] Model '{self.model_id}' loaded successfully.")
        except Exception as e:
            self._ready = False
            print(f"[WhisperSTTProvider] Error loading model '{self.model_id}': {e}")
            raise
