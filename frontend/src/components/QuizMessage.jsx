import { useState } from 'react';
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Bot, User } from 'lucide-react';

const QuizMessage = ({ message, onQuizComplete }) => {
  const isBot = message.sender === 'bot';
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(message.quiz.questions.length).fill(''));
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSelect = (optionIdx) => {
    const updated = [...answers];
    const q = message.quiz.questions[current];
    if (q.multipleCorrectAnswers) {
      const parts = updated[current] ? updated[current].split(',') : [];
      const idx = parts.indexOf(String(optionIdx + 1));
      if (idx > -1) {
        parts.splice(idx, 1);
      } else {
        parts.push(String(optionIdx + 1));
      }
      updated[current] = parts.sort().join(',');
    } else {
      updated[current] = String(optionIdx + 1);
    }
    setAnswers(updated);
  };

  const handleNext = () => {
    if (current < message.quiz.questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const fb = message.quiz.questions.map((q, i) => {
        const userAns = answers[i] || '';
        const correctAns = q.correctOption.replace(/\s/g, '');
        const userAnsSet = new Set(userAns.split(',').filter(Boolean));
        const correctAnsSet = new Set(correctAns.split(',').filter(Boolean));
        const isCorrect = userAnsSet.size === correctAnsSet.size && [...userAnsSet].every(x => correctAnsSet.has(x));
        return {
          questionNumber: q.questionNumber,
          userAnswer: userAns,
          correctAnswer: correctAns,
          isCorrect
        };
      });
      setFeedback(fb);
      setCompleted(true);
      if (onQuizComplete) {
        onQuizComplete(fb);
      }
    }
  };

  if (completed) {
    return (
      <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'} animate-fade-in`}>
        <Avatar className={`w-8 h-8 shadow-sm ${isBot ? 'bg-gray-200' : 'bg-blue-100'}`}>
          <AvatarFallback className="text-gray-500">
            {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-left'}`}>
          <div className="inline-block px-4 py-2 rounded-xl shadow-sm text-sm font-sans bg-white border border-gray-200 text-gray-800">
            <div className="font-semibold mb-2">Quiz Complete!</div>
            <div>Thank you for taking the quiz. Your answers have been submitted.</div>
            {feedback && feedback.map((fb, idx) => (
              <div key={idx} className="mb-1">
                <span className={fb.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  Q{fb.questionNumber}: {fb.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
                <span className="ml-2 text-gray-700">Your answer: {fb.userAnswer} | Correct: {fb.correctAnswer}</span>
              </div>
            ))}
          </div>
          <p className={`text-xs text-gray-400 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>{message.timestamp}</p>
        </div>
      </div>
    );
  }

  const q = message.quiz.questions[current];
  const selected = answers[current] ? answers[current].split(',') : [];
  return (
    <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'} animate-fade-in`}>
      <Avatar className={`w-8 h-8 shadow-sm ${isBot ? 'bg-gray-200' : 'bg-blue-100'}`}>
        <AvatarFallback className="text-gray-500">
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-left'}`}>
        <div className="inline-block px-4 py-2 rounded-xl shadow-sm text-sm font-sans bg-white border border-gray-200 text-gray-800">
          <div className="mb-2 font-semibold">{message.quiz.quizTitle || 'Quiz'}</div>
          <div className="mb-2">Q{q.questionNumber}: {q.question}</div>
          <div className="space-y-1 mb-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                className={`block w-full text-left px-3 py-1 rounded border ${selected.includes(String(idx+1)) ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'} hover:bg-blue-50`}
                onClick={() => handleSelect(idx)}
                type="button"
              >
                {String.fromCharCode(65+idx)}. {opt}
              </button>
            ))}
          </div>
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleNext}
            disabled={!answers[current]}
          >
            {current < message.quiz.questions.length - 1 ? 'Next' : 'Submit'}
          </button>
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>{message.timestamp}</p>
      </div>
    </div>
  );
};

export default QuizMessage; 