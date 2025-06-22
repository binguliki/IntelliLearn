import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <Avatar className="w-8 h-8 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
        <AvatarFallback className="text-white">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;