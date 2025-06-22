import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Bot, User } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'} animate-fade-in`}>
      <Avatar className={`w-8 h-8 shadow-lg ${isBot ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-blue-500'}`}>
        <AvatarFallback className="text-white">
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-right'}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${
            isBot
              ? 'bg-white border border-gray-200 text-gray-800'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          } transition-all hover:shadow-md`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;