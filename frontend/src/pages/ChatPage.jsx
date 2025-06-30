import { useState, useRef, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MessageCircle, Send, LogOut, Bot, User, Image as ImageIcon, Paperclip } from 'lucide-react';
import { useToast } from "../hooks/use-toast";
import ChatMessage from "../components/ChatMessage";
import TypingIndicator from "../components/TypingIndicator";

const ChatPage = ({ setIsAuthenticated }) => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('chat_messages');
    localStorage.removeItem('session_id');
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  const handleReset = () => {
    setMessages([]);
    localStorage.removeItem('chat_messages');
    const newSessionId = crypto.randomUUID();
    localStorage.setItem('session_id', newSessionId);
    setNewMessage('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageBase64(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
  
    let userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      image: previewUrl ? previewUrl : null
    };
    setMessages(prev => [...prev, userMessage]);
  
    setNewMessage('');
    setSelectedFile(null);
    setPreviewUrl(null);
  
    setIsTyping(true);
  
    try {
      const imageMimeType = selectedFile ? selectedFile.type : null;
  
      const payload = {
        message: newMessage,
        session_id: sessionId,
        image_base64: imageBase64,
        image_mime_type: imageMimeType
      };
  
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Server error: ${res.status} ${res.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
      }
  
      const data = await res.json();
      let botText = data.text;
      if (typeof botText === 'object') {
        botText = JSON.stringify(botText);
      }
      const botResponse = {
        id: messages.length + 2,
        text: botText || 'Sorry, there was an error.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        image: data.image ? `data:image/png;base64,${data.image}` : null
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        text: `Error contacting server: ${err.message}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsTyping(false);
      setImageBase64(null);
    }
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

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">ChatBot</h1>
              <p className="text-xs text-gray-400">AI Assistant</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2 border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white pb-24 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
          <form onSubmit={handleSendMessage} className="flex space-x-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center h-10 w-10 rounded-l-xl text-blue-500 bg-white border-none shadow-none transition-colors focus:outline-none focus:ring-0 focus:border-none active:outline-none active:ring-0 active:border-none hover:bg-blue-50"
                style={{ marginRight: '-0.5rem', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                tabIndex={-1}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              borderless
              className="flex-1 rounded-none rounded-r-xl px-3 py-2 text-sm bg-white shadow-none"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            />
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
              className="w-9 h-9 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-none"
              disabled={!newMessage.trim() && !selectedFile}
            >
              <Send className="w-4 h-4" />
            </Button>
            {/* Reset Button */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-16 h-9 p-0 ml-2 text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-red-600"
              onClick={handleReset}
            >
              Reset
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;