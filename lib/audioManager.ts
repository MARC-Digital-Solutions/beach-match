import { SongQuizQuestion, SpaceCoastQuestion, FloridaBeachQuestion, QuizQuestion } from './types';

export class AudioManager {
  private static audioContext: AudioContext | null = null;
  private static streamElement: HTMLAudioElement | null = null;
  private static currentQuizAudio: HTMLAudioElement | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static gainNode: GainNode | null = null;
  private static isStreamPlaying = false;
  private static streamStartTime: number | null = null;
  private static currentClipIndex = 0;
  
  // Game audio clips
  private static readonly GAME_START_CLIPS = [
    '/WSBH ACA SHOT GUNS_15_WSBH_Cut12a_Aca.wav',
    '/WSBH ACA SHOT GUNS_23_WSBH_Cut13a_Aca.wav'
  ];
  
  private static readonly GAME_COMPLETE_CLIPS = [
    '/WSBH ACA SHOT GUNS_78_WSBH_Cut08_SG_Aca.wav'
  ];

  // WSBH Audio clips (for backward compatibility)
  private static readonly WSBH_CLIPS = [
    '/WSBH ACA SHOT GUNS_23_WSBH_Cut13a_Aca.wav',
    '/WSBH ACA SHOT GUNS_78_WSBH_Cut08_SG_Aca.wav',
    '/WSBH ACA SHOT GUNS_15_WSBH_Cut12a_Aca.wav'
  ];

