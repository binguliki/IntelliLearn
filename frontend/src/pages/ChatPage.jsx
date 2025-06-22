import { useState, useRef, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { MessageCircle, Send, LogOut, Bot, User } from 'lucide-react';
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
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
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
    }, 1500 + Math.random() * 2000); // Random delay between 1.5-3.5 seconds
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ChatBot</h1>
              <p className="text-sm text-gray-500">AI Assistant</p>
            </div>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-12 bg-white shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;