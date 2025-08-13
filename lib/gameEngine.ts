import { GamePiece, PieceType, Match, BeachMatchState, PowerUpType, QuizType } from './types';

export class BeachMatchEngine {
  public static readonly GRID_SIZE = 8;
  private static readonly PIECE_TYPES: PieceType[] = ['beach_ball', 'microphone', 'rocket', 'palm_tree', 'boat'];
  private static readonly MIN_MATCH = 3;
  
  // Shared trivia cooldown timer (2 minutes = 120000ms)
  private static lastTriviaTime: number = 0; // Initialize to 0 to allow first trivia immediately
  private static readonly QUIZ_COOLDOWN = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  // Hint system
  private static readonly HINT_DELAY = 3000; // 3 seconds (reduced from 6)
  private static readonly HINT_COOLDOWN = 90 * 1000; // 90 seconds

  // Wave crash system
  private static readonly WAVE_CRASH_CHANCE = 0.02; // 2% chance per match
  private static readonly WAVE_CRASH_COOLDOWN = 3 * 60 * 1000; // 3 minutes
  private static lastWaveCrashTime: number = 0;

  static createInitialGrid(): (GamePiece | null)[][] {
    const grid: (GamePiece | null)[][] = [];
    
    for (let row = 0; row < this.GRID_SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < this.GRID_SIZE; col++) {
        grid[row][col] = this.createRandomPiece(row, col);
      }
    }

    // Ensure no initial matches
    this.removeInitialMatches(grid);
    
