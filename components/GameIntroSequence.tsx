import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface GameIntroSequenceProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const GameIntroSequence: React.FC<GameIntroSequenceProps> = ({
  isVisible,
  onComplete
}) => {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'sponsor'>('sponsor');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedAudio = useRef(false);
  const didComplete = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  const safeComplete = () => {
    if (!didComplete.current) {
      didComplete.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    if (!isVisible) {
      setPhase('sponsor');
      hasPlayedAudio.current = false;
      didComplete.current = false;
      setHasStarted(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      return;
    }
    if (!hasStarted) return;
    // Play audio as soon as sponsor phase starts
    if (!hasPlayedAudio.current) {
      audioRef.current = new Audio('/WSBH ACA SHOT GUNS_15_WSBH_Cut12a_Aca.wav');
      audioRef.current.volume = 0.6;
      console.log('Attempting to play intro audio...');
      audioRef.current.play().then(() => {
        console.log('Intro audio started playing.');
      }).catch((err) => {
        console.error('Intro audio failed to play:', err);
      });
      hasPlayedAudio.current = true;
      audioRef.current.onended = () => {
        safeComplete();
      };
      // Fallback: always advance after audio duration or 5.5 seconds
      const fallbackMs = audioRef.current.duration && !isNaN(audioRef.current.duration) ? audioRef.current.duration * 1000 : 5500;
      setTimeout(() => {
        safeComplete();
      }, fallbackMs);
    }
  }, [isVisible, onComplete, hasStarted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isVisible) return null;

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-800 via-cyan-700 to-yellow-200 flex flex-col items-center justify-center z-50">
        <img src="/beach-logo.png" alt="98.5 The Beach Logo" className="w-40 h-auto mb-8 drop-shadow-xl object-contain" onError={(e) => { e.currentTarget.src = '/beach.png'; }} />
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-2xl px-10 py-5 rounded-2xl shadow-2xl border-4 border-white/40 transition-all animate-bounce"
          onClick={() => setHasStarted(true)}
        >
          🏖️ Tap to Start 🏖️
        </button>
      </div>
    );
  }

  // Sponsor/Intro phase only
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-900">
      <div className="text-center space-y-8 animate-fade-in">
        <img src="/beach-logo.png" alt="98.5 The Beach Logo" className="w-32 h-auto mx-auto mb-2 drop-shadow-xl object-contain" onError={(e) => { e.currentTarget.src = '/beach.png'; }} />
        <div className="text-6xl mb-2">🎧</div>
        <div className="text-white text-3xl font-bold mb-2">Powered by</div>
        <div className="mb-4 flex justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-4 inline-block">
            <Image 
              src="/marc-digital-solutions-logo-blk.png" 
              alt="Marc Digital Solutions" 
              width={220} 
              height={80}
              className="mx-auto"
            />
          </div>
        </div>
        <div className="text-cyan-300 text-xl font-medium">
          🌴 The Space Coast's #1 Hit Music Station 🌴
        </div>
      </div>
    </div>
  );
} 