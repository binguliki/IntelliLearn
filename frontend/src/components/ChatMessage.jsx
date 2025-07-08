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
          className={`inline-block px-4 py-3 rounded-2xl shadow-lg text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
            isBot
              ? 'bg-gradient-to-br from-white to-gray-50 border border-gray-200/60 text-gray-800 shadow-gray-200/50'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400/30 text-white shadow-blue-500/30'
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
                <Card className={`cursor-pointer hover:shadow-lg transition-all duration-200 max-w-xs ${
                  isBot 
                    ? 'bg-gradient-to-br from-white to-gray-50 border-gray-200/60 hover:border-gray-300/60' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/30 hover:border-blue-300/50 text-white'
                }`}>
                  <CardContent className="p-3">
                    <p className={`leading-relaxed break-words line-clamp-3 text-sm max-h-16 overflow-hidden text-ellipsis ${
                      isBot ? 'text-gray-800' : 'text-white'
                    }`}>
                      {message.text}
                    </p>
                    <span className={`text-xs mt-2 block font-medium ${
                      isBot ? 'text-blue-500' : 'text-blue-100'
                    }`}>
                      Click to read more
                    </span>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh]">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Full Message</h3>
                  <div className="prose prose-sm max-w-none overflow-auto max-h-[60vh] pr-2">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                </div>
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