    return grid;
  }

  static createRandomPiece(row: number, col: number): GamePiece {
    const type = this.PIECE_TYPES[Math.floor(Math.random() * this.PIECE_TYPES.length)];
    return {
      id: `piece-${row}-${col}-${Date.now()}-${Math.random()}`,
      type,
      row,
      col
    };
  }

  private static removeInitialMatches(grid: (GamePiece | null)[][]) {
    let hasMatches = true;
    let attempts = 0;
    const maxAttempts = 100;

    while (hasMatches && attempts < maxAttempts) {
      hasMatches = false;
      attempts++;

      for (let row = 0; row < this.GRID_SIZE; row++) {
        for (let col = 0; col < this.GRID_SIZE; col++) {
          const piece = grid[row][col];
          if (!piece) continue;

          // Check for horizontal matches
          if (col >= 2) {
            const left1 = grid[row][col - 1];
            const left2 = grid[row][col - 2];
            if (left1 && left2 && piece.type === left1.type && piece.type === left2.type) {
              grid[row][col] = this.createRandomPiece(row, col);
              hasMatches = true;
            }
          }

          // Check for vertical matches
          if (row >= 2) {
            const up1 = grid[row - 1][col];
            const up2 = grid[row - 2][col];
            if (up1 && up2 && piece.type === up1.type && piece.type === up2.type) {
              grid[row][col] = this.createRandomPiece(row, col);
              hasMatches = true;
            }
          }
        }
      }
    }
  }

  static findMatches(grid: (GamePiece | null)[][]): Match[] {
    const matches: Match[] = [];
    const matchedPieces = new Set<string>();

    // Find horizontal matches
    for (let row = 0; row < this.GRID_SIZE; row++) {
      let currentMatch: GamePiece[] = [];
      
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const piece = grid[row][col];
        
        if (piece) {
          if (currentMatch.length === 0 || currentMatch[currentMatch.length - 1].type === piece.type) {
            currentMatch.push(piece);
          } else {
            // Check if we have a match to add
            if (currentMatch.length >= this.MIN_MATCH) {
              matches.push({
                pieces: [...currentMatch],
                type: 'horizontal',
                score: this.calculateMatchScore(currentMatch)
              });
              currentMatch.forEach(p => matchedPieces.add(p.id));
            }
            // Start new match with current piece
            currentMatch = [piece];
          }
        } else {
          // Empty space, check if we have a match
          if (currentMatch.length >= this.MIN_MATCH) {
            matches.push({
              pieces: [...currentMatch],
              type: 'horizontal',
              score: this.calculateMatchScore(currentMatch)
            });
            currentMatch.forEach(p => matchedPieces.add(p.id));
          }
          currentMatch = [];
        }
      }

      // Check end of row
      if (currentMatch.length >= this.MIN_MATCH) {
        matches.push({
          pieces: [...currentMatch],
          type: 'horizontal',
          score: this.calculateMatchScore(currentMatch)
        });
        currentMatch.forEach(p => matchedPieces.add(p.id));
      }
    }

    // Find vertical matches
    for (let col = 0; col < this.GRID_SIZE; col++) {
      let currentMatch: GamePiece[] = [];

      for (let row = 0; row < this.GRID_SIZE; row++) {
        const piece = grid[row][col];
        
        if (piece && !matchedPieces.has(piece.id)) {
          if (currentMatch.length === 0 || currentMatch[currentMatch.length - 1].type === piece.type) {
            currentMatch.push(piece);
          } else {
            // Check if we have a match to add
            if (currentMatch.length >= this.MIN_MATCH) {
              matches.push({
                pieces: [...currentMatch],
                type: 'vertical',
                score: this.calculateMatchScore(currentMatch)
              });
            }
            // Start new match with current piece
            currentMatch = [piece];
          }
        } else {
          // Empty space or already matched, check if we have a match
          if (currentMatch.length >= this.MIN_MATCH) {
            matches.push({
              pieces: [...currentMatch],
              type: 'vertical',
              score: this.calculateMatchScore(currentMatch)
            });
          }
          currentMatch = [];
        }
      }

      // Check end of column
      if (currentMatch.length >= this.MIN_MATCH) {
        matches.push({
          pieces: [...currentMatch],
          type: 'vertical',
          score: this.calculateMatchScore(currentMatch)
        });
      }
    }

    return matches;
  }

  private static calculateMatchScore(pieces: GamePiece[]): number {
    const baseScore = 50;
    const lengthMultiplier = pieces.length - 2; // 3 pieces = 1x, 4 pieces = 2x, etc.
    return baseScore * lengthMultiplier;
  }

  static canSwapPieces(grid: (GamePiece | null)[][], row1: number, col1: number, row2: number, col2: number): boolean {
    // Check if positions are adjacent
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      // Create a temporary grid with pieces swapped
      const testGrid = grid.map(row => [...row]);
      const piece1 = testGrid[row1][col1];
      const piece2 = testGrid[row2][col2];
      
      if (!piece1 || !piece2) return false;

      // Swap pieces temporarily
      testGrid[row1][col1] = { ...piece2, row: row1, col: col1 };
      testGrid[row2][col2] = { ...piece1, row: row2, col: col2 };

      // Check if this swap would create any matches
      const matches = this.findMatches(testGrid);
      return matches.length > 0;
    }

    return false;
  }

  static swapPieces(grid: (GamePiece | null)[][], row1: number, col1: number, row2: number, col2: number): (GamePiece | null)[][] {
    const newGrid = grid.map(row => [...row]);
    const piece1 = newGrid[row1][col1];
    const piece2 = newGrid[row2][col2];
    
    if (piece1 && piece2) {
      newGrid[row1][col1] = { ...piece2, row: row1, col: col1, id: piece2.id };
      newGrid[row2][col2] = { ...piece1, row: row2, col: col2, id: piece1.id };
    }

    return newGrid;
  }

  static applyGravity(grid: (GamePiece | null)[][]): (GamePiece | null)[][] {
    const newGrid = grid.map(row => [...row]);

    for (let col = 0; col < this.GRID_SIZE; col++) {
      // Collect all non-null pieces in this column
      const pieces: GamePiece[] = [];
      for (let row = this.GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col]) {
          pieces.push(newGrid[row][col]!);
        }
      }

      // Clear the column
      for (let row = 0; row < this.GRID_SIZE; row++) {
        newGrid[row][col] = null;
      }

      // Fill from bottom with existing pieces
      for (let i = 0; i < pieces.length; i++) {
        const targetRow = this.GRID_SIZE - 1 - i;
        newGrid[targetRow][col] = { ...pieces[i], row: targetRow };
      }

      // Fill remaining spaces with new pieces
      for (let row = 0; row < this.GRID_SIZE - pieces.length; row++) {
        newGrid[row][col] = this.createRandomPiece(row, col);
      }
    }

    return newGrid;
  }

  static removeMatches(grid: (GamePiece | null)[][], matches: Match[]): (GamePiece | null)[][] {
    const newGrid = grid.map(row => [...row]);
    const piecesToRemove = new Set<string>();

    matches.forEach(match => {
      match.pieces.forEach(piece => {
        piecesToRemove.add(piece.id);
      });
    });

    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const piece = newGrid[row][col];
        if (piece && piecesToRemove.has(piece.id)) {
          newGrid[row][col] = null;
        }
      }
    }

    return newGrid;
  }

  static hasValidMoves(grid: (GamePiece | null)[][]): boolean {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        // Check right neighbor
        if (col < this.GRID_SIZE - 1) {
          if (this.canSwapPieces(grid, row, col, row, col + 1)) {
            return true;
          }
        }
        // Check down neighbor
        if (row < this.GRID_SIZE - 1) {
          if (this.canSwapPieces(grid, row, col, row + 1, col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  static createPowerUp(matchType: 'horizontal' | 'vertical' | 'l_shape' | 't_shape', matchLength: number): PowerUpType | null {
    if (matchLength >= 5) {
      return 'color_bomb';
    } else if (matchLength === 4) {
      return matchType === 'horizontal' ? 'line_clear' : 'line_clear';
    }
    return null;
  }

  static findPossibleMatch(grid: (GamePiece | null)[][]): { piece1: { row: number; col: number }; piece2: { row: number; col: number } } | null {
    // Look for any valid swap that would create a match
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (!grid[row][col]) continue;

        // Check all adjacent positions
        const directions = [
          { dr: -1, dc: 0 }, // up
          { dr: 1, dc: 0 },  // down
          { dr: 0, dc: -1 }, // left
          { dr: 0, dc: 1 }   // right
        ];

        for (const { dr, dc } of directions) {
          const newRow = row + dr;
          const newCol = col + dc;

          if (newRow >= 0 && newRow < this.GRID_SIZE && newCol >= 0 && newCol < this.GRID_SIZE) {
            if (this.canSwapPieces(grid, row, col, newRow, newCol)) {
              return {
                piece1: { row, col },
                piece2: { row: newRow, col: newCol }
              };
            }
          }
        }
      }
    }
    return null;
  }

  static shouldShowHint(gameState: BeachMatchState): boolean {
    const now = Date.now();
    
    // Check if no activity period has started
    if (!gameState.noActivityStart) return false;
    
    // Check if enough time has passed for hint
    const timeSinceLastActivity = now - gameState.noActivityStart;
    if (timeSinceLastActivity < this.HINT_DELAY) return false;
    
    // Check cooldown since last hint
    const timeSinceLastHint = now - gameState.hintState.lastHintTime;
    if (timeSinceLastHint < this.HINT_COOLDOWN) return false;
    
    return true;
  }

  static determineQuizType(pieceType: PieceType): QuizType | null {
    switch (pieceType) {
      case 'microphone':
        return 'song';
      case 'rocket':
        return 'space_coast';
      case 'palm_tree':
        return 'florida_beach';
      default:
        return null; // beach_ball and boat don't trigger trivia
    }
  }

  static shouldTriggerQuiz(pieceType: PieceType, totalMatches: number): boolean {
    console.log(`[DEBUG] shouldTriggerQuiz called with pieceType: ${pieceType}, totalMatches: ${totalMatches}`);
    
    const quizType = this.determineQuizType(pieceType);
    console.log(`[DEBUG] determineQuizType returned: ${quizType}`);
    
    if (!quizType) {
      console.log(`[DEBUG] No quiz type determined, returning false`);
      return false;
    }
    
    // All trivia types require at least 2 matches
    if (totalMatches < 2) {
      console.log(`[DEBUG] Need at least 2 matches, but only have ${totalMatches}`);
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastTrivia = now - this.lastTriviaTime;
    console.log(`[DEBUG] Time since last trivia (any type): ${timeSinceLastTrivia}ms (cooldown: ${this.QUIZ_COOLDOWN}ms)`);
    
    // Only trigger if enough time has passed since ANY trivia AND random chance succeeds
    if (timeSinceLastTrivia >= this.QUIZ_COOLDOWN) {
      const randomChance = Math.random();
      console.log(`[DEBUG] Cooldown passed, random chance: ${randomChance} (need < 0.5)`);
      
      if (randomChance < 0.5) { // 50% chance when cooldown is ready
        // Update the shared trivia timer
        this.lastTriviaTime = now;
        
        console.log(`${quizType} quiz triggered for ${pieceType}! Next trivia (any type) available in 2 minutes.`);
        return true;
      } else {
        console.log(`[DEBUG] Random chance failed, no quiz triggered`);
      }
    } else {
      console.log(`[DEBUG] Cooldown not passed yet (need ${Math.ceil((this.QUIZ_COOLDOWN - timeSinceLastTrivia) / 1000)} more seconds)`);
    }
    
    return false;
  }

  // Deprecated - keeping for backward compatibility but now unused
  static triggerSongMiniGame(): boolean {
    return false; // Disabled - now using piece-specific triggering
  }

  static shouldTriggerWaveCrash(totalMatches: number): boolean {
    // Only trigger after 10+ matches to let players get settled
    if (totalMatches < 10) return false;
    
    const now = Date.now();
    const timeSinceLastWave = now - this.lastWaveCrashTime;
    
    // Check cooldown and random chance
    if (timeSinceLastWave >= this.WAVE_CRASH_COOLDOWN) {
      if (Math.random() < this.WAVE_CRASH_CHANCE) {
        this.lastWaveCrashTime = now;
        console.log('🌊 WAVE CRASH INCOMING! 🌊');
        return true;
      }
    }
    
    return false;
  }

  static createWaveCrashedGrid(grid: (GamePiece | null)[][]): (GamePiece | null)[][] {
    console.log('🌊 Creating wave-crashed grid (boats → waves)');
    
    const newGrid = grid.map(row => 
      row.map(piece => {
        if (piece && piece.type === 'boat') {
          // Replace boats with special wave pieces that give double points
          return {
            ...piece,
            type: 'wave' as const,
            isSpecial: true,
            powerUp: 'double_points' as const
          };
        }
        return piece;
      })
    );
    
    return newGrid;
  }

  static shuffleGrid(grid: (GamePiece | null)[][]): (GamePiece | null)[][] {
    // Flatten all non-null pieces
    const pieces: GamePiece[] = [];
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col]) {
          pieces.push({ ...grid[row][col]!, row, col });
        }
      }
    }
    // Shuffle the pieces
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    // Refill the grid
    const newGrid: (GamePiece | null)[][] = grid.map(row => row.map(() => null));
    let idx = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (idx < pieces.length) {
          newGrid[row][col] = { ...pieces[idx], row, col };
          idx++;
        }
      }
    }
    return newGrid;
  }
} 