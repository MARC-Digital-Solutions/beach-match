import { EngagementMetrics, BeachMatchState } from './types';
import { AudioManager } from './audioManager';

export class EngagementTracker {
  private static readonly STREAM_LIFE_INTERVAL = 2 * 60 * 1000; // 2 minutes in ms (stream bonus)
  private static readonly STREAM_BONUS_INTERVAL = 2 * 60 * 1000; // 2 minutes in ms (stream bonus)
  private static readonly LIFE_REGEN_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms (lose 1 life)
  
  private static engagementData: EngagementMetrics = {
    streamTime: 0,
    sponsorClicks: 0,
    songQuizCompleted: 0,
    songQuizCorrect: 0,
    dailyStreakDays: 0,
    totalMatches: 0,
    highScore: 0,
    lastPlayDate: new Date()
  };

  // Track sponsor clicks per session to limit them
  private static sessionSponsorClicks: { [key: string]: boolean } = {};

  static loadEngagementData(): EngagementMetrics {
    if (typeof window === 'undefined') return this.engagementData;

    try {
      const saved = localStorage.getItem('beach-match-engagement');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.engagementData = {
          ...parsed,
          lastPlayDate: new Date(parsed.lastPlayDate)
        };
      }
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }

    return this.engagementData;
  }

  static saveEngagementData() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('beach-match-engagement', JSON.stringify(this.engagementData));
    } catch (error) {
      console.error('Error saving engagement data:', error);
    }
  }

  static updateStreamTime(gameState: BeachMatchState): BeachMatchState {
    const newState = { ...gameState };
    const currentTime = Date.now();

    // Track streaming time
    if (AudioManager.isStreaming()) {
      const streamTime = AudioManager.getStreamTime();
      newState.streamTime = streamTime;
      this.engagementData.streamTime += 1; // Increment by seconds

      // Give life every 5 minutes of streaming
      const minutesStreamed = Math.floor(streamTime / 60);
      const fiveMinuteIntervals = Math.floor(minutesStreamed / 5);
      const expectedLives = Math.min(3 + fiveMinuteIntervals, 5); // Cap at 5 lives

      if (expectedLives > newState.lives && currentTime - newState.lastLifeGained > this.STREAM_LIFE_INTERVAL) {
        newState.lives = expectedLives;
        newState.lastLifeGained = currentTime;
        console.log(`Gained life from streaming! Lives: ${newState.lives}`);
      }

      // Give bonus points every 5 minutes
      const bonusIntervals = Math.floor(minutesStreamed / 5);
      const expectedBonus = bonusIntervals * 100;
      
      if (expectedBonus > newState.lastScoreBonus && currentTime - newState.lastScoreBonus > this.STREAM_BONUS_INTERVAL) {
        newState.score += 100;
        newState.lastScoreBonus = expectedBonus;
        console.log(`Stream bonus! +100 points`);
      }
    }

    this.saveEngagementData();
    return newState;
  }

  static handleSponsorClick(gameState: BeachMatchState, type: 'ad' | 'video' | 'link'): BeachMatchState {
    const newState = { ...gameState };
    
    // Check if this sponsor type has already been clicked this session
    if (this.sessionSponsorClicks[type]) {
      console.log(`Sponsor ${type} already clicked this session - no bonus`);
      return newState; // No bonus for repeat clicks
    }
    
    // Mark this sponsor type as clicked for this session
    this.sessionSponsorClicks[type] = true;
    this.engagementData.sponsorClicks++;

    switch (type) {
      case 'ad':
        newState.score += 50;
        newState.lives = Math.min(newState.lives + 1, 5);
        console.log('Sponsor ad clicked: +50 points, +1 life (first time this session)');
        break;
      case 'video':
        newState.score += 100;
        newState.lives = Math.min(newState.lives + 2, 5);
        console.log('Sponsor video watched: +100 points, +2 lives (first time this session)');
        break;
      case 'link':
        newState.score += 75;
        newState.lives = Math.min(newState.lives + 1, 5);
        console.log('Sponsor link visited: +75 points, +1 life (first time this session)');
        break;
    }

    this.saveEngagementData();
    return newState;
  }

  static handleSongQuizComplete(gameState: BeachMatchState, isCorrect: boolean): BeachMatchState {
    const newState = { ...gameState };
    this.engagementData.songQuizCompleted++;

    if (isCorrect) {
      this.engagementData.songQuizCorrect++;
      newState.songStreak++;
      newState.score += 200;
      newState.lives = Math.min(newState.lives + 1, 5);
      
      // Streak bonus
      if (newState.songStreak >= 3) {
        const streakBonus = newState.songStreak * 50;
        newState.score += streakBonus;
        console.log(`Song quiz correct! +200 points, +1 life, streak bonus: +${streakBonus}`);
      } else {
        console.log('Song quiz correct! +200 points, +1 life');
      }
    } else {
      newState.songStreak = 0;
      console.log('Song quiz incorrect - no penalty');
    }

    this.saveEngagementData();
    return newState;
  }

  static calculateScoreMultiplier(gameState: BeachMatchState): number {
    let multiplier = 1;

    // Stream time multiplier
    const minutesStreamed = Math.floor(gameState.streamTime / 60);
    if (minutesStreamed >= 30) multiplier += 0.5;
    else if (minutesStreamed >= 15) multiplier += 0.3;
    else if (minutesStreamed >= 5) multiplier += 0.1;

    // Combo multiplier
    multiplier += (gameState.combo * 0.1);

    // Song streak multiplier
    if (gameState.songStreak >= 5) multiplier += 0.3;
    else if (gameState.songStreak >= 3) multiplier += 0.2;

    return multiplier;
  }

  static updateHighScore(score: number) {
    if (score > this.engagementData.highScore) {
      this.engagementData.highScore = score;
      console.log(`New high score: ${score}!`);
      this.saveEngagementData();
      return true;
    }
    return false;
  }

  static updateDailyStreak(): number {
    const today = new Date();
    const lastPlay = this.engagementData.lastPlayDate;
    
    const daysDiff = Math.floor((today.getTime() - lastPlay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.engagementData.dailyStreakDays++;
    } else if (daysDiff > 1) {
      // Streak broken
      this.engagementData.dailyStreakDays = 1;
    }
    // If same day (daysDiff === 0), keep current streak

    this.engagementData.lastPlayDate = today;
    this.saveEngagementData();
    
    return this.engagementData.dailyStreakDays;
  }

  static getDailyChallenge(): { 
    description: string; 
    progress: number; 
    target: number; 
    reward: string;
    completed: boolean;
  } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Different challenges based on day of the week
    switch (dayOfWeek) {
      case 0: // Sunday
        return {
          description: "Stream for 15 minutes",
          progress: Math.min(Math.floor(this.engagementData.streamTime / 60), 15),
          target: 15,
          reward: "Exclusive piece skin",
          completed: this.engagementData.streamTime >= 15 * 60
        };
      case 1: // Monday
        return {
          description: "Make 50 matches",
          progress: Math.min(this.engagementData.totalMatches, 50),
          target: 50,
          reward: "Bonus life package",
          completed: this.engagementData.totalMatches >= 50
        };
      case 2: // Tuesday
        return {
          description: "Complete 3 song mini-games",
          progress: Math.min(this.engagementData.songQuizCompleted, 3),
          target: 3,
          reward: "Power-up starter pack",
          completed: this.engagementData.songQuizCompleted >= 3
        };
      case 3: // Wednesday
        return {
          description: "Click 5 sponsor ads",
          progress: Math.min(this.engagementData.sponsorClicks, 5),
          target: 5,
          reward: "Score multiplier boost",
          completed: this.engagementData.sponsorClicks >= 5
        };
      case 4: // Thursday
        return {
          description: "Get 3 song quiz correct",
          progress: Math.min(this.engagementData.songQuizCorrect, 3),
          target: 3,
          reward: "Music Note power-up",
          completed: this.engagementData.songQuizCorrect >= 3
        };
      case 5: // Friday
        return {
          description: "Stream for 30 minutes",
          progress: Math.min(Math.floor(this.engagementData.streamTime / 60), 30),
          target: 30,
          reward: "Weekend bonus multiplier",
          completed: this.engagementData.streamTime >= 30 * 60
        };
      case 6: // Saturday
        return {
          description: "Score 10,000 points",
          progress: Math.min(this.engagementData.highScore, 10000),
          target: 10000,
          reward: "Beach Party theme unlock",
          completed: this.engagementData.highScore >= 10000
        };
      default:
        return {
          description: "Play the game",
          progress: 1,
          target: 1,
          reward: "Fun!",
          completed: true
        };
    }
  }

  static getEngagementData(): EngagementMetrics {
    return { ...this.engagementData };
  }

  static resetDailyStats() {
    // Reset daily-specific stats while keeping persistent ones
    this.engagementData.songQuizCompleted = 0;
    this.engagementData.songQuizCorrect = 0;
    this.engagementData.sponsorClicks = 0;
    this.engagementData.totalMatches = 0;
    this.saveEngagementData();
  }

  // Reset session sponsor clicks for new game
  static resetSessionSponsorClicks() {
    this.sessionSponsorClicks = {};
    console.log('Session sponsor clicks reset for new game');
  }
} 