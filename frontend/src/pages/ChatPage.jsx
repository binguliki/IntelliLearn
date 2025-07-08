import { useState, useRef, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { useAudioRecording } from "../hooks/use-audio-recording.jsx";
import ChatMessage from "../components/ChatMessage";
import TypingIndicator from "../components/TypingIndicator";

const ChatPage = () => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [micError, setMicError] = useState("");

  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }
  
  const {
    isRecording,
    isTranscribing,
    waveformBuffer,
    startRecording,
    stopRecording,
    renderWaveform,
  } = useAudioRecording(sessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const checkBackendReady = async () => {
      try {
        const response = await fetch('http://localhost:8000/ready');
        if (response.ok) {
          setIsBackendReady(true);
        }
      } catch (error) {
        console.log('Backend not ready yet, retrying...');
        setTimeout(checkBackendReady, 1000);
      }
    };
    checkBackendReady();
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = ({ text, file, previewUrl, imageBase64, reset }) => {
    if (!text.trim() && !file) return;
    let userMessage = {
      id: messages.length + 1,
      text: text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      image: previewUrl ? previewUrl : null
    };
    setMessages(prev => [...prev, userMessage]);
    reset();
    setIsTyping(true);

    const imageMimeType = file ? file.type : null;
    const payload = {
      message: text,
      session_id: sessionId,
      image_base64: imageBase64,
      image_mime_type: imageMimeType
    };
    fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Server error: ${res.status} ${res.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
        }
        return res.json();
      })
      .then(data => {
        let botText = data.text;
        if (typeof botText === 'object') {
          botText = JSON.stringify(botText);
        }
        const botResponse = {
          id: messages.length + 2,
          text: botText || 'Sorry, there was an error.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          image: data.image ? `data:image/png;base64,${data.image}` : null,
          quiz: data.quiz || null,
          quizCompleted: false,
          quizReport: null
        };
        setMessages(prev => [...prev, botResponse]);
      })
      .catch(err => {
        setMessages(prev => [...prev, {
          id: messages.length + 2,
          text: `Error contacting server: ${err.message}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
        const base64 = event.target.result.split(',')[1];
        setImageBase64(base64);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
      setImageBase64(null);
    }
  };

  const handleTranscriptionComplete = (transcribedText) => {
    setNewMessage(transcribedText);
  };

  const handleMicClick = async () => {
    setMicError("");
    if (isRecording) {
      stopRecording();
      return;
    }
    try {
      await startRecording(handleTranscriptionComplete);
    } catch (err) {
      setMicError("Microphone access denied or unavailable. Please check your browser settings.");
      console.error("Mic error:", err);
    }
  };

  const handleQuizComplete = async (quizReport, quizMessageId) => {
    // Update the quiz message in messages to mark as completed and store the report
    setMessages(prev => prev.map(msg =>
      msg.id === quizMessageId
        ? { ...msg, quizCompleted: true, quizReport }
        : msg
    ));
    setIsTyping(true);
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizReport })
      });
      const data = await res.json();
      if (data.text && data.text.trim()) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: data.text,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `Error submitting quiz: ${err.message}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-sans pt-16">
      {!isBackendReady && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Initializing backend...</p>
          </div>
        </div>
      )}
      <div className="w-full flex flex-col items-center relative z-10">
        <div className="flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-4 pb-24 scrollbar-none mx-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {messages.map((message) => (
            message.quiz ? (
              <ChatMessage key={message.id} message={message} onQuizComplete={(report) => handleQuizComplete(report, message.id)} />
            ) : (
              <ChatMessage key={message.id} message={message} onQuizComplete={handleQuizComplete} />
            )
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
          {/* ChatInput code inlined here */}
          <form onSubmit={e => {
            e.preventDefault();
            handleSendMessage({
              text: newMessage,
              file: selectedFile,
              previewUrl,
              imageBase64,
              reset: () => {
                setNewMessage('');
                setSelectedFile(null);
                setPreviewUrl(null);
                setImageBase64(null);
              }
            });
          }} className={`flex space-x-2 bg-gray-800/95 border border-gray-700 rounded-xl shadow-lg p-3 relative items-center ${!isBackendReady ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isBackendReady}
                className="flex items-center justify-center h-10 w-10 rounded-l-xl text-gray-400 bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 hover:bg-gray-700 disabled:opacity-50"
                style={{ marginRight: '-0.5rem', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                tabIndex={-1}
              >
                <Paperclip className="w-5 h-5 text-gray-300" />
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="relative">
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isTranscribing || !isBackendReady}
                className={`flex items-center justify-center h-10 w-10 rounded-l-none rounded bg-gray-800 text-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all duration-200 ${
                  isTranscribing || !isBackendReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  marginRight: '-0.5rem',
                  position: 'relative',
                  boxShadow: 'none',
                }}
                tabIndex={-1}
              >
                {isTranscribing ? (
                  <div className="relative z-10">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : isRecording ? (
                  <Square className="w-5 h-5 relative z-10 text-gray-300" />
                ) : (
                  <Mic className="w-5 h-5 relative z-10 text-gray-300" />
                )}
                {isRecording && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full z-20 animate-pulse border-2 border-white"></div>
                )}
              </button>
            </div>
            {micError && <div className="text-red-400 text-xs ml-2">{micError}</div>}
            {isRecording ? (
              <div className="flex-1 flex items-center min-w-0 h-10 relative" style={{height: '40px'}}>
                {renderWaveform()}
              </div>
            ) : (
              <>
                <div className="flex-1 relative flex items-center min-w-0">
                  <Input
                    type="text"
                    placeholder={isTranscribing ? "Transcribing audio..." : "Type your message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    borderless
                    className="w-full rounded-none px-3 py-2 text-sm bg-gray-900 text-gray-100 shadow-none"
                    disabled={isTranscribing || !isBackendReady}
                    style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
                  />
                </div>
                {selectedFile && (
                  <div className="flex items-center space-x-2 ml-2">
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <span className="text-xs text-gray-600 truncate max-w-[120px]">{selectedFile.name}</span>
                    )}
                    <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="text-gray-400 hover:text-red-500">&times;</button>
                  </div>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="w-9 h-9 p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-xl shadow-none"
                  disabled={(!newMessage.trim() && !selectedFile) || isTranscribing || !isBackendReady}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;