  // Song quiz questions - Real 98.5 The Beach Info (fallback)
  private static readonly SONG_QUIZ_QUESTIONS: SongQuizQuestion[] = [
    {
      id: 'song_1',
      audioUrl: '/WSBH ACA SHOT GUNS_15_WSBH_Cut12a_Aca.wav',
      title: 'WSBH Beach Radio Jingle',
      artist: '98.5 The Beach',
      lyricHint: 'Official station identification with upbeat energy',
      options: ['98.5 The Beach Melbourne', '98.5 Your Hit Music Station', '98.5 Space Coast Radio', '98.5 The Beach Florida'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_2',
      audioUrl: '/WSBH ACA SHOT GUNS_23_WSBH_Cut13a_Aca.wav',
      title: 'WSBH Station Promo',
      artist: '98.5 The Beach',
      lyricHint: 'Smooth radio announcement with station branding',
      options: ['Space Coast\'s Hit Music', 'Melbourne\'s #1 Music', 'Florida\'s Beach Station', 'Your Music, Your Station'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_3',
      audioUrl: '/WSBH ACA SHOT GUNS_78_WSBH_Cut08_SG_Aca.wav',
      title: 'WSBH Shotgun Audio',
      artist: '98.5 The Beach',
      lyricHint: 'High-energy station identification with musical backdrop',
      options: ['Hit Music Station', 'Beach Radio Network', '98.5 The Beach', 'Space Coast Hits'],
      correctAnswer: 2,
      type: 'song'
    }
  ];

  // Helper to decode HTML entities
  static decodeHtmlEntities(str: string): string {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  // Fetch real music trivia question from SongIQ or similar API
  static async fetchSongIQQuestion(): Promise<SongQuizQuestion | null> {
    try {
      // Example: Use Open Trivia DB for music (replace with SongIQ if available)
      const response = await fetch('https://opentdb.com/api.php?amount=1&category=12&type=multiple');
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const q = data.results[0];
        // Decode HTML entities in question and options
        const decodedQuestion = AudioManager.decodeHtmlEntities(q.question);
        const decodedOptions = q.incorrect_answers.concat(q.correct_answer).map(AudioManager.decodeHtmlEntities);
        const correctIndex = decodedOptions.indexOf(AudioManager.decodeHtmlEntities(q.correct_answer));
        return {
          id: Date.now().toString(),
          audioUrl: '',
          type: 'song',
          title: decodedQuestion,
          artist: '',
          lyricHint: decodedQuestion,
          options: decodedOptions,
          correctAnswer: correctIndex,
        };
      }
    } catch (e) {
      console.warn('Failed to fetch SongIQ question, using fallback:', e);
    }
    return null;
  }

  static async getRandomSongQuestion(): Promise<SongQuizQuestion> {
    const apiQuestion = await this.fetchSongIQQuestion();
    if (apiQuestion) return apiQuestion;
    // fallback to local
    const randomIndex = Math.floor(Math.random() * this.SONG_QUIZ_QUESTIONS.length);
    return this.SONG_QUIZ_QUESTIONS[randomIndex];
  }

  // Space Coast quiz questions  
  private static readonly SPACE_COAST_QUESTIONS: SpaceCoastQuestion[] = [
    {
      id: 'space_1',
      question: 'What famous space center is located on the Space Coast?',
      options: ['Johnson Space Center', 'Kennedy Space Center', 'Cape Canaveral Air Force Station', 'NASA Wallops'],
      correctAnswer: 1,
      type: 'space_coast',
      hint: 'This is where the Space Shuttle launched from'
    },
    {
      id: 'space_2', 
      question: 'Which beach city is known as the "Space Coast"?',
      options: ['Melbourne', 'Titusville', 'Cocoa Beach', 'All of the above'],
      correctAnswer: 3,
      type: 'space_coast',
      hint: 'The entire area along the coast is called this'
    },
    {
      id: 'space_3',
      question: 'What rocket launched the Apollo missions to the moon?',
      options: ['Falcon 9', 'Saturn V', 'Delta IV', 'Atlas V'],
      correctAnswer: 1,
      type: 'space_coast',
      hint: 'This was the most powerful rocket ever built at the time'
    },
    {
      id: 'space_4',
      question: 'Which company has a major rocket landing facility at Cape Canaveral?',
      options: ['Blue Origin', 'SpaceX', 'Boeing', 'Lockheed Martin'],
      correctAnswer: 1,
      type: 'space_coast',
      hint: 'Known for reusable Falcon 9 rockets'
    }
  ];

  // Florida Beach quiz questions
  private static readonly FLORIDA_BEACH_QUESTIONS: FloridaBeachQuestion[] = [
    {
      id: 'beach_1',
      question: 'What is Florida\'s state marine mammal?',
      options: ['Dolphin', 'Manatee', 'Sea Turtle', 'Whale'],
      correctAnswer: 1,
      type: 'florida_beach',
      hint: 'These gentle giants are often called "sea cows"'
    },
    {
      id: 'beach_2',
      question: 'Which Florida beach is famous for spring break?',
      options: ['Daytona Beach', 'Miami Beach', 'Panama City Beach', 'All of the above'],
      correctAnswer: 3,
      type: 'florida_beach',  
      hint: 'Multiple Florida beaches are popular spring break destinations'
    },
    {
      id: 'beach_3',
      question: 'What type of sea turtle commonly nests on Florida beaches?',
      options: ['Green Sea Turtle', 'Loggerhead', 'Leatherback', 'All of the above'],
      correctAnswer: 3,
      type: 'florida_beach',
      hint: 'Florida beaches are nesting grounds for several species'
    },
    {
      id: 'beach_4',
      question: 'Melbourne Beach is located in which Florida county?',
      options: ['Orange County', 'Brevard County', 'Volusia County', 'Indian River County'],
      correctAnswer: 1,
      type: 'florida_beach',
      hint: 'This county is home to Kennedy Space Center'
    },
    {
      id: 'beach_5',
      question: 'What is the speed limit on most Florida beach driving areas?',
      options: ['10 mph', '15 mph', '25 mph', '35 mph'],
      correctAnswer: 0,
      type: 'florida_beach',
      hint: 'Very slow to protect beachgoers and wildlife'
    }
  ];

  static initializeStream(audioElement: HTMLAudioElement) {
    this.streamElement = audioElement;
    this.attachStreamListeners();
  }

  private static attachStreamListeners() {
    if (!this.streamElement) return;

    this.streamElement.addEventListener('play', () => {
      this.isStreamPlaying = true;
      this.streamStartTime = Date.now();
      console.log('Stream started');
    });

    this.streamElement.addEventListener('pause', () => {
      this.isStreamPlaying = false;
      this.streamStartTime = null;
      console.log('Stream paused');
    });

    this.streamElement.addEventListener('ended', () => {
      this.isStreamPlaying = false;
      this.streamStartTime = null;
      console.log('Stream ended');
    });

    this.streamElement.addEventListener('error', (e) => {
      console.error('Stream error:', e);
      this.isStreamPlaying = false;
      this.streamStartTime = null;
    });
  }

  static isStreaming(): boolean {
    return this.isStreamPlaying;
  }

  static getStreamTime(): number {
    if (!this.isStreamPlaying || !this.streamStartTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.streamStartTime) / 1000);
  }

  // Play WSBH audio clip on game start
  static playGameStartClip(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const clipUrl = this.WSBH_CLIPS[0]; // Always start with first clip
        console.log('Playing game start clip:', clipUrl);
        
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }

        this.currentAudio = new Audio(clipUrl);
        this.currentAudio.volume = 0.6;

        this.currentAudio.addEventListener('canplaythrough', () => {
          this.currentAudio!.play().then(() => {
            console.log('Game start clip playing');
            resolve();
          }).catch(reject);
        });

        this.currentAudio.addEventListener('error', (e) => {
          console.error('Error playing game start clip:', e);
          reject(e);
        });

        this.currentAudio.load();
      } catch (error) {
        console.error('Failed to play game start clip:', error);
        resolve(); // Don't block game if audio fails
      }
    });
  }

  // Play WSBH audio clip on game completion/win
  static playGameCompleteClip(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Cycle through clips
        this.currentClipIndex = (this.currentClipIndex + 1) % this.WSBH_CLIPS.length;
        const clipUrl = this.WSBH_CLIPS[this.currentClipIndex];
        console.log('Playing game complete clip:', clipUrl);

        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }

        this.currentAudio = new Audio(clipUrl);
        this.currentAudio.volume = 0.6;

        this.currentAudio.addEventListener('canplaythrough', () => {
          this.currentAudio!.play().then(() => {
            console.log('Game complete clip playing');
            resolve();
          }).catch(reject);
        });

        this.currentAudio.addEventListener('error', (e) => {
          console.error('Error playing game complete clip:', e);
          reject(e);
        });

        this.currentAudio.load();
      } catch (error) {
        console.error('Failed to play game complete clip:', error);
        resolve(); // Don't block game if audio fails
      }
    });
  }

  static getRandomSpaceCoastQuestion(): SpaceCoastQuestion {
    const randomIndex = Math.floor(Math.random() * this.SPACE_COAST_QUESTIONS.length);
    return this.SPACE_COAST_QUESTIONS[randomIndex];
  }

  static getRandomFloridaBeachQuestion(): FloridaBeachQuestion {
    const randomIndex = Math.floor(Math.random() * this.FLORIDA_BEACH_QUESTIONS.length);
    return this.FLORIDA_BEACH_QUESTIONS[randomIndex];
  }

  static getQuestionByType(type: 'song' | 'space_coast' | 'florida_beach'): QuizQuestion {
    switch (type) {
      case 'song':
        return this.getRandomSongQuestion();
      case 'space_coast':
        return this.getRandomSpaceCoastQuestion();
      case 'florida_beach':
        return this.getRandomFloridaBeachQuestion();
      default:
        return this.getRandomSongQuestion();
    }
  }

  // No longer needed for text-based quiz
  static async playQuizClip(question: SongQuizQuestion): Promise<HTMLAudioElement> {
    // Return empty promise since we're not using audio clips anymore
    return new Promise((resolve) => {
      console.log('Text-based quiz - no audio clip needed');
      resolve(new Audio());
    });
  }

  static stopQuizClip() {
    // No audio to stop for text-based quiz
    console.log('Text-based quiz - no audio to stop');
  }

  static async playClipPreview(audioUrl: string, duration: number = 10000): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.volume = 0.5;
      
      audio.addEventListener('canplaythrough', () => {
        audio.play();
        
        // Stop after specified duration
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          resolve();
        }, duration);
      });

      audio.addEventListener('error', () => {
        console.error('Error playing audio preview');
        resolve();
      });

      audio.load();
    });
  }

  // Get current song metadata from the stream (integrate with existing metadata fetching)
  static async getCurrentSongMetadata(): Promise<{title?: string, artist?: string, albumArt?: string}> {
    try {
      const response = await fetch('https://streamdb5web.securenetsystems.net/player_status_update/WSBH.xml', {
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      
      // Parse XML for current song info (reusing existing logic)
      let title = 'Live Stream';
      let artist = '98.5 The Beach WSBH';
      let albumArt = '';
      
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const titleElement = xmlDoc.querySelector('title') || xmlDoc.querySelector('song') || xmlDoc.querySelector('streamtitle');
        const artistElement = xmlDoc.querySelector('artist') || xmlDoc.querySelector('performer');
        const artElement = xmlDoc.querySelector('albumart') || xmlDoc.querySelector('artwork') || xmlDoc.querySelector('image');
        
        if (titleElement) title = titleElement.textContent?.trim() || title;
        if (artistElement) artist = artistElement.textContent?.trim() || artist;
        if (artElement) albumArt = artElement.textContent?.trim() || '';
        
      } catch (xmlParseError) {
        console.log('XML DOM parsing failed');
      }
      
      return { title, artist, albumArt };
    } catch (error) {
      console.error('Could not fetch song metadata:', error);
      return {
        title: '98.5 The Beach Live',
        artist: 'Space Coast\'s Greatest Hits'
      };
    }
  }

  // Create sound effects for game actions
  static playMatchSound() {
    // Create a simple positive sound for matches
    this.playTone(440, 0.1, 0.1); // A4 note
  }

  static playSwapSound() {
    // Create a simple swap sound
    this.playTone(220, 0.05, 0.05); // A3 note
  }

  static playPowerUpSound() {
    // Create a more exciting sound for power-ups
    this.playTone(880, 0.2, 0.15); // A5 note
  }

  static playGameOverSound() {
    // Create a descending sound for game over
    this.playTone(220, 0.3, 0.1);
    setTimeout(() => this.playTone(196, 0.3, 0.1), 100);
    setTimeout(() => this.playTone(174, 0.3, 0.1), 200);
  }

  private static playTone(frequency: number, duration: number, volume: number = 0.1) {
    if (typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio context not available for sound effects');
    }
  }
} 