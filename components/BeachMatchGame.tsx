import React, { useEffect, useState } from 'react';
import { GamePiece } from '@/lib/types';
import { SwipeIndicator } from './SwipeIndicator';

interface BeachMatchGameProps {
  grid: (GamePiece | null)[][];
  selectedPiece: { row: number; col: number } | null;
  onPieceClick: (row: number, col: number) => void;
  onSwipe: (fromRow: number, fromCol: number, direction: 'up' | 'down' | 'left' | 'right') => void;
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
  clearingPieceIds?: string[];
}

const BeachMatchGame: React.FC<BeachMatchGameProps> = ({
  grid,
  selectedPiece,
  onPieceClick,
  onSwipe,
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
  swappingPieces = [],
  clearingPieceIds = []
}) => {
  // Enhanced swipe detection state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [currentTouch, setCurrentTouch] = useState<{ x: number; y: number } | null>(null);
  const [swipeStartPiece, setSwipeStartPiece] = useState<{ row: number; col: number } | null>(null);
  const [swipePreview, setSwipePreview] = useState<{
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    direction: 'up' | 'down' | 'left' | 'right';
  } | null>(null);
  const [swipeIndicators, setSwipeIndicators] = useState<Array<{
    id: string;
    direction: 'up' | 'down' | 'left' | 'right';
    x: number;
    y: number;
  }>>([]);
  const [hasTriggeredSwipe, setHasTriggeredSwipe] = useState(false);

  // Optimized swipe sensitivity
  const minSwipeDistance = 30; // Reduced for more responsive detection
  const swipeThreshold = 25; // Distance before showing preview
  const maxSwipeTime = 800; // Maximum time for a swipe gesture (ms)
  // Enhanced continuous swipe detection functions
  const onTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const startTime = Date.now();
    
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: startTime });
    setCurrentTouch({ x: touch.clientX, y: touch.clientY });
    setSwipeStartPiece({ row, col });
    setSwipePreview(null);
    setHasTriggeredSwipe(false);
    
    // Clear any existing swipe indicators
    setSwipeIndicators([]);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !swipeStartPiece || hasTriggeredSwipe) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    setCurrentTouch({ x: currentX, y: currentY });
    
    // Calculate swipe distance and direction
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check if we've moved enough to show preview
    if (distance >= swipeThreshold) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      let direction: 'up' | 'down' | 'left' | 'right';
      let targetRow = swipeStartPiece.row;
      let targetCol = swipeStartPiece.col;
      
      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
        targetCol = direction === 'right' 
          ? Math.min(7, swipeStartPiece.col + 1)
          : Math.max(0, swipeStartPiece.col - 1);
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
        targetRow = direction === 'down' 
          ? Math.min(7, swipeStartPiece.row + 1)
          : Math.max(0, swipeStartPiece.row - 1);
      }
      
      // Update preview state
      setSwipePreview({
        fromRow: swipeStartPiece.row,
        fromCol: swipeStartPiece.col,
        toRow: targetRow,
        toCol: targetCol,
        direction
      });
      
      // Trigger swipe if we've moved far enough
      if (distance >= minSwipeDistance && !hasTriggeredSwipe) {
        setHasTriggeredSwipe(true);
        
        // Add visual feedback
        const indicatorId = `swipe-${Date.now()}-${Math.random()}`;
        setSwipeIndicators(prev => [...prev, {
          id: indicatorId,
          direction,
          x: touchStart.x,
          y: touchStart.y
        }]);
        
        // Trigger the swipe action immediately
        onSwipe(swipeStartPiece.row, swipeStartPiece.col, direction);
      }
    }
  };

  const onTouchEnd = () => {
    // Clean up all touch state
    setTouchStart(null);
    setCurrentTouch(null);
    setSwipeStartPiece(null);
    setSwipePreview(null);
    setHasTriggeredSwipe(false);
  };

  const removeSwipeIndicator = (id: string) => {
    setSwipeIndicators(prev => prev.filter(indicator => indicator.id !== id));
  };

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

  const isPieceInSwipePreview = (row: number, col: number): boolean => {
    if (!swipePreview) return false;
    return (swipePreview.fromRow === row && swipePreview.fromCol === col) ||
           (swipePreview.toRow === row && swipePreview.toCol === col);
  };

  const getSwipePreviewRole = (row: number, col: number): 'source' | 'target' | null => {
    if (!swipePreview) return null;
    if (swipePreview.fromRow === row && swipePreview.fromCol === col) return 'source';
    if (swipePreview.toRow === row && swipePreview.toCol === col) return 'target';
    return null;
  };

  // Remove local clearingPieceIds state and related logic
  // Helper to determine if a piece is being cleared
  const isClearing = (piece: GamePiece | null) => piece && clearingPieceIds.includes(piece.id);

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
            <div className="text-white font-bold text-xl drop-shadow-2xl mb-2 tracking-wide">
              BEACH MATCH
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
      {/* Swipe Indicators */}
      {swipeIndicators.map((indicator) => (
        <SwipeIndicator
          key={indicator.id}
          direction={indicator.direction}
          x={indicator.x}
          y={indicator.y}
          onComplete={() => removeSwipeIndicator(indicator.id)}
        />
      ))}
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
        <div className="bg-gradient-to-b from-blue-500 via-orange-400 to-red-500 p-2 sm:p-4 md:p-6 rounded-xl shadow-2xl border-4 border-white/20">
          {/* Frosted Glass Game Board */}
          <div className={`bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-md rounded-xl p-2 sm:p-3 md:p-4 border border-white/30 transition-all duration-500 ${isShuffling ? 'animate-shake' : ''}`} style={{position:'relative'}}>
            <div className="relative grid grid-cols-8 gap-0.5 sm:gap-1">
              {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isSwapping = swappingPieces.some(p => p.row === rowIndex && p.col === colIndex);
                  const isHinted = isPieceHinted(rowIndex, colIndex);
                  const isInSwipePreview = isPieceInSwipePreview(rowIndex, colIndex);
                  const swipePreviewRole = getSwipePreviewRole(rowIndex, colIndex);
                  // Add animation class if piece is being cleared
                  const animClass = isClearing(piece) ? 'animate-piece-clear' : '';
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center
                        text-2xl sm:text-3xl md:text-5xl transition-all duration-200 transform
                        border-2 shadow-lg font-bold relative touch-manipulation
                        ${piece ? 'hover:scale-105 active:scale-95' : ''}
                        ${isPieceSelected(rowIndex, colIndex) 
                          ? 'bg-yellow-300 border-yellow-500 ring-4 ring-yellow-400/50 scale-110' 
                          : piece 
                            ? 'bg-white/90 border-white/50 hover:bg-white hover:border-white shadow-md' 
                            : 'bg-transparent border-transparent'
                        }
                        ${isHinted ? 'ring-4 ring-yellow-300 animate-hint-glow' : ''}
                        ${isInSwipePreview && swipePreviewRole === 'source' ? 'ring-4 ring-blue-400 bg-blue-200/80 animate-swipe-preview-source' : ''}
                        ${isInSwipePreview && swipePreviewRole === 'target' ? 'ring-4 ring-green-400 bg-green-200/80 animate-swipe-preview-target' : ''}
                        ${isProcessing ? 'pointer-events-none opacity-70' : ''}
                        ${isSwapping ? 'piece-swap animate-bounce' : ''}
                        ${animClass}
                      `}
                      onTouchStart={(e) => onTouchStart(e, rowIndex, colIndex)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      onClick={() => {
                        // Fallback for desktop/mouse users - only if no touch interaction
                        if (!touchStart && !hasTriggeredSwipe) {
                          onPieceClick(rowIndex, colIndex);
                        }
                      }}
                      disabled={!piece || isProcessing}
                    >
                      {piece && (
                        <span className="drop-shadow-sm">
                          {getPieceIcon(piece.type)}
                        </span>
                      )}
                      {/* Hint star overlay - no scaling, just a flashing star */}
                      {isHinted && hintState?.isVisible && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <span className="text-yellow-300 text-lg sm:text-xl md:text-2xl animate-hint-star-glow animate-pulse drop-shadow-md">⭐️</span>
                        </span>
                      )}
                      
                      {/* Swipe direction arrow overlay */}
                      {isInSwipePreview && swipePreviewRole === 'source' && swipePreview && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <span className="text-blue-600 text-lg sm:text-xl md:text-2xl animate-swipe-direction drop-shadow-lg font-bold">
                            {swipePreview.direction === 'up' && '⬆️'}
                            {swipePreview.direction === 'down' && '⬇️'}
                            {swipePreview.direction === 'left' && '⬅️'}
                            {swipePreview.direction === 'right' && '➡️'}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {/* Game Score Card - Now positioned below the game board */}
          <div className="mt-4 sm:mt-6 text-center relative">
            <div className="text-white font-bold text-lg sm:text-xl drop-shadow-2xl mb-2 tracking-wide">
              BEACH MATCH
            </div>
            <div className="flex justify-between items-center bg-black/20 rounded-lg p-2 sm:p-4 border border-white/30 backdrop-blur-sm">
              {/* Score */}
              <div className="text-center">
                <div className="text-yellow-300 text-sm sm:text-lg font-bold drop-shadow-lg">
                  {score.toLocaleString()}
                </div>
                <div className="text-white/80 text-xs uppercase tracking-wider">Score</div>
              </div>
              {/* Lives */}
              <div className="text-center">
                <div className="text-red-400 text-sm sm:text-lg font-bold drop-shadow-lg">
                  {'❤️'.repeat(Math.max(0, lives))}
                  {lives === 0 && '💀'}
                </div>
                <div className="text-white/80 text-xs uppercase tracking-wider">Lives</div>
                <div className="text-yellow-300/60 text-[8px] sm:text-[10px] mt-1">
                  🕐 Stream = Keep
                </div>
              </div>
              {/* Combo */}
              <div className="text-center">
                <div className="text-purple-300 text-sm sm:text-lg font-bold drop-shadow-lg">
                  {combo > 0 ? `${combo}x` : '-'}
                </div>
                <div className="text-white/80 text-xs uppercase tracking-wider">Combo</div>
              </div>
              {/* Stream Time or Game Over Countdown */}
              <div className="text-center">
                {typeof gameOverCountdown === 'number' && gameOverCountdown > 0 ? (
                  <>
                    <div className="text-white text-lg sm:text-2xl font-extrabold drop-shadow-lg animate-bounce">
                      {Math.floor(gameOverCountdown / 60)}:{(gameOverCountdown % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-white text-xs uppercase tracking-wider font-bold animate-pulse">TIME LEFT</div>
                  </>
                ) : (
                  <div className="text-white/60 text-xs">
                    Countdown: {gameOverCountdown === null ? 'null' : gameOverCountdown}
                  </div>
                )}
              </div>
            </div>
            {/* Enhanced Hint Indicator */}
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <div className="text-white text-sm sm:text-lg font-bold animate-pulse">
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