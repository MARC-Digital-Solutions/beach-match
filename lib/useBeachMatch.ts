import { useState, useEffect, useCallback, useRef } from 'react';
import { BeachMatchState, QuizQuestion, GamePiece } from './types';
import { BeachMatchEngine } from './gameEngine';
import { AudioManager } from './audioManager';
import { EngagementTracker } from './engagementTracker';
import { PowerUpSystem } from './powerUpSystem';
import { EventManager } from './eventManager';

if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] useBeachMatch.ts file loaded');
}

export function useBeachMatch(gameStarted: boolean = false) {
  const [gameState, setGameState] = useState<BeachMatchState>({
    score: 0,
    lives: 3,
    grid: [], // Start with empty grid to avoid hydration mismatch
    selectedPiece: null,
    streamTime: 0,
    currentStreamStart: null,
    matches: [],
    powerUps: [],
    level: 1,
    combo: 0,
    isGameOver: false,
    isPaused: false,
    lastLifeGained: 0,
    lastScoreBonus: 0,
    songStreak: 0,
    totalMatches: 0,
    hintState: {
      isVisible: false,
      piece1: null,
      piece2: null,
      lastHintTime: 0
    },
    lastMatchedPiece: null,
    noActivityStart: null
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSongQuiz, setShowSongQuiz] = useState(false);
  const [currentSongQuestion, setCurrentSongQuestion] = useState<QuizQuestion | null>(null);
  const [songQuizTimer, setSongQuizTimer] = useState(30);
  const [showWaveCrash, setShowWaveCrash] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lifeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [gameOverCountdown, setGameOverCountdown] = useState<number | null>(null);
  const [boardFlash, setBoardFlash] = useState(false);
  const [matchedRows, setMatchedRows] = useState<number[]>([]);
  const [matchedCols, setMatchedCols] = useState<number[]>([]);
  const [swappingPieces, setSwappingPieces] = useState<{row:number,col:number}[]>([]);
  // Board flash: Only trigger once on entry
  const [boardHasFlashed, setBoardHasFlashed] = useState(false);
  // Track if the user has made their first move
  const [hasMadeFirstMove, setHasMadeFirstMove] = useState(false);

  const gameStateRef = useRef(gameState);
  const hasMadeFirstMoveRef = useRef(hasMadeFirstMove);
  const gameOverCountdownRef = useRef(gameOverCountdown);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { hasMadeFirstMoveRef.current = hasMadeFirstMove; }, [hasMadeFirstMove]);
  useEffect(() => { gameOverCountdownRef.current = gameOverCountdown; }, [gameOverCountdown]);

  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG] useBeachMatch hook loaded');
  }
  // Initialize game systems and create initial grid on client only
  useEffect(() => {
    // Initialize the grid only on the client to avoid hydration mismatch
    setGameState(prevState => ({
      ...prevState,
      grid: BeachMatchEngine.createInitialGrid(),
      noActivityStart: Date.now() // Start tracking inactivity immediately
    }));

    EngagementTracker.loadEngagementData();
    EventManager.initializeEvents();
    
    // Hint system is now completely separate from swap logic
    
    return () => {
      EventManager.cleanup();
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
      if (lifeTimerRef.current) {
        clearInterval(lifeTimerRef.current);
      }
    };
  }, []);

  // Initialize countdown timer when game starts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] useEffect (init countdown):', { gameStarted, gridLength: gameState.grid.length, gameOverCountdown });
      if (!gameStarted) console.log('[DEBUG] gameStarted is false');
      if (gameState.grid.length === 0) console.log('[DEBUG] grid is empty');
      if (gameOverCountdown !== null) console.log('[DEBUG] gameOverCountdown is not null:', gameOverCountdown);
    }
    if (gameStarted && gameState.grid.length > 0 && gameOverCountdown === null) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Setting gameOverCountdown to 60');
      }
      setGameOverCountdown(60);
    }
  }, [gameStarted, gameState.grid.length, gameOverCountdown]);

  // Reset lastHintTime on game start and after any user action
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      hintState: {
        ...prev.hintState,
        lastHintTime: 0
      }
    }));
  }, [gameState.noActivityStart]);

  // Only reset hasMadeFirstMove when the board is re-initialized (when grid is empty)
  useEffect(() => {
    if (gameState.grid.length === 0) {
      setHasMadeFirstMove(false);
    }
  }, [gameState.grid]);

  // Board flash: Only trigger on initial game load and on reset
  // REMOVE this effect:
  // useEffect(() => {
  //   setBoardFlash(true);
  //   const timer = setTimeout(() => {
  //     setBoardFlash(false);
  //   }, 1200); // 1.2s entry flash
  //   return () => clearTimeout(timer);
  // }, []);

  // Hint system timer - COMPLETELY SEPARATE from swap logic
  useEffect(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
    console.log('[HintTimer] Effect run. hasMadeFirstMove:', hasMadeFirstMoveRef.current, 'boardFlash:', boardFlash, 'isGameOver:', gameStateRef.current.isGameOver, 'isPaused:', gameStateRef.current.isPaused, 'isProcessing:', isProcessing);
    // Only show hints after the first move AND after the entry board flash is done AND when not processing
    if (!hasMadeFirstMoveRef.current || boardFlash || isProcessing) {
      console.log('[HintTimer] Skipping: hasMadeFirstMove:', !hasMadeFirstMoveRef.current, 'boardFlash:', boardFlash, 'isProcessing:', isProcessing);
      return;
    }
    if (!gameStateRef.current.isGameOver && !gameStateRef.current.isPaused && gameStateRef.current.noActivityStart) {
      const delay = 3000; // 3 seconds for hints (increased from 2)
      const showHint = () => {
        // Double-check that hints should still be shown
        if (gameStateRef.current.isGameOver || gameStateRef.current.isPaused || !hasMadeFirstMoveRef.current || boardFlash || isProcessing) {
          console.log('[HintTimer] Cancelling hint - game state changed');
          return;
        }
        
        // Check if there are valid moves before showing hint
        if (!BeachMatchEngine.hasValidMoves(gameStateRef.current.grid)) {
          console.log('[HintTimer] No valid moves - triggering shuffle instead of hint');
          // Trigger shuffle instead of showing hint
          setIsShuffling(true);
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              grid: BeachMatchEngine.shuffleGrid(prev.grid),
              noActivityStart: Date.now(),
              hintState: {
                ...prev.hintState,
                isVisible: false
              }
            }));
            setIsShuffling(false);
          }, 800);
          return;
        }
        
        const possibleMatch = BeachMatchEngine.findPossibleMatch(gameStateRef.current.grid);
        console.log('[HintTimer] showHint called. possibleMatch:', possibleMatch);
        if (possibleMatch) {
          console.log('Hint shown');
          setGameState(prev => ({
            ...prev,
            hintState: {
              isVisible: true,
              piece1: possibleMatch.piece1,
              piece2: possibleMatch.piece2,
              lastHintTime: Date.now()
            }
          }));
          setTimeout(() => {
            console.log('Hint hidden');
            setGameState(prev => ({
              ...prev,
              hintState: {
                ...prev.hintState,
                isVisible: false
              }
            }));
            // Schedule next hint if still inactive and not processing
            if (!gameStateRef.current.isGameOver && !gameStateRef.current.isPaused && hasMadeFirstMoveRef.current && !boardFlash && !isProcessing) {
              hintTimerRef.current = setTimeout(showHint, delay);
            }
          }, 1500); // Increased hint display time to 1.5 seconds
        } else {
          console.log('[HintTimer] No possible match found for hint.');
        }
      };
      console.log('[HintTimer] Setting initial timer for', delay, 'ms');
      hintTimerRef.current = setTimeout(showHint, delay);
    }
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, [gameState.noActivityStart, gameState.isGameOver, gameState.isPaused, hasMadeFirstMove, boardFlash, isProcessing, setIsShuffling, setGameState]);

  // Start game loop for engagement tracking
  useEffect(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    gameLoopRef.current = setInterval(() => {
      setGameState(prevState => {
        const newState = EngagementTracker.updateStreamTime(prevState);
        
        // Check for valid moves every few seconds and shuffle if needed
        if (hasMadeFirstMove && !isProcessing && !newState.isGameOver && !newState.isPaused) {
          if (!BeachMatchEngine.hasValidMoves(newState.grid)) {
            console.log('[GameLoop] No valid moves detected - triggering shuffle');
            setIsShuffling(true);
            setTimeout(() => {
              setGameState(prev => ({
                ...prev,
                grid: BeachMatchEngine.shuffleGrid(prev.grid),
                noActivityStart: Date.now(),
                hintState: {
                  ...prev.hintState,
                  isVisible: false
                }
              }));
              setIsShuffling(false);
            }, 800);
          }
        }
        
        return newState;
      });
    }, 1000);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [hasMadeFirstMove, isProcessing, setIsShuffling, setGameState]);

  // Life timer - reduces lives every 5 minutes of active gameplay
  useEffect(() => {
    if (lifeTimerRef.current) {
      clearInterval(lifeTimerRef.current);
    }

    if (!gameState.isGameOver && !gameState.isPaused) {
      lifeTimerRef.current = setInterval(() => {
        setGameState(prevState => {
          if (prevState.isGameOver || prevState.isPaused) return prevState;
          const isActivelyStreaming = AudioManager.isStreaming();
          if (!isActivelyStreaming && prevState.lives > 0) {
            const newLives = prevState.lives - 1;
            if (newLives <= 0) {
              // Start countdown instead of immediate game over
              setGameOverCountdown(60);
              // Don&apos;t set isGameOver yet
              return {
                ...prevState,
                lives: 0
              };
            }
            return {
              ...prevState,
              lives: newLives
            };
          }
          return prevState;
        });
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (lifeTimerRef.current) {
        clearInterval(lifeTimerRef.current);
      }
    };
  }, [gameState.isGameOver, gameState.isPaused]);

  // Always-on countdown timer for lives
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] useEffect (countdown tick):', { gameStarted, isGameOver: gameState.isGameOver, isPaused: gameState.isPaused, gameOverCountdown });
    }
    // Only run countdown when game is active (not over, not paused, and gameStarted)
    if (!gameStarted || gameState.isGameOver || gameState.isPaused) {
      return;
    }
    // Don't start timer if countdown is not running or at 0
    if (gameOverCountdown === null || gameOverCountdown <= 0) {
      return;
    }
    // Start the countdown timer using interval
    const interval = setInterval(() => {
      const currentCountdown = gameOverCountdownRef.current;
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Countdown tick:', currentCountdown);
      }
      if (currentCountdown === null || currentCountdown <= 0) {
        clearInterval(interval);
        return;
      }
      setGameOverCountdown(currentCountdown - 1);
    }, 1000);
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Cleaning up interval');
      }
      clearInterval(interval);
    };
  }, [gameStarted, gameState.isGameOver, gameState.isPaused, gameOverCountdown]);

  // Handle countdown reaching zero
  useEffect(() => {
    if (gameOverCountdown === 0) {
      console.log('[CountdownTimer] Countdown reached 0 - removing life');
      // Remove a life and reset countdown
      setGameState(prev => {
        const newLives = Math.max(0, prev.lives - 1);
        console.log('[CountdownTimer] Lives reduced from', prev.lives, 'to', newLives);
        return {
          ...prev,
          lives: newLives,
          isGameOver: newLives === 0
        };
      });
      setGameOverCountdown(60);
      setBoardHasFlashed(false); // trigger board flash
    }
  }, [gameOverCountdown]);

  // When player earns a life, reset countdown to 60 and flash board
  useEffect(() => {
    if (gameState.lives > 0 && gameOverCountdown !== 60) {
      setGameOverCountdown(60);
      setBoardHasFlashed(false);
      // Don't clear board flash here - let the welcome flash complete
    }
  }, [gameState.lives, gameOverCountdown]);

  // --- Move these up so they are declared before use ---
  const triggerPieceSpecificQuiz = useCallback(async (pieceType: string) => {
    const quizType = BeachMatchEngine.determineQuizType(pieceType as any);
    if (!quizType) return;

    let question: QuizQuestion | null = null;
    if (quizType === 'song') {
      question = await AudioManager.getRandomSongQuestion();
    } else {
      question = await AudioManager.getQuestionByType(quizType);
    }
    setCurrentSongQuestion(question);
    setShowSongQuiz(true);
    setSongQuizTimer(30);

    console.log(`🎯 ${quizType} quiz triggered for ${pieceType}!`);

    // Start countdown timer
    const timer = setInterval(() => {
      setSongQuizTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up - close modal with no penalty
          setShowSongQuiz(false);
          setCurrentSongQuestion(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [setCurrentSongQuestion, setShowSongQuiz, setSongQuizTimer]);

  const triggerWaveCrash = useCallback(() => {
    console.log('🌊 Triggering wave crash!');
    setShowWaveCrash(true);
  }, [setShowWaveCrash]);

  const processMatches = useCallback(async (grid: (GamePiece | null)[][]) => {
    console.log('[processMatches] Starting match processing');
    let currentGrid = [...grid.map(row => [...row])];
    let totalScore = 0;
    let comboCount = 0;
    let hasMatches = true;
    let matchedPieceTypes: Set<string> = new Set();

    console.log('[processMatches] Processing matches...');

    while (hasMatches) {
      const matches = BeachMatchEngine.findMatches(currentGrid);
      
      if (matches.length === 0) {
        hasMatches = false;
        break;
      }

      // Trigger board flash for any 4- or 5-piece match
      const hasBigMatch = matches.some(match => match.pieces.length === 4 || match.pieces.length === 5);
      if (hasBigMatch) {
        // Don't trigger board flash during initial welcome flash
        if (!boardFlash) {
          setBoardFlash(true);
          setTimeout(() => setBoardFlash(false), 1000); // 1s flash
        }
      }

      console.log(`Found ${matches.length} matches`);
      comboCount++;
      // AudioManager.playMatchSound(); // No sound

      // Track matched piece types for trivia triggering
      matches.forEach(match => {
        match.pieces.forEach(piece => {
          matchedPieceTypes.add(piece.type);
        });
      });

      // Calculate score with multipliers
      const matchScore = matches.reduce((sum, match) => sum + match.score, 0);
      const eventMultiplier = EventManager.getScoreMultiplier();
      const comboMultiplier = 1 + (comboCount - 1) * 0.1;
      
      const finalScore = Math.floor(matchScore * eventMultiplier * comboMultiplier);
      totalScore += finalScore;

      // Remove matched pieces
      currentGrid = BeachMatchEngine.removeMatches(currentGrid, matches);
      
      // Apply gravity
      currentGrid = BeachMatchEngine.applyGravity(currentGrid);

      // Wait for animation - much faster gameplay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[processMatches] Processing complete: ${totalScore} points, ${comboCount} combos`);

    // Update game state with match information
    setGameState(prev => {
      const newState = {
        ...prev,
        grid: currentGrid,
        score: prev.score + totalScore,
        combo: comboCount,
        totalMatches: prev.totalMatches + comboCount,
        noActivityStart: Date.now() // Reset activity timer
      };

      // Check for piece-specific trivia triggers
      const mostCommonPiece = [...matchedPieceTypes][0]; // Get first matched piece type
      if (mostCommonPiece && BeachMatchEngine.shouldTriggerQuiz(mostCommonPiece as any, newState.totalMatches)) {
        triggerPieceSpecificQuiz(mostCommonPiece as any);
      }

      // Check for wave crash event
      if (BeachMatchEngine.shouldTriggerWaveCrash(newState.totalMatches)) {
        setTimeout(() => triggerWaveCrash(), 1000);
      }

      // Check for game over or level completion
      if (!BeachMatchEngine.hasValidMoves(currentGrid)) {
        // SHUFFLE the board instead of clearing or losing a life
        setIsShuffling(true);
        setTimeout(() => {
          setGameState(prev2 => ({
            ...prev2,
            grid: BeachMatchEngine.shuffleGrid(prev2.grid),
            noActivityStart: Date.now()
          }));
          setIsShuffling(false);
        }, 800);
        return {
          ...newState,
          // Optionally, show a message or animation
        };
      } else if (totalScore > 1000) {
        // Play completion clip for high scoring rounds
        // AudioManager.playGameCompleteClip().catch(console.error);
      }

      return newState;
    });

    setIsProcessing(false);
  }, [setGameState, setBoardFlash, setIsProcessing, setIsShuffling, triggerPieceSpecificQuiz, triggerWaveCrash, boardFlash]);

  const activatePowerUp = useCallback((powerUpType: any, row: number, col: number) => {
    setIsProcessing(true);
    
    setGameState(prevState => {
      const result = PowerUpSystem.activatePowerUp(powerUpType, row, col, prevState.grid, prevState);
      
      // Apply gravity and process any new matches
      setTimeout(() => {
        const gravityGrid = BeachMatchEngine.applyGravity(result.newGrid);
        processMatches(gravityGrid);
      }, 300);

      return {
        ...prevState,
        grid: result.newGrid,
        score: prevState.score + result.scoreBonus,
        noActivityStart: Date.now() // Reset activity timer
      };
    });
  }, [processMatches, setIsProcessing, setGameState]);

  const handleWaveCrashComplete = useCallback(() => {
    console.log('🌊 Wave crash complete, reshuffling board');
    setShowWaveCrash(false);
    
    setGameState(prev => ({
      ...prev,
      grid: BeachMatchEngine.createWaveCrashedGrid(prev.grid),
      selectedPiece: null,
      noActivityStart: Date.now()
    }));
  }, [setShowWaveCrash, setGameState]);

  const handleSongQuizAnswer = useCallback((selectedAnswer: number) => {
    if (!currentSongQuestion) return;

    const isCorrect = selectedAnswer === currentSongQuestion.correctAnswer;
    
    setGameState(prev => EngagementTracker.handleSongQuizComplete(prev, isCorrect));
    
    AudioManager.stopQuizClip();
    setShowSongQuiz(false);
    setCurrentSongQuestion(null);
    setSongQuizTimer(30);
  }, [currentSongQuestion, setGameState, setShowSongQuiz, setCurrentSongQuestion, setSongQuizTimer]);

  const handleSponsorClick = useCallback((type: 'ad' | 'video' | 'link') => {
    setGameState(prev => EngagementTracker.handleSponsorClick(prev, type));
  }, [setGameState]);

  const triggerBoardFlash = useCallback(() => {
    setBoardFlash(true);
    setTimeout(() => setBoardFlash(false), 8000); // 8 seconds for a longer welcome flash
  }, [setBoardFlash]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: 3,
      grid: BeachMatchEngine.createInitialGrid(),
      selectedPiece: null,
      matches: [],
      combo: 0,
      isGameOver: false,
      isPaused: false,
      totalMatches: 0,
      hintState: {
        isVisible: false,
        piece1: null,
        piece2: null,
        lastHintTime: 0
      },
      lastMatchedPiece: null,
      noActivityStart: Date.now()
    }));
    setShowSongQuiz(false);
    setCurrentSongQuestion(null);
    setSongQuizTimer(30);
    setIsProcessing(false);
    setHasMadeFirstMove(false);
    setGameOverCountdown(null); // <-- Ensure countdown is reset to null
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] resetGame called, gameOverCountdown set to null');
    }
    if (lifeTimerRef.current) {
      clearInterval(lifeTimerRef.current);
    }
  }, [setGameState, setShowSongQuiz, setCurrentSongQuestion, setSongQuizTimer, setIsProcessing, setHasMadeFirstMove]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  }, [setGameState]);

  const showLeaderboardModal = useCallback(() => {
    setShowLeaderboard(true);
  }, [setShowLeaderboard]);

  const hideLeaderboardModal = useCallback(() => {
    setShowLeaderboard(false);
  }, [setShowLeaderboard]);

  const handleLeaderboardNameSubmit = useCallback((name: string, score: number) => {
    console.log(`Player ${name} submitted score: ${score}`);
    // Could trigger additional celebration or social sharing here
  }, []);

  const activeEvents = EventManager.getActiveEvents();
  const dailyChallenge = EngagementTracker.getDailyChallenge();
  const engagementData = EngagementTracker.getEngagementData();

  // --- Now use them in handlePieceClick ---
  const handlePieceClick = useCallback((row: number, col: number) => {
    console.log('[handlePieceClick] called. isProcessing:', isProcessing, 'hasMadeFirstMove:', hasMadeFirstMove);
    
    // Don't allow clicks during processing or if game is over/paused
    if (isProcessing || gameState.isGameOver || gameState.isPaused) {
      console.log('[handlePieceClick] Blocked - processing:', isProcessing, 'gameOver:', gameState.isGameOver, 'paused:', gameState.isPaused);
      return;
    }

    // Set hasMadeFirstMove on first valid click
    if (!hasMadeFirstMove) {
      setHasMadeFirstMove(true);
      console.log('First move made!');
    }
    console.log('Piece clicked:', row, col);

    // Reset activity timer (for hints) - but don't let it affect swapping
    setGameState(prevState => ({
      ...prevState,
      noActivityStart: Date.now()
    }));

    // Handle piece selection and swapping
    if (swappingPieces.length === 0) {
      // First piece selected
      setSwappingPieces([{ row, col }]);
      setGameState(prevState => ({
        ...prevState,
        selectedPiece: { row, col }
      }));
    } else if (swappingPieces.length === 1) {
      const firstPiece = swappingPieces[0];
      
      // Check if clicking the same piece (deselect)
      if (firstPiece.row === row && firstPiece.col === col) {
        setSwappingPieces([]);
        setGameState(prevState => ({
          ...prevState,
          selectedPiece: null
        }));
        return;
      }
      
      // Check if adjacent
      const isAdjacent = (
        (Math.abs(firstPiece.row - row) === 1 && firstPiece.col === col) ||
        (Math.abs(firstPiece.col - col) === 1 && firstPiece.row === row)
      );
      
      if (isAdjacent) {
        // Attempt swap
        console.log('[handlePieceClick] Starting swap process');
        setIsProcessing(true);
        setSwappingPieces([firstPiece, { row, col }]);
        
        setGameState(prevState => {
          const newGrid = [...prevState.grid.map(row => [...row])];
          const temp = newGrid[firstPiece.row][firstPiece.col];
          newGrid[firstPiece.row][firstPiece.col] = newGrid[row][col];
          newGrid[row][col] = temp;
          
          return {
            ...prevState,
            grid: newGrid,
            selectedPiece: null
          };
        });
        
        // Check for matches after swap
        setTimeout(() => {
          console.log('[handlePieceClick] Checking matches after swap');
          setGameState(prevState => {
            const matches = BeachMatchEngine.findMatches(prevState.grid);
            console.log('[handlePieceClick] Matches found:', matches.length);
            
            if (matches.length > 0) {
              // Valid swap - process matches
              console.log('[handlePieceClick] Valid swap - processing matches');
              processMatches(prevState.grid);
            } else {
              // Invalid swap - revert
              console.log('[handlePieceClick] Invalid swap - reverting');
              const revertedGrid = [...prevState.grid.map(row => [...row])];
              const temp = revertedGrid[firstPiece.row][firstPiece.col];
              revertedGrid[firstPiece.row][firstPiece.col] = revertedGrid[row][col];
              revertedGrid[row][col] = temp;
              
              setGameState(prev => ({
                ...prev,
                grid: revertedGrid
              }));
              
              // Check for game over after invalid move
              if (!BeachMatchEngine.hasValidMoves(revertedGrid)) {
                console.log('[handlePieceClick] No valid moves after invalid swap - triggering shuffle');
                setIsShuffling(true);
                setTimeout(() => {
                  setGameState(prev => ({
                    ...prev,
                    grid: BeachMatchEngine.shuffleGrid(prev.grid),
                    noActivityStart: Date.now()
                  }));
                  setIsShuffling(false);
                }, 800);
              } else {
                setGameOverCountdown(60);
                // Don't trigger board flash for invalid moves during initial welcome flash
                if (!boardFlash) {
                  setBoardFlash(true);
                  setTimeout(() => setBoardFlash(false), 2000);
                }
              }
            }
            
            return {
              ...prevState,
              selectedPiece: null
            };
          });
          
          setSwappingPieces([]);
          setIsProcessing(false);
          console.log('[handlePieceClick] Swap process complete');
        }, 300);
      } else {
        // Not adjacent - select new piece
        setSwappingPieces([{ row, col }]);
        setGameState(prevState => ({
          ...prevState,
          selectedPiece: { row, col }
        }));
      }
    }
  }, [isProcessing, hasMadeFirstMove, boardFlash, gameState.isGameOver, gameState.isPaused, swappingPieces, setIsProcessing, setSwappingPieces, setGameState, setBoardFlash, setGameOverCountdown, setHasMadeFirstMove, processMatches, setIsShuffling]);

  return {
    gameState,
    isProcessing,
    showSongQuiz,
    currentSongQuestion,
    songQuizTimer,
    showWaveCrash,
    showLeaderboard,
    handlePieceClick,
    handleSongQuizAnswer,
    handleSponsorClick,
    handleWaveCrashComplete,
    showLeaderboardModal,
    hideLeaderboardModal,
    handleLeaderboardNameSubmit,
    resetGame,
    triggerBoardFlash,
    pauseGame,
    activeEvents,
    dailyChallenge,
    engagementData,
    gameOverCountdown,
    boardFlash,
    matchedRows,
    matchedCols,
    swappingPieces
  };
} 