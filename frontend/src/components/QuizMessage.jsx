import { useState } from 'react';
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { User, CheckCircle, XCircle } from 'lucide-react';

const QuizMessage = ({ message, onQuizComplete }) => {
  const isBot = message.sender === 'bot';
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(message.quiz.questions.length).fill(''));
  const [submitted, setSubmitted] = useState(Array(message.quiz.questions.length).fill(false));
  const [feedback, setFeedback] = useState(Array(message.quiz.questions.length).fill(null));

  const q = message.quiz.questions[current];
  const selected = answers[current] ? answers[current].split(',') : [];
  const isSubmitted = submitted[current];
  const currentFeedback = feedback[current];

  const handleSelect = (optionIdx) => {
    if (isSubmitted || message.quizCompleted) return;
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

  const handleSubmit = () => {
    if (!answers[current]) return;
    const q = message.quiz.questions[current];
    const userAns = answers[current] || '';
    const correctAns = q.correctOption.replace(/\s/g, '');
    const userAnsSet = new Set(userAns.split(',').filter(Boolean));
    const correctAnsSet = new Set(correctAns.split(',').filter(Boolean));
    const isCorrect = userAnsSet.size === correctAnsSet.size && [...userAnsSet].every(x => correctAnsSet.has(x));
    const newSubmitted = [...submitted];
    newSubmitted[current] = true;
    setSubmitted(newSubmitted);
    const newFeedback = [...feedback];
    newFeedback[current] = {
      isCorrect,
      explanation: q.explanation,
      correctAns: correctAns,
      userAns: userAns
    };
    setFeedback(newFeedback);
  };

  const handleNext = () => {
    if (current < message.quiz.questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const report = message.quiz.questions.map((q, i) => {
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
      if (onQuizComplete) onQuizComplete(report, message.id);
    }
  };

  if (message.quizCompleted) {
    return (
      <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'} animate-fade-in`}>
        <Avatar className={`w-8 h-8 shadow-sm ${isBot ? 'bg-gray-700' : 'bg-indigo-700'}`}>
          {isBot ? 
            <AvatarImage 
              src="/botavatar.svg" 
              alt="Bot Avatar" 
              className="aspect-square h-full w-full object-contain bg-transparent"
            /> : 
            <User className="w-4 h-4" />
          }
        </Avatar>
        <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-left'}`}>
          <div className="px-6 py-4 rounded-2xl shadow-lg text-base font-sans bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-indigo-700 text-gray-100 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent">Quiz completed!</span>
            </div>
            <div className="text-sm text-gray-300 mb-1">Your responses have been submitted successfully.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'} animate-fade-in`}>
      <Avatar className={`w-8 h-8 shadow-sm ${isBot ? 'bg-gray-700' : 'bg-indigo-700'}`}>
          {isBot ? 
            <AvatarImage 
              src="/botavatar.svg" 
              alt="Bot Avatar" 
              className="aspect-square h-full w-full object-contain bg-transparent"
            /> : 
            <User className="w-4 h-4" />
          }
      </Avatar>
      <div className={`max-w-xs lg:max-w-md ${isBot ? '' : 'text-left'}`}>
        <div className="inline-block px-4 py-4 rounded-xl shadow-sm text-sm font-sans bg-gray-900 border border-gray-700 text-gray-100">
          <div className="mb-2 font-semibold">{message.quiz.quizTitle || 'Quiz'}</div>
          <div className="mb-2">Q{q.questionNumber}: {q.question}</div>
          <div className="space-y-1 mb-2">
            {q.options.map((opt, idx) => {
              const isSelected = selected.includes(String(idx+1));
              let optionState = '';
              if (isSubmitted) {
                const correctAnsSet = new Set(q.correctOption.replace(/\s/g, '').split(',').filter(Boolean));
                if (isSelected && correctAnsSet.has(String(idx+1))) {
                  optionState = 'correct';
                } else if (isSelected && !correctAnsSet.has(String(idx+1))) {
                  optionState = 'wrong';
                } else if (!isSelected && correctAnsSet.has(String(idx+1)) && !q.multipleCorrectAnswers) {
                  optionState = 'missed';
                }
              }
              return (
                <button
                  key={idx}
                  className={`block w-full text-left px-3 py-1 rounded border transition-colors duration-150 ${
                    isSelected
                      ? 'bg-indigo-700 border-indigo-400 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700 hover:border-indigo-400'
                  } ${
                    isSubmitted && optionState === 'correct' ? 'border-green-400 bg-green-900/60' :
                    isSubmitted && optionState === 'wrong' ? 'border-red-400 bg-red-900/60' :
                    ''
                  } flex items-center justify-between`}
                  onClick={() => handleSelect(idx)}
                  type="button"
                  disabled={isSubmitted}
                >
                  <span>{String.fromCharCode(65+idx)}. {opt}</span>
                  {isSubmitted && optionState === 'correct' && <CheckCircle className="w-4 h-4 text-green-400 ml-2" />}
                  {isSubmitted && optionState === 'wrong' && <XCircle className="w-4 h-4 text-red-400 ml-2" />}
                </button>
              );
            })}
          </div>
          {isSubmitted && currentFeedback && (
            <div className={`mb-2 text-xs ${currentFeedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {currentFeedback.isCorrect ? 'Correct!' : 'Incorrect.'} {currentFeedback.explanation && <span className="text-gray-300">{currentFeedback.explanation}</span>}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            {!isSubmitted && (
              <button
                className="px-4 py-1 rounded bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white hover:from-indigo-700 hover:to-fuchsia-700 transition-all"
                onClick={handleSubmit}
                disabled={!answers[current]}
              >
                Submit Answer
              </button>
            )}
            {isSubmitted && (
              <button
                className="px-4 py-1 rounded bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 transition-all"
                onClick={handleNext}
              >
                {current < message.quiz.questions.length - 1 ? 'Next' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>{message.timestamp}</p>
      </div>
    </div>
  );
};

export default QuizMessage; 