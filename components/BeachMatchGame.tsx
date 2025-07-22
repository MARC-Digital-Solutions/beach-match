import React, { useEffect } from 'react';
import { GamePiece } from '@/lib/types';

interface BeachMatchGameProps {
  grid: (GamePiece | null)[][];
  selectedPiece: { row: number; col: number } | null;
  onPieceClick: (row: number, col: number) => void;
  isProcessing: boolean;
  score: number;
  lives: number;
  combo: number;
  streamTime: number;
  hintState?: {
    isVisible: boolean;
    piece1: { row: number; col: number } | null;
    piece2: { row: number; col: number } | null;
  };
  isShuffling?: boolean;
  gameOverCountdown?: number | null; // <-- add prop
  boardFlash?: boolean;
  matchedRows?: number[];
  matchedCols?: number[];
  swappingPieces?: { row: number; col: number }[];
}

const BeachMatchGame: React.FC<BeachMatchGameProps> = ({
  grid,
  selectedPiece,
  onPieceClick,
  isProcessing,
  score,
  lives,
  combo,
  streamTime,
  hintState,
  isShuffling,
  gameOverCountdown,
  boardFlash,
  matchedRows = [],
  matchedCols = [],
  swappingPieces = []
}) => {
  // Remove this useEffect to prevent screen jerking
  // useEffect(() => {
  //   window.scrollTo(0, 0);
  // }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPieceIcon = (type: string) => {
    const icons = {
      beach_ball: '⛱️',
      microphone: '🎤',
      rocket: '🚀',
      palm_tree: '🌴',
      boat: '🚤',
      wave: '🌊'
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const isPieceSelected = (row: number, col: number): boolean => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  };

  const isPieceHinted = (row: number, col: number): boolean => {
    if (!hintState?.isVisible) return false;
    return (hintState.piece1?.row === row && hintState.piece1?.col === col) ||
           (hintState.piece2?.row === row && hintState.piece2?.col === col);
  };

  if (!grid || grid.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-blue-500 via-orange-400 to-red-500 p-6 rounded-xl shadow-2xl border-4 border-white/20">
          <div className="bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-md rounded-xl p-4 border border-white/30">
            <div className="relative grid grid-cols-8 gap-1">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="w-16 h-16 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse opacity-30"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center relative">
            <div className="text-white font-bold text-2xl drop-shadow-2xl mb-2 tracking-wide">
              🏖️ BEACH MATCH 🏖️
            </div>
            <div className="text-white/90 text-base drop-shadow-lg font-medium animate-pulse">
              Loading beach game...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main return for the game UI
  return (
    <div className="w-full max-w-2xl mx-auto relative overflow-visible">
      <div style={{position:'relative'}}>
        {/* Swipe Row Overlays */}
        {matchedRows.map(rowIdx => (
          <div key={`swipe-row-${rowIdx}`} className="absolute left-0 right-0" style={{top: `${rowIdx * 4.5}rem`, height: '4.5rem', zIndex: 20}}>
            <div className="swipe-effect-row w-full h-full rounded-xl" />
          </div>
        ))}
        {/* Swipe Col Overlays */}
        {matchedCols.map(colIdx => (
          <div key={`swipe-col-${colIdx}`} className="absolute top-0 bottom-0" style={{left: `${colIdx * 4.5}rem`, width: '4.5rem', zIndex: 20}}>
            <div className="swipe-effect-col w-full h-full rounded-xl" />
          </div>
        ))}
        {/* Beautiful Beach-Themed Game Container */}
        <div className="bg-gradient-to-b from-blue-500 via-orange-400 to-red-500 p-6 rounded-xl shadow-2xl border-4 border-white/20">
          {/* Frosted Glass Game Board */}
          <div className={`bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-md rounded-xl p-4 border border-white/30 transition-all duration-500 ${isShuffling ? 'animate-shake' : ''}`} style={{position:'relative'}}>
            <div className="relative grid grid-cols-8 gap-1">
              {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isSwapping = swappingPieces.some(p => p.row === rowIndex && p.col === colIndex);
                  const isHinted = isPieceHinted(rowIndex, colIndex);
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-16 h-16 rounded-lg flex items-center justify-center
                        text-5xl transition-all duration-200 transform
                        border-2 shadow-lg font-bold relative
                        ${piece ? 'hover:scale-105 active:scale-95' : ''}
                        ${isPieceSelected(rowIndex, colIndex) 
                          ? 'bg-yellow-300 border-yellow-500 ring-4 ring-yellow-400/50 scale-110' 
                          : piece 
                            ? 'bg-white/90 border-white/50 hover:bg-white hover:border-white shadow-md' 
                            : 'bg-transparent border-transparent'
                        }
                        ${isHinted ? 'ring-4 ring-yellow-300 animate-hint-glow' : ''}
                        ${isProcessing ? 'pointer-events-none opacity-70' : ''}
                        ${isSwapping ? 'piece-swap animate-bounce' : ''}
                      `}
                      onClick={() => onPieceClick(rowIndex, colIndex)}
                      disabled={!piece || isProcessing}
                    >
                      {piece && (
                        <span className="drop-shadow-sm">
                          {getPieceIcon(piece.type)}
                        </span>
                      )}
                      {/* Hint star overlay - no scaling, just a flashing star */}
                      {isHinted && hintState?.isVisible && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                          <span className="text-yellow-300 text-2xl animate-hint-star-glow animate-pulse drop-shadow-md">⭐️</span>
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {/* Game Score Card - Now positioned below the game board */}
          <div className="mt-6 text-center relative">
            <div className="text-white font-bold text-2xl drop-shadow-2xl mb-2 tracking-wide">
              🏖️ BEACH MATCH 🏖️
            </div>
            <div className="flex justify-between items-center bg-black/20 rounded-lg p-4 border border-white/30 backdrop-blur-sm">
              {/* Score */}
              <div className="text-center">
                <div className="text-yellow-300 text-lg font-bold drop-shadow-lg">
                  {score.toLocaleString()}
                </div>
                <div className="text-white/80 text-xs uppercase tracking-wider">Score</div>
              </div>
              {/* Lives */}
              <div className="text-center">
                <div className="text-red-400 text-lg font-bold drop-shadow-lg">
                  {'❤️'.repeat(Math.max(0, lives))}
                  {lives === 0 && '💀'}
                </div>
                <div className="text-white/80 text-xs uppercase tracking-wider">Lives</div>
                <div className="text-yellow-300/60 text-[10px] mt-1">
                  🕐 Stream = Keep
                </div>
              </div>
              {/* Combo */}
              <div className="text-center">
                <div className="text-purple-300 text-lg font-bold drop-shadow-lg">
                  {combo > 0 ? `${combo}x` : '-'}
                </div>
                <div className="text-white/80 text-xs uppercase tracking-wider">Combo</div>
              </div>
              {/* Stream Time or Game Over Countdown */}
              <div className="text-center">
                {gameOverCountdown && gameOverCountdown > 0 ? (
                  <>
                    <div className="text-white text-2xl font-extrabold drop-shadow-lg animate-bounce">{gameOverCountdown}</div>
                    <div className="text-white text-xs uppercase tracking-wider font-bold animate-pulse">TIME LEFT</div>
                  </>
                ) : null}
              </div>
            </div>
            {/* Enhanced Hint Indicator */}
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <div className="text-white text-lg font-bold animate-pulse">
                  🌊 Processing matches...
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Board Edge Flash Overlay - only on entry */}
        {boardFlash && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="w-full h-full rounded-xl border-[12px] border-yellow-400 animate-board-flash" style={{boxShadow: '0 0 0 8px #ffe066, 0 0 32px 16px #fffbe6', outline: '4px solid #fffbe6', outlineOffset: '-8px', background: 'none'}} />
          </div>
        )}
      </div>
      {/* Game Over Countdown Bar Below Board - REMOVED, only show in HUD */}
    </div>
  );
};

export default BeachMatchGame; 