import React, { useEffect, useState } from 'react';

interface SwipeIndicatorProps {
  direction: 'up' | 'down' | 'left' | 'right';
  x: number;
  y: number;
  onComplete: () => void;
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
  direction,
  x,
  y,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 300);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  const getDirectionArrow = () => {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
    }
  };

  const getDirectionColor = () => {
    switch (direction) {
      case 'up': return 'text-blue-400';
      case 'down': return 'text-blue-400';
      case 'left': return 'text-green-400';
      case 'right': return 'text-green-400';
    }
  };

  return (
    <div
      className="fixed pointer-events-none z-50 select-none"
      style={{
        left: x - 25,
        top: y - 25,
      }}
    >
      <div className={`text-4xl font-bold drop-shadow-lg animate-pulse ${getDirectionColor()}`}>
        {getDirectionArrow()}
      </div>
    </div>
  );
}; 