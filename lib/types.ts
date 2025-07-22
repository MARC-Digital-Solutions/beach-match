// Beach Match Game Types
export type PieceType = 'beach_ball' | 'microphone' | 'rocket' | 'palm_tree' | 'boat' | 'wave';

export type PowerUpType = 'line_clear' | 'color_bomb' | 'lightning' | 'music_note' | 'radio_wave' | 'beach_bomb' | 'double_points';

export type QuizType = 'song' | 'space_coast' | 'florida_beach';

export interface GamePiece {
  id: string;
  type: PieceType;
  row: number;
  col: number;
  isSpecial?: boolean;
  powerUp?: PowerUpType;
  isAnimating?: boolean;
}

export interface Match {
  pieces: GamePiece[];
  type: 'horizontal' | 'vertical' | 'l_shape' | 't_shape';
  score: number;
}

export interface HintState {
  isVisible: boolean;
  piece1: { row: number; col: number } | null;
  piece2: { row: number; col: number } | null;
  lastHintTime: number;
}

export interface BeachMatchState {
  score: number;
  lives: number;
  grid: (GamePiece | null)[][];
  selectedPiece: { row: number; col: number } | null;
  streamTime: number;
  currentStreamStart: number | null;
  matches: Match[];
  powerUps: PowerUpType[];
  level: number;
  combo: number;
  isGameOver: boolean;
  isPaused: boolean;
  lastLifeGained: number;
  lastScoreBonus: number;
  songStreak: number;
  totalMatches: number;
  hintState: HintState;
  lastMatchedPiece: PieceType | null;
  noActivityStart: number | null;
}

export interface SongQuizQuestion {
  id: string;
  audioUrl: string;
  title: string;
  artist: string;
  lyricHint: string; // Description of the lyrics instead of audio clips
  options: string[];
  correctAnswer: number;
  type: 'song';
}

export interface SpaceCoastQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  type: 'space_coast';
  hint: string;
}

export interface FloridaBeachQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  type: 'florida_beach';
  hint: string;
}

export type QuizQuestion = SongQuizQuestion | SpaceCoastQuestion | FloridaBeachQuestion;

export interface BeachEvent {
  id: string;
  type: 'rocket_launch' | 'hurricane_watch' | 'sunny_day' | 'beach_party' | 'happy_hour' | 'late_night';
  name: string;
  description: string;
  isActive: boolean;
  startTime: Date;
  endTime: Date;
  effects: {
    scoreMultiplier?: number;
    pieceBonus?: PieceType;
    powerUpChance?: number;
    specialBackground?: boolean;
  };
}

export interface EngagementMetrics {
  streamTime: number;
  sponsorClicks: number;
  songQuizCompleted: number;
  songQuizCorrect: number;
  dailyStreakDays: number;
  totalMatches: number;
  highScore: number;
  lastPlayDate: Date;
} 