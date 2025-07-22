import { GamePiece, PowerUpType, BeachMatchState } from './types';
import { BeachMatchEngine } from './gameEngine';
import { AudioManager } from './audioManager';

export class PowerUpSystem {
  static activatePowerUp(
    powerUp: PowerUpType, 
    targetRow: number, 
    targetCol: number, 
    grid: (GamePiece | null)[][], 
    gameState: BeachMatchState
  ): {
    newGrid: (GamePiece | null)[][];
    scoreBonus: number;
    piecesRemoved: number;
  } {
    const newGrid = grid.map(row => [...row]);
    let scoreBonus = 0;
    let piecesRemoved = 0;

    AudioManager.playPowerUpSound();

    switch (powerUp) {
      case 'line_clear':
        ({ scoreBonus, piecesRemoved } = this.activateLineClear(newGrid, targetRow, targetCol));
        break;
      case 'color_bomb':
        ({ scoreBonus, piecesRemoved } = this.activateColorBomb(newGrid, targetRow, targetCol));
        break;
      case 'lightning':
        ({ scoreBonus, piecesRemoved } = this.activateLightning(newGrid, targetRow, targetCol));
        break;
      case 'music_note':
        ({ scoreBonus, piecesRemoved } = this.activateMusicNote(newGrid, targetRow, targetCol));
        break;
      case 'radio_wave':
        ({ scoreBonus, piecesRemoved } = this.activateRadioWave(newGrid, targetRow, targetCol));
        break;
      case 'beach_bomb':
        ({ scoreBonus, piecesRemoved } = this.activateBeachBomb(newGrid, targetRow, targetCol));
        break;
      case 'double_points':
        ({ scoreBonus, piecesRemoved } = this.activateDoublePoints(newGrid, targetRow, targetCol));
        break;
    }

    console.log(`Power-up ${powerUp} activated! Score bonus: ${scoreBonus}, Pieces removed: ${piecesRemoved}`);

    return { newGrid, scoreBonus, piecesRemoved };
  }

  private static activateLineClear(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    let piecesRemoved = 0;
    let scoreBonus = 0;

    // Clear entire row
    for (let c = 0; c < BeachMatchEngine.GRID_SIZE; c++) {
      if (grid[row][c]) {
        piecesRemoved++;
        scoreBonus += 25;
        grid[row][c] = null;
      }
    }

    // Clear entire column
    for (let r = 0; r < BeachMatchEngine.GRID_SIZE; r++) {
      if (grid[r][col]) {
        piecesRemoved++;
        scoreBonus += 25;
        grid[r][col] = null;
      }
    }

    return { scoreBonus, piecesRemoved };
  }

  private static activateColorBomb(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    let piecesRemoved = 0;
    let scoreBonus = 0;
    const targetPiece = grid[row][col];
    
    if (!targetPiece) return { scoreBonus: 0, piecesRemoved: 0 };

    const targetType = targetPiece.type;

    // Remove all pieces of the same type
    for (let r = 0; r < BeachMatchEngine.GRID_SIZE; r++) {
      for (let c = 0; c < BeachMatchEngine.GRID_SIZE; c++) {
        const piece = grid[r][c];
        if (piece && piece.type === targetType) {
          piecesRemoved++;
          scoreBonus += 50;
          grid[r][c] = null;
        }
      }
    }

    return { scoreBonus, piecesRemoved };
  }

  private static activateLightning(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    let piecesRemoved = 0;
    let scoreBonus = 0;

    // Clear 3x3 area around the target
    for (let r = Math.max(0, row - 1); r <= Math.min(BeachMatchEngine.GRID_SIZE - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(BeachMatchEngine.GRID_SIZE - 1, col + 1); c++) {
        if (grid[r][c]) {
          piecesRemoved++;
          scoreBonus += 30;
          grid[r][c] = null;
        }
      }
    }

    return { scoreBonus, piecesRemoved };
  }

  private static activateMusicNote(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    let piecesRemoved = 0;
    let scoreBonus = 0;

    // Clear all adjacent pieces in a + pattern
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Direct adjacents
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ];

    // Clear center piece
    if (grid[row][col]) {
      piecesRemoved++;
      scoreBonus += 40;
      grid[row][col] = null;
    }

