import React, { useState, useEffect } from 'react';

interface GameTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
}

interface TutorialStep {
  title: string;
  description: string;
  highlight?: string;
  animation?: 'pulse' | 'bounce' | 'wiggle';
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Beach Match!",
    description: "Match 3 or more identical beach items to score points and clear them from the board.",
    highlight: "Look for groups of the same items!"
  },
  {
    title: "How to Swap Pieces",
    description: "Click on a piece, then click on an adjacent piece (up, down, left, or right) to swap them.",
    highlight: "Only adjacent pieces can be swapped!",
    animation: 'wiggle'
  },
  {
    title: "Creating Matches",
    description: "When 3 or more identical pieces line up horizontally or vertically, they'll disappear and you'll score points!",
    highlight: "The more pieces you match, the higher your score!",
    animation: 'pulse'
  },
  {
    title: "Special Power-Ups",
    description: "Match 4 or more pieces to create special power-ups that can clear entire rows, columns, or colors!",
    highlight: "Look for the ⭐ symbol on special pieces!",
    animation: 'bounce'
  },
  {
    title: "Beach Bonuses",
    description: "Listen to 98.5 The Beach for bonus lives and points! Guess songs correctly for extra rewards!",
    highlight: "🎵 Stream time = bonus lives every 5 minutes!"
  },
  {
    title: "Lives & Game Over",
    description: "You start with 3 lives. Lose a life when no matches are possible. Earn lives by streaming and engagement!",
    highlight: "Keep listening to keep playing!"
  }
];

export const GameTutorial: React.FC<GameTutorialProps> = ({
  isVisible,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowDemo(true);
    }
  };

  const skipTutorial = () => {
    onComplete();
  };

  const completeTutorial = () => {
    onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
        
        {!showDemo ? (
          <>
            {/* Tutorial Steps */}
            <div className="mb-6">
              <div className="text-2xl font-bold text-beach-700 mb-4">
                {step.title}
              </div>
              
              {/* Demo Grid Visualization */}
              <div className="mb-6 flex justify-center">
                <div className="grid grid-cols-3 gap-1 bg-beach-100 p-4 rounded-lg">
                  {[
                    '⛱️', '🎤', '🚀',
                    '⛱️', '⛱️', '🌴', 
                    '🎤', '⛵', '🌴'
                  ].map((emoji, i) => (
                    <div 
                      key={i}
                      className={`
                        w-12 h-12 text-2xl flex items-center justify-center
                        ${currentStep === 2 && [0, 3, 4].includes(i) ? 'bg-yellow-200 animate-pulse' : 'bg-white'}
                        ${currentStep === 3 && i === 4 ? 'animate-bounce' : ''}
                        rounded-lg shadow
                      `}
                    >
                      {emoji}
                      {currentStep === 3 && i === 4 && (
                        <div className="absolute -top-1 -right-1 text-xs">⭐</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-gray-700 mb-4">
                {step.description}
              </div>

              {step.highlight && (
                <div className={`
                  text-beach-600 font-semibold text-sm bg-beach-50 p-3 rounded-lg
                  ${step.animation === 'pulse' ? 'animate-pulse' : ''}
                  ${step.animation === 'bounce' ? 'animate-bounce' : ''}
                `}>
                  💡 {step.highlight}
                </div>
              )}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mb-6">
              {tutorialSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentStep ? 'bg-beach-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={skipTutorial}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip Tutorial
              </button>
              
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-beach-500 text-white rounded-lg hover:bg-beach-600 transition-colors font-semibold"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Start Demo' : 'Next'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Demo Complete */}
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-2xl font-bold text-beach-700 mb-4">
                Ready to Play!
              </div>
              <div className="text-gray-700 mb-6">
                Now you know how to match beach items and earn bonuses. Let's start your beach adventure!
              </div>
              
              <button
                onClick={completeTutorial}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-beach-500 text-white rounded-xl hover:from-blue-600 hover:to-beach-600 transition-all transform hover:scale-105 font-bold text-lg"
              >
                🏖️ Start Beach Match! 🏖️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 