import React, { useEffect, useState } from 'react';

interface WaveCrashEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

export const WaveCrashEffect: React.FC<WaveCrashEffectProps> = ({
  isActive,
  onComplete
}) => {
  const [phase, setPhase] = useState<'warning' | 'crash' | 'complete'>('warning');
  
  useEffect(() => {
    if (!isActive) {
      setPhase('warning');
      return;
    }

    // Warning phase (1.5 seconds)
    setPhase('warning');
    
    const warningTimer = setTimeout(() => {
      setPhase('crash');
      
      // Crash phase (1 second)
      const crashTimer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 1000);

      return () => clearTimeout(crashTimer);
    }, 1500);

    return () => clearTimeout(warningTimer);
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      {/* Warning Phase */}
      {phase === 'warning' && (
        <div className="text-center animate-bounce">
          <div className="text-6xl mb-4 animate-pulse">⚠️</div>
          <div className="text-4xl font-bold text-blue-600 mb-2 animate-pulse">
            WAVE INCOMING!
          </div>
          <div className="text-xl text-blue-500">
            🌊 Boats become waves! Double points! 🌊
          </div>
        </div>
      )}

      {/* Crash Phase */}
      {phase === 'crash' && (
        <>
          {/* Wave overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/30 to-blue-600/50 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Multiple wave emojis with different animations */}
              <div className="absolute text-8xl animate-spin">🌊</div>
              <div className="absolute text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>🌊</div>
              <div className="absolute text-7xl animate-pulse" style={{ animationDelay: '0.2s' }}>🌊</div>
              <div className="absolute text-5xl animate-ping" style={{ animationDelay: '0.3s' }}>🌊</div>
            </div>
          </div>
          
          {/* Crash text */}
          <div className="relative z-10 text-center">
            <div className="text-6xl font-bold text-white drop-shadow-2xl animate-bounce">
              🌊 WAVE CRASH! 🌊
            </div>
            <div className="text-2xl text-white drop-shadow-lg animate-pulse mt-2">
              Board Reshuffled!
            </div>
          </div>

          {/* Ripple effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-blue-300 rounded-full animate-ping opacity-75"></div>
            <div className="absolute w-48 h-48 border-4 border-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute w-64 h-64 border-4 border-blue-500 rounded-full animate-ping opacity-25" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </>
      )}
    </div>
  );
}; 