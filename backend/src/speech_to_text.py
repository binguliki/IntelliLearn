import io
import librosa
import soundfile as sf
from transformers import AutoProcessor
from optimum.intel.openvino import OVModelForSpeechSeq2Seq
import numpy as np
import threading

class SpeechToTextProcessor:
    def __init__(self):
        self.model = None
        self.processor = None
        self.model_id = "OpenVINO/whisper-tiny-fp16-ov"
        self._ready = False

    def _load_model(self):
        try:
            self.processor = AutoProcessor.from_pretrained(self.model_id)
            self.model = OVModelForSpeechSeq2Seq.from_pretrained(self.model_id)
            self._ready = True
        except Exception as e:
            print(f"Error loading Whisper model: {e}")
            self._ready = False
            raise

    def load_model_async(self):
        def target():
            self._load_model()
        thread = threading.Thread(target=target)
        thread.daemon = True
        thread.start()

    def is_ready(self):
        return self._ready

    def transcribe_audio_bytes(self, audio_bytes: bytes) -> str:
        try:
            audio_buffer = io.BytesIO(audio_bytes)
            waveform, sample_rate = sf.read(audio_buffer)

            if len(waveform.shape) > 1:
                waveform = np.mean(waveform, axis=1)

            if sample_rate != 16000:
                waveform = librosa.resample(waveform, orig_sr=sample_rate, target_sr=16000)

            inputs = self.processor(
                waveform,
                sampling_rate=16000,
                return_tensors="pt"
            )
            outputs = self.model.generate(inputs.input_features)
            transcription = self.processor.batch_decode(outputs, skip_special_tokens=True)[0]
            transcription = transcription.strip()
            special_tokens = [
                '<|startoftranscript|>', '<|endoftext|>', '<|transcribe|>', 
                '<|notimestamps|>', '<|en|>', '<|endoftext|>'
            ]
            for token in special_tokens:
                transcription = transcription.replace(token, '')
                
            transcription = ' '.join(transcription.split())
            
            return transcription

        except Exception as e:
            print(f"Error transcribing audio: {e}")
            raise

speech_processor = None

def get_speech_processor():
    global speech_processor
    if speech_processor is None:
        speech_processor = SpeechToTextProcessor()
    return speech_processor

def is_speech_model_ready():
    global speech_processor
    if speech_processor is None:
        return False
    return speech_processor.is_ready()
