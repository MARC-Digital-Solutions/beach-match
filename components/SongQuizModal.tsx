import React, { useEffect } from 'react';
import { QuizQuestion } from '@/lib/types';
import { AudioManager } from '@/lib/audioManager';

interface SongQuizModalProps {
  isOpen: boolean;
  question: QuizQuestion | null;
  timeRemaining: number;
  onAnswer: (selectedAnswer: number) => void;
  onClose: () => void;
  showCelebration?: boolean;
  showWrong?: boolean;
}

export const SongQuizModal: React.FC<SongQuizModalProps> = ({
  isOpen,
  question,
  timeRemaining,
  onAnswer,
  onClose,
  showCelebration = false,
  showWrong = false
}) => {
  // Auto-play song clip when modal opens for song questions
  useEffect(() => {
    if (isOpen && question && question.type === 'song') {
      AudioManager.playQuizClip(question).catch(console.error);
    }
    return () => {
      if (question?.type === 'song') {
        AudioManager.stopQuizClip();
      }
    };
  }, [isOpen, question]);

  if (!isOpen || !question) return null;

  const getModalTitle = () => {
    switch (question.type) {
      case 'song':
        return '🎵 Song Quiz';
      case 'space_coast':
        return '🚀 Space Coast Quiz';
      case 'florida_beach':
        return '🏖️ Florida Beach Quiz';
      default:
        return '❓ Quiz Time';
    }
  };

  const getModalIcon = () => {
    switch (question.type) {
      case 'song':
        return '🎤';
      case 'space_coast':
        return '🚀';
      case 'florida_beach':
        return '🏖️';
      default:
        return '❓';
    }
  };

  const getModalColor = () => {
    switch (question.type) {
      case 'song':
        return 'from-purple-500 to-pink-500';
      case 'space_coast':
        return 'from-blue-600 to-indigo-700';
      case 'florida_beach':
        return 'from-cyan-400 to-teal-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const renderQuestionContent = () => {
    if (question.type === 'song') {
      return (
        <div className="text-center mb-6">
          <div className="text-xl font-bold text-white mb-3">
            🎵 Guess the Song! 🎵
          </div>
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="text-yellow-300 font-semibold mb-2">Lyric Hint:</div>
            <div className="text-white italic">
              &quot;{question.lyricHint}&quot;
            </div>
          </div>
          <div className="text-sm text-blue-200">
            🎧 Listen to the audio clip above and pick the right song!
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center mb-6">
          <div className="text-xl font-bold text-white mb-4">
            {question.question}
          </div>
          {'hint' in question && (
            <div className="bg-black/30 rounded-lg p-3 mb-4">
              <div className="text-yellow-300 font-semibold mb-1">💡 Hint:</div>
              <div className="text-white/90 text-sm italic">
                {question.hint}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${getModalColor()} rounded-xl shadow-2xl border-4 border-white/20 max-w-md w-full mx-4 transform animate-bounce-in relative`}>
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">{getModalIcon()}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{getModalTitle()}</h2>
            {/* Timer */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-300 animate-pulse' : 'text-yellow-300'}`}>
                ⏱️ {timeRemaining}s
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-black/30 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeRemaining <= 10 ? 'bg-red-400' : 'bg-yellow-400'
                }`}
                style={{ width: `${(timeRemaining / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Content */}
          {renderQuestionContent()}

          {/* Answer Options */}
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswer(index)}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 border border-white/30 hover:border-white/50"
              >
                <span className="text-yellow-300 font-bold mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Close Button */}
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-sm underline transition-colors"
            >
              Skip Question
            </button>
          </div>
        </div>
        {/* Celebration Animation Overlay */}
        {showCelebration && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none animate-fade-in-fast">
            <div className="text-7xl mb-4 animate-bounce">🎉🎵✨</div>
            <div className="text-3xl font-extrabold text-yellow-300 drop-shadow-lg animate-pulse">Correct!</div>
            <div className="text-lg text-white mt-2 animate-fade-in">+1 Life &nbsp; +200 Points</div>
            <div className="absolute inset-0 pointer-events-none">
              {/* Confetti burst using emoji */}
              <div className="absolute left-1/4 top-1/4 text-4xl animate-confetti">🎊</div>
              <div className="absolute right-1/4 top-1/3 text-4xl animate-confetti">🎊</div>
              <div className="absolute left-1/3 bottom-1/4 text-4xl animate-confetti">🎉</div>
              <div className="absolute right-1/3 bottom-1/3 text-4xl animate-confetti">🎉</div>
            </div>
          </div>
        )}
        {/* Wrong Animation Overlay */}
        {showWrong && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none animate-fade-in-fast">
            <div className="text-7xl mb-4 animate-shake text-red-400">❌</div>
            <div className="text-3xl font-extrabold text-red-400 drop-shadow-lg animate-pulse">Wrong!</div>
            <div className="text-lg text-white mt-2 animate-fade-in">No bonus this time</div>
            <div className="absolute inset-0 pointer-events-none">
              {/* Subtle red burst using emoji */}
              <div className="absolute left-1/4 top-1/4 text-4xl animate-confetti text-red-300">💥</div>
              <div className="absolute right-1/4 top-1/3 text-4xl animate-confetti text-red-300">💥</div>
              <div className="absolute left-1/3 bottom-1/4 text-4xl animate-confetti text-red-400">❌</div>
              <div className="absolute right-1/3 bottom-1/3 text-4xl animate-confetti text-red-400">❌</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 