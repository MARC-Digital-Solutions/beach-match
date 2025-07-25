import React, { useEffect, useState } from 'react';

interface PointsAnimationProps {
  points: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export const PointsAnimation: React.FC<PointsAnimationProps> = ({
  points,
  x,
  y,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    // Small delay before animation starts
    const startTimer = setTimeout(() => {
      // Start animation after brief delay
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 1500); // Total animation duration

      // Animate opacity and position
      const fadeTimer = setTimeout(() => {
        setOpacity(0);
      }, 1000);

      const moveTimer = setTimeout(() => {
        setTranslateY(-50);
      }, 200);

      return () => {
        clearTimeout(timer);
        clearTimeout(fadeTimer);
        clearTimeout(moveTimer);
      };
    }, 100); // 100ms delay before animation starts

    return () => {
      clearTimeout(startTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 select-none"
      style={{
        left: x,
        top: y,
        transform: `translateY(${translateY}px)`,
        opacity,
        transition: 'all 1.5s ease-out'
      }}
    >
      <div className="text-yellow-400 font-bold text-3xl drop-shadow-lg animate-pulse">
        +{points.toLocaleString()}
      </div>
      <div className="text-yellow-300 text-sm font-semibold text-center mt-1 drop-shadow-lg">
        POINTS!
      </div>
    </div>
  );
}; 