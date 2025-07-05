import { useState, useRef, useEffect } from 'react';
import { useToast } from './use-toast.jsx';

export const useAudioRecording = (sessionId) => {
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
  const WAVEFORM_BARS = 110;

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
      
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('session_id', sessionId);
      
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const data = await response.json();
      const transcribedText = data.text || '';
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(transcribedText);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Transcription failed",
        description: "Failed to transcribe audio. Please try again.",
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