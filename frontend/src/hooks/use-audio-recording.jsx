import { useState, useRef, useEffect } from 'react';
import { useToast } from './use-toast.jsx';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformBuffer, setWaveformBuffer] = useState(Array(110).fill(8));
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const { toast } = useToast();
  const WAVEFORM_BARS = 120;

  // Function to convert webm to wav
  const convertWebmToWav = async (webmBlob) => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const wavBlob = audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        } finally {
          audioContext.close();
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(webmBlob);
    });
  };

  const audioBufferToWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    const buffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numChannels * 2, true);
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
      setWaveformBuffer(Array(WAVEFORM_BARS).fill(8));
      return;
    }
    let raf;
    let lastUpdate = Date.now();
    const INTERVAL = 60;
    const update = () => {
      const now = Date.now();
      if (analyserRef.current && now - lastUpdate > INTERVAL) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setWaveformBuffer(prev => {
          const next = prev.slice(1);
          next.push(Math.max(6, Math.min(32, avg / 3 + Math.random() * 8)));
          return next;
        });
        lastUpdate = now;
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => raf && cancelAnimationFrame(raf);
  }, [isRecording]);

  const updateAudioLevel = () => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const processAudioRecording = async (onTranscriptionComplete) => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsTranscribing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const wavBlob = await convertWebmToWav(audioBlob);
      
      const formData = new FormData();
      formData.append('audio_file', wavBlob, 'recording.wav');
      
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      if (!data.success || data.error) {
        throw new Error(data.error || 'Transcription failed');
      }

      const transcribedText = data.text || '';
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(transcribedText);
      }
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: new String(error),
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async (onTranscriptionComplete) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        await processAudioRecording(onTranscriptionComplete);
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const renderWaveform = () => {
    if (!isRecording) return null;
    return (
      <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center pointer-events-none" style={{zIndex: 2}}>
        <div className="flex items-end w-full justify-center" style={{height: '32px'}}>
          {waveformBuffer.map((h, i) => (
            <div
              key={i}
              className="rounded bg-blue-400"
              style={{
                width: '2.5px',
                marginLeft: i === 0 ? 0 : '2px',
                height: `${h}px`,
                transition: 'height 0.15s',
                opacity: 0.85
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return {
    isRecording,
    isTranscribing,
    audioLevel,
    waveformBuffer,
    startRecording,
    stopRecording,
    processAudioRecording,
    renderWaveform,
  };
}; 