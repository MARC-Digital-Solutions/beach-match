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

  // Song quiz questions - Classic Hits from 1999 and older (filtered for family-friendly content)
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
      options: ["Space Coast's Hit Music", "Melbourne's #1 Music", "Florida's Beach Station", "Your Music, Your Station"],
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
    },
    // Classic Rock & 80s Hits (1999 and older)
    {
      id: 'song_4',
      audioUrl: '',
      title: 'Comfortably Numb',
      artist: 'Pink Floyd',
      lyricHint: 'Hello, is there anybody in there',
      options: ['Pink Floyd', 'Led Zeppelin', 'The Who', 'The Doors'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_5',
      audioUrl: '',
      title: 'Dreams',
      artist: 'Fleetwood Mac',
      lyricHint: 'Thunder only happens when it\'s raining',
      options: ['Fleetwood Mac', 'Stevie Nicks', 'The Eagles', 'Heart'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_6',
      audioUrl: '',
      title: 'Go Your Own Way',
      artist: 'Fleetwood Mac',
      lyricHint: 'Loving you isn\'t the right thing to do',
      options: ['Fleetwood Mac', 'Stevie Nicks', 'The Eagles', 'Heart'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_7',
      audioUrl: '',
      title: 'Another Brick in the Wall',
      artist: 'Pink Floyd',
      lyricHint: 'We don\'t need no education',
      options: ['Pink Floyd', 'Led Zeppelin', 'The Who', 'The Doors'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_8',
      audioUrl: '',
      title: 'Wish You Were Here',
      artist: 'Pink Floyd',
      lyricHint: 'So, so you think you can tell heaven from hell',
      options: ['Pink Floyd', 'Led Zeppelin', 'The Who', 'The Doors'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_9',
      audioUrl: '',
      title: 'Hotel California',
      artist: 'The Eagles',
      lyricHint: 'Welcome to the Hotel California',
      options: ['The Eagles', 'Fleetwood Mac', 'The Doobie Brothers', 'America'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_10',
      audioUrl: '',
      title: 'Take It Easy',
      artist: 'The Eagles',
      lyricHint: 'Well, I\'m running down the road trying to loosen my load',
      options: ['The Eagles', 'Fleetwood Mac', 'The Doobie Brothers', 'America'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_11',
      audioUrl: '',
      title: 'Sweet Child O\' Mine',
      artist: 'Guns N\' Roses',
      lyricHint: 'She\'s got a smile that it seems to me',
      options: ['Guns N\' Roses', 'Aerosmith', 'Bon Jovi', 'Def Leppard'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_12',
      audioUrl: '',
      title: 'Livin\' on a Prayer',
      artist: 'Bon Jovi',
      lyricHint: 'Tommy used to work on the docks',
      options: ['Bon Jovi', 'Guns N\' Roses', 'Aerosmith', 'Def Leppard'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_13',
      audioUrl: '',
      title: 'Don\'t Stop Believin\'',
      artist: 'Journey',
      lyricHint: 'Just a small town girl, living in a lonely world',
      options: ['Journey', 'Foreigner', 'REO Speedwagon', 'Styx'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_14',
      audioUrl: '',
      title: 'Every Breath You Take',
      artist: 'The Police',
      lyricHint: 'Every breath you take, every move you make',
      options: ['The Police', 'The Cars', 'The Pretenders', 'The Clash'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_15',
      audioUrl: '',
      title: 'With or Without You',
      artist: 'U2',
      lyricHint: 'See the stone set in your eyes',
      options: ['U2', 'The Police', 'The Cars', 'The Pretenders'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_16',
      audioUrl: '',
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      lyricHint: 'Billie Jean is not my lover',
      options: ['Michael Jackson', 'Prince', 'Madonna', 'Janet Jackson'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_17',
      audioUrl: '',
      title: 'Beat It',
      artist: 'Michael Jackson',
      lyricHint: 'They told him don\'t you ever come around here',
      options: ['Michael Jackson', 'Prince', 'Madonna', 'Janet Jackson'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_18',
      audioUrl: '',
      title: 'Purple Rain',
      artist: 'Prince',
      lyricHint: 'I never meant to cause you any sorrow',
      options: ['Prince', 'Michael Jackson', 'Madonna', 'Janet Jackson'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_19',
      audioUrl: '',
      title: 'When Doves Cry',
      artist: 'Prince',
      lyricHint: 'How can you just leave me standing',
      options: ['Prince', 'Michael Jackson', 'Madonna', 'Janet Jackson'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_20',
      audioUrl: '',
      title: 'Like a Virgin',
      artist: 'Madonna',
      lyricHint: 'I made it through the wilderness',
      options: ['Madonna', 'Cyndi Lauper', 'Tina Turner', 'Gloria Estefan'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_21',
      audioUrl: '',
      title: 'Material Girl',
      artist: 'Madonna',
      lyricHint: 'Some boys kiss me, some boys hug me',
      options: ['Madonna', 'Cyndi Lauper', 'Tina Turner', 'Gloria Estefan'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_22',
      audioUrl: '',
      title: 'Girls Just Want to Have Fun',
      artist: 'Cyndi Lauper',
      lyricHint: 'I come home in the morning light',
      options: ['Cyndi Lauper', 'Madonna', 'Tina Turner', 'Gloria Estefan'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_23',
      audioUrl: '',
      title: 'Time After Time',
      artist: 'Cyndi Lauper',
      lyricHint: 'If you\'re lost you can look and you will find me',
      options: ['Cyndi Lauper', 'Madonna', 'Tina Turner', 'Gloria Estefan'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_24',
      audioUrl: '',
      title: 'What\'s Love Got to Do with It',
      artist: 'Tina Turner',
      lyricHint: 'What\'s love got to do, got to do with it',
      options: ['Tina Turner', 'Gloria Estefan', 'Madonna', 'Cyndi Lauper'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_25',
      audioUrl: '',
      title: 'Simply the Best',
      artist: 'Tina Turner',
      lyricHint: 'You\'re simply the best, better than all the rest',
      options: ['Tina Turner', 'Gloria Estefan', 'Madonna', 'Cyndi Lauper'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_26',
      audioUrl: '',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      lyricHint: 'There\'s a lady who\'s sure all that glitters is gold',
      options: ['Led Zeppelin', 'Pink Floyd', 'The Who', 'The Doors'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_27',
      audioUrl: '',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      lyricHint: 'Is this the real life, is this just fantasy',
      options: ['Queen', 'Led Zeppelin', 'Pink Floyd', 'The Who'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_28',
      audioUrl: '',
      title: 'We Will Rock You',
      artist: 'Queen',
      lyricHint: 'Buddy, you\'re a boy, make a big noise',
      options: ['Queen', 'Led Zeppelin', 'Pink Floyd', 'The Who'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_29',
      audioUrl: '',
      title: 'Baba O\'Riley',
      artist: 'The Who',
      lyricHint: 'Out here in the fields, I fight for my meals',
      options: ['The Who', 'Led Zeppelin', 'Pink Floyd', 'The Doors'],
      correctAnswer: 0,
      type: 'song'
    },
    {
      id: 'song_30',
      audioUrl: '',
      title: 'Light My Fire',
      artist: 'The Doors',
      lyricHint: 'You know that it would be untrue',
      options: ['The Doors', 'Led Zeppelin', 'Pink Floyd', 'The Who'],
      correctAnswer: 0,
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

  // Content filter to remove inappropriate content
  private static filterInappropriateContent(text: string): boolean {
    const inappropriateWords = [
      'cannabis', 'marijuana', 'weed', 'pot', 'drug', 'drugs',
      'damn', 'hell', 'ass', 'bitch', 'slut', 'whore', 'fuck', 'shit', 'piss', 'crap'
    ];
    
    const lowerText = text.toLowerCase();
    return !inappropriateWords.some(word => lowerText.includes(word));
  }

  // Fetch curated classic hits trivia question (1999 and older only)
  static async fetchSongIQQuestion(): Promise<SongQuizQuestion | null> {
    try {
      // Use a curated API or fallback to local questions
      // For now, we'll use our local curated list of classic hits
      const randomIndex = Math.floor(Math.random() * this.SONG_QUIZ_QUESTIONS.length);
      const question = this.SONG_QUIZ_QUESTIONS[randomIndex];
      
      // Apply content filtering
      if (!this.filterInappropriateContent(question.lyricHint) || 
          !this.filterInappropriateContent(question.title) ||
          !question.options.every(option => this.filterInappropriateContent(option))) {
        // If any content is inappropriate, try another question
        return this.fetchSongIQQuestion();
      }
      
      return question;
    } catch (e) {
      console.warn('Failed to fetch song question, using fallback:', e);
    }
    return null;
  }

  static async getRandomSongQuestion(): Promise<SongQuizQuestion> {
    // Always use our curated classic hits list (1999 and older)
    const apiQuestion = await this.fetchSongIQQuestion();
    if (apiQuestion) return apiQuestion;
    
    // Fallback: get a random question from our curated list
    const randomIndex = Math.floor(Math.random() * this.SONG_QUIZ_QUESTIONS.length);
    const question = this.SONG_QUIZ_QUESTIONS[randomIndex];
    
    // Apply content filtering as final safety check
    if (this.filterInappropriateContent(question.lyricHint) && 
        this.filterInappropriateContent(question.title) &&
        question.options.every(option => this.filterInappropriateContent(option))) {
      return question;
    }
    
    // If filtered question is inappropriate, try another one
    return this.getRandomSongQuestion();
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
        resolve(); // Don&apos;t block game if audio fails
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
        resolve(); // Don&apos;t block game if audio fails
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

  static async getQuestionByType(type: 'song' | 'space_coast' | 'florida_beach'): Promise<QuizQuestion> {
    switch (type) {
      case 'song':
        return await this.getRandomSongQuestion();
      case 'space_coast':
        return this.getRandomSpaceCoastQuestion();
      case 'florida_beach':
        return this.getRandomFloridaBeachQuestion();
      default:
        return await this.getRandomSongQuestion();
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
        artist: 'Space Coast&apos;s Greatest Hits'
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