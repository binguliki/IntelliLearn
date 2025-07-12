import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  console.log('TypingIndicator rendered with src=/botavatar.svg'); // Debug log
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <Avatar className="w-8 h-8 shadow-lg bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700">
        <AvatarImage 
          src="/botavatar.svg" 
          alt="Bot Avatar" 
          className="aspect-square h-full w-full object-contain bg-transparent"
        />
      </Avatar>
      
      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;