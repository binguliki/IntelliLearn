import { useState, useRef, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { MessageCircle, Send, LogOut, Bot, User, Image as ImageIcon, Paperclip } from 'lucide-react';
import { useToast } from "../hooks/use-toast";
import ChatMessage from "../components/ChatMessage";
import TypingIndicator from "../components/TypingIndicator";

const ChatPage = ({ setIsAuthenticated }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [fileType, setFileType] = useState('image');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileTypeOptions = [
    { label: 'Image', value: 'image' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Doc', value: 'doc' },
  ];

  const getAcceptType = () => {
    switch (fileType) {
      case 'image':
        return 'image/*';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return '*/*';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  const simulateBotResponse = (userMessage) => {
    const responses = [
      "That's an interesting question! Let me think about that...",
      "I understand what you're asking. Here's my perspective on that:",
      "Great point! I'd be happy to help you with that.",
      "That reminds me of something important I should mention:",
      "I see what you mean. Let me provide you with some insights:",
      "Absolutely! Here's what I think about your question:",
      "That's a fantastic question. I'm glad you asked!",
      "I appreciate you sharing that with me. Here's my response:",
    ];
    
    const followUps = [
      " What are your thoughts on this approach?",
      " Would you like me to elaborate on any specific aspect?",
      " Is there anything else you'd like to know about this topic?",
      " How does this align with what you were expecting?",
      " Feel free to ask if you need any clarification!",
      " What would you like to explore next?",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const randomFollowUp = followUps[Math.floor(Math.random() * followUps.length)];
    
    return randomResponse + randomFollowUp;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    let userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    if (selectedFile) {
      if (fileType === 'image' && previewUrl) {
        userMessage.image = previewUrl;
      } else {
        userMessage.file = {
          name: selectedFile.name,
          type: selectedFile.type,
        };
      }
    }
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsTyping(true);

    // Simulate bot typing and response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: simulateBotResponse(newMessage),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 2000);
  };

  const handlePaperclipClick = () => {
    setDropdownOpen((open) => !open);
  };

  const handleFileTypeSelect = (type) => {
    setFileType(type);
    setDropdownOpen(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (fileType === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
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
                onClick={handlePaperclipClick}
                className="flex items-center justify-center h-10 w-10 rounded-l-xl text-blue-500 bg-white border-none shadow-none transition-colors focus:outline-none focus:ring-0 focus:border-none active:outline-none active:ring-0 active:border-none hover:bg-blue-50"
                style={{ marginRight: '-0.5rem', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                tabIndex={-1}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 bottom-12 bg-white border border-gray-200 rounded-md shadow-md z-30 min-w-[120px]">
                  {fileTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFileTypeSelect(opt.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="file"
              accept={getAcceptType()}
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
                {fileType === 'image' && previewUrl ? (
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
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;