    // Clear adjacent pieces
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < BeachMatchEngine.GRID_SIZE && newCol >= 0 && newCol < BeachMatchEngine.GRID_SIZE && grid[newRow][newCol]) {
        piecesRemoved++;
        scoreBonus += 40;
        grid[newRow][newCol] = null;
      }
    });

    return { scoreBonus, piecesRemoved };
  }

  private static activateRadioWave(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    let piecesRemoved = 0;
    let scoreBonus = 0;

    // Create chain reaction - clear pieces in expanding waves
    const waves = [
      { distance: 1, bonus: 60 },
      { distance: 2, bonus: 40 },
      { distance: 3, bonus: 20 }
    ];

    waves.forEach(wave => {
      for (let r = 0; r < BeachMatchEngine.GRID_SIZE; r++) {
        for (let c = 0; c < BeachMatchEngine.GRID_SIZE; c++) {
          const distance = Math.abs(r - row) + Math.abs(c - col); // Manhattan distance
          
          if (distance === wave.distance && grid[r][c]) {
            // 50% chance to clear pieces at each wave distance
            if (Math.random() < 0.5) {
              piecesRemoved++;
              scoreBonus += wave.bonus;
              grid[r][c] = null;
            }
          }
        }
      }
    });

    return { scoreBonus, piecesRemoved };
  }

  private static activateBeachBomb(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    let piecesRemoved = 0;
    let scoreBonus = 0;

    // Mega-clear effect - clear 5x5 area
    for (let r = Math.max(0, row - 2); r <= Math.min(BeachMatchEngine.GRID_SIZE - 1, row + 2); r++) {
      for (let c = Math.max(0, col - 2); c <= Math.min(BeachMatchEngine.GRID_SIZE - 1, col + 2); c++) {
        if (grid[r][c]) {
          piecesRemoved++;
          scoreBonus += 75;
          grid[r][c] = null;
        }
      }
    }

    return { scoreBonus, piecesRemoved };
  }

  static shouldCreatePowerUp(matchLength: number, matchType: 'horizontal' | 'vertical' | 'l_shape' | 't_shape'): PowerUpType | null {
    if (matchLength >= 5) {
      return 'color_bomb';
    } else if (matchLength === 4) {
      return 'line_clear';
    } else if (matchType === 'l_shape' || matchType === 't_shape') {
      return 'lightning';
    }
    
    return null;
  }

  static createEngagementPowerUp(type: 'stream' | 'sponsor' | 'song_quiz'): PowerUpType {
    switch (type) {
      case 'stream':
        return 'radio_wave';
      case 'sponsor':
        return 'beach_bomb';
      case 'song_quiz':
        return 'music_note';
      default:
        return 'lightning';
    }
  }

  static addPowerUpToGrid(
    grid: (GamePiece | null)[][], 
    powerUp: PowerUpType, 
    row: number, 
    col: number
  ): (GamePiece | null)[][] {
    const newGrid = grid.map(row => [...row]);
    const existingPiece = newGrid[row][col];
    
    if (existingPiece) {
      newGrid[row][col] = {
        ...existingPiece,
        isSpecial: true,
        powerUp: powerUp
      };
    }

    return newGrid;
  }

  static getPowerUpDescription(powerUp: PowerUpType): string {
    switch (powerUp) {
      case 'line_clear':
        return 'Clears entire row and column';
      case 'color_bomb':
        return 'Removes all pieces of selected color';
      case 'lightning':
        return 'Clears 3x3 area around piece';
      case 'music_note':
        return 'Clears all adjacent pieces with bonus';
      case 'radio_wave':
        return 'Creates expanding chain reaction';
      case 'beach_bomb':
        return 'Mega-clear 5x5 area with high scores';
      case 'double_points':
        return 'Wave piece gives double points when matched';
      default:
        return 'Special power-up effect';
    }
  }

  static getPowerUpEmoji(powerUp: PowerUpType): string {
    switch (powerUp) {
      case 'line_clear':
        return '➡️';
      case 'color_bomb':
        return '💥';
      case 'lightning':
        return '⚡';
      case 'music_note':
        return '🎵';
      case 'radio_wave':
        return '📻';
      case 'beach_bomb':
        return '🏖️';
      case 'double_points':
        return '🌊';
      default:
        return '✨';
    }
  }

  private static activateDoublePoints(grid: (GamePiece | null)[][], row: number, col: number): { scoreBonus: number; piecesRemoved: number } {
    // Wave pieces with double points just give a bonus when matched
    // This is a passive power-up that applies during normal matching
    const targetPiece = grid[row][col];
    if (!targetPiece) return { scoreBonus: 0, piecesRemoved: 0 };

    // Award double points for this wave piece
    const scoreBonus = 100; // Double the normal piece value
    
    // Remove the wave piece that was activated
    grid[row][col] = null;
    
    console.log('🌊 Wave piece matched for double points!');
    
    return { scoreBonus, piecesRemoved: 1 };
  }
} 