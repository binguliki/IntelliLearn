import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import QuizMessage from './QuizMessage';

const ChatMessage = ({ message, onQuizComplete }) => {
  const isBot = message.sender === 'bot';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const maxLength = 500;
  const isLongMessage = message.text.length > maxLength;

  if (message.quiz) {
    return <QuizMessage message={message} onQuizComplete={onQuizComplete} />;
  }

  return (
    <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'} animate-fade-in`}>
      <Avatar className={`w-8 h-8 shadow-sm ${isBot ? 'bg-gray-200' : 'bg-blue-100'}`}>
        <AvatarFallback className="text-gray-500">
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-left'}`}>
        <div
          className={`inline-block px-4 py-2 rounded-xl shadow-sm text-sm font-sans ${
            isBot
              ? 'bg-white border border-gray-200 text-gray-800'
              : 'bg-gray-50 border border-blue-100 text-gray-900'
          }`}
        >
          {message.image && (
            <img
              src={message.image}
              alt="uploaded"
              className="mb-2 rounded-lg max-w-xs max-h-60 object-contain border border-gray-200 bg-white"
            />
          )}
          {isLongMessage ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow max-w-xs">
                  <CardContent className="p-2">
                    <p className="leading-relaxed break-words line-clamp-3 text-sm max-h-16 overflow-hidden text-ellipsis">
                      {message.text}
                    </p>
                    <span className="text-blue-500 text-xs mt-1 block">
                      Click to read more
                    </span>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="leading-relaxed break-words">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </p>
          )}
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;