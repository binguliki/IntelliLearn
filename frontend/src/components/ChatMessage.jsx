import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { User } from 'lucide-react';
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
      <Avatar className={`w-8 h-8 shadow-sm ${isBot ? 'bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700' : 'bg-indigo-700'}`}>
        {isBot ? (
          <>
            <AvatarImage
              src="/botavatar.svg"
              alt="Bot Avatar"
              className="w-full h-full object-contain bg-transparent mix-blend-screen"
            />
            <AvatarFallback className="text-gray-200">
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="text-gray-200">
            <User className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-left'}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl shadow-lg text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
            isBot
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-100 shadow-gray-900/50'
              : 'bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 border border-indigo-500/30 text-white shadow-indigo-700/30'
          }`}
        >
          {message.image && (
            <img
              src={message.image}
              alt="uploaded"
              className="mb-2 rounded-lg max-w-xs max-h-60 object-contain border border-gray-700 bg-gray-900"
            />
          )}
          {isLongMessage ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Card className={`cursor-pointer hover:shadow-xl hover:border-indigo-500 transition-all duration-200 max-w-xs border-2 border-gray-700/80 bg-gray-900/90 ${
                  isBot 
                    ? ''
                    : 'bg-gradient-to-br from-indigo-800 via-purple-900 to-fuchsia-900 text-white'
                }`}>
                  <CardContent className="p-3 flex flex-col gap-2">
                    <p className={`leading-relaxed break-words line-clamp-3 text-base max-h-16 overflow-hidden text-ellipsis font-medium ${
                      isBot ? 'text-gray-100' : 'text-white'
                    }`}>
                      {message.text}
                    </p>
                    <span className={`text-xs mt-2 font-semibold flex items-center gap-1 ${
                      isBot ? 'text-indigo-400' : 'text-indigo-100'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      <span>Click to read more</span>
                    </span>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] bg-gray-900 text-gray-100 p-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold mb-2 text-indigo-300">Full Message</h3>
                  <hr className="border-gray-700 mb-4" />
                  <div className="prose prose-invert prose-sm max-w-none overflow-auto max-h-[60vh] pr-2">
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
        <p className={`text-xs text-gray-500 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;