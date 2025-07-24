'use client';
// Force Vercel deployment - latest commit fb4e15e
// Force deployment - ensure all apostrophes are properly escaped
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SongQuizModal } from '@/components/SongQuizModal';
import { GameTutorial } from '@/components/GameTutorial';
import { Leaderboard } from '@/components/Leaderboard';
import { WaveCrashEffect } from '@/components/WaveCrashEffect';
import BeachMatchGame from '@/components/BeachMatchGame';
import { useBeachMatch } from '@/lib/useBeachMatch';
import { AudioManager } from '@/lib/audioManager';
import { RefreshCw, Play, Pause, Info, Trophy, Target, Calendar } from 'lucide-react';

// Dynamically import GameIntroSequence with SSR disabled to prevent hydration issues
const GameIntroSequence = dynamic(
  () => import('@/components/GameIntroSequence').then(mod => ({ default: mod.GameIntroSequence })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-2xl text-blue-400 font-bold animate-pulse">
            BEACH MATCH
          </div>
          <div className="text-xl text-yellow-400 font-semibold mt-2">
            Loading...
          </div>
        </div>
      </div>
    )
  }
);

export default function HomePage() {
  // Always scroll to top on mount and after navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Re-enable intro sequence for full countdown experience
  const [showIntro, setShowIntro] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const {
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
    triggerBoardFlash, // <-- import this
    pauseGame,
    activeEvents,
    dailyChallenge,
    engagementData,
    gameOverCountdown,
    boardFlash,
    matchedRows,
    matchedCols,
    swappingPieces,
    showQuizCelebration // <-- add this
  } = useBeachMatch(gameStarted);

  // Handle intro sequence completion
  const handleIntroComplete = () => {
    setShowIntro(false);
    setTimeout(() => setShowTutorial(true), 100); // Ensure only one is visible at a time
  };

  // Handle tutorial completion and start the stream
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setTimeout(() => setGameStarted(true), 100); // Ensure only one is visible at a time
  };

  // Handle new game with intro
  const handleNewGameWithIntro = () => {
    resetGame();
    setGameStarted(false);
    setShowIntro(true);
    
    // Pause the stream when restarting
    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    if (audioElement) {
      audioElement.pause();
    }
  };

  // Start stream when game begins (after intro sequence)
  useEffect(() => {
    if (gameStarted) {
      const startStream = () => {
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.play().catch(err => {
            console.log('Stream autoplay blocked by browser:', err);
          });
        }
      };

      // Small delay to ensure DOM is ready
      setTimeout(startStream, 500);
    }
  }, [gameStarted]);

  // Trigger board flash when game becomes visible
  useEffect(() => {
    if (gameStarted) {
      triggerBoardFlash();
    }
  }, [gameStarted, triggerBoardFlash]);

  // Scroll to top when game board first appears
  useEffect(() => {
    if (gameStarted) {
      window.scrollTo(0, 0);
    }
  }, [gameStarted]);


  // Metadata state for current playing song
  const [nowPlaying, setNowPlaying] = useState<{
    title?: string;
    artist?: string;
    albumArt?: string;
    duration?: number;
  }>({});

  const [showStats, setShowStats] = useState(false);

  // Fetch current playing metadata from 98.5 The Beach
  useEffect(() => {
    const fetchMetadata = async () => {
      console.log('Fetching metadata at', new Date().toLocaleTimeString());
      try {
        const response = await fetch('https://streamdb5web.securenetsystems.net/player_status_update/WSBH.xml', {
          mode: 'cors',
          cache: 'no-cache' // Prevent caching to get fresh data
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        console.log('Raw XML response:', xmlText.slice(0, 200) + '...');
        
        // Parse XML for current song info (reusing existing logic)
        let title = 'Live Stream';
        let artist = '98.5 The Beach WSBH';
        let albumArt = '';
        
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          
          const titleElement = xmlDoc.querySelector('title') || xmlDoc.querySelector('song') || xmlDoc.querySelector('streamtitle');
          const artistElement = xmlDoc.querySelector('artist') || xmlDoc.querySelector('performer');
          // Try multiple possible tags for album art
          const artTags = ['albumart', 'artwork', 'image', 'coverart', 'cover', 'art', 'thumb', 'img'];
          let foundArt = '';
          for (const tag of artTags) {
            const el = xmlDoc.querySelector(tag);
            if (el) {
              // Prefer 'url' or 'src' attribute if present
              foundArt = el.getAttribute('url') || el.getAttribute('src') || el.textContent?.trim() || '';
              if (foundArt && (foundArt.startsWith('http') || foundArt.match(/\.(jpg|jpeg|png|gif)$/i))) {
                break;
              }
            }
          }
          if (titleElement) title = titleElement.textContent?.trim() || title;
          if (artistElement) artist = artistElement.textContent?.trim() || artist;
          if (foundArt) albumArt = foundArt;
          
        } catch (xmlParseError) {
          console.log('XML DOM parsing failed, trying text parsing');
        }
        
        // Method 2: Text-based parsing for space-separated format
        if (title === 'Live Stream' && xmlText.includes('WSBH')) {
          const lines = xmlText.trim().split('\n');
          const currentLine = lines.find(line => line.includes('WSBH') && (line.includes('PGM') || line.includes('AUD')));
          
          if (currentLine) {
            console.log('Found metadata line:', currentLine);
            
            const parts = currentLine.split(/\s+/);
            
            if (parts.length >= 5) {
              let startIndex = Math.max(parts.indexOf('AUD'), parts.indexOf('PGM')) + 1;
              let urlIndex = parts.findIndex((part, index) => index >= startIndex && part.includes('http'));
              
              if (urlIndex === -1) urlIndex = parts.length;
              
              const songData = parts.slice(startIndex, urlIndex);
              
              if (songData.length >= 2) {
                const midPoint = Math.ceil(songData.length / 2);
                title = songData.slice(0, midPoint).join(' ');
                artist = songData.slice(midPoint).join(' ');
                
                if (urlIndex < parts.length && parts[urlIndex].includes('http')) {
                  albumArt = parts[urlIndex];
                }
              }
            }
          }
        }
        
        // Fallback: If albumArt is still empty, try iTunes Search API
        if (!albumArt && title && artist) {
          try {
            const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist + ' ' + title)}&entity=song&limit=1`);
            if (itunesRes.ok) {
              const itunesData = await itunesRes.json();
              if (itunesData.results && itunesData.results.length > 0) {
                albumArt = itunesData.results[0].artworkUrl100 || itunesData.results[0].artworkUrl60 || '';
                if (albumArt) {
                  // Use higher-res version if available
                  albumArt = albumArt.replace('100x100bb', '300x300bb');
                }
              }
            }
          } catch (itunesErr) {
            console.warn('iTunes album art lookup failed:', itunesErr);
          }
        }
        
        console.log('Parsed metadata:', { title, artist, albumArt });
        
        setNowPlaying({
          title: title || '98.5 The Beach Live',
          artist: artist || 'Space Coast\'s Greatest Hits',
          albumArt: albumArt || '',
          duration: 0
        });
        
      } catch (error) {
        console.error('Could not fetch metadata:', error);
        setNowPlaying({
          title: '98.5 The Beach Live',
          artist: 'Space Coast\'s Greatest Hits',
        });
      }
    };

    // Fetch immediately
    fetchMetadata();
    
    // Set up interval to fetch every 8 seconds
    const interval = setInterval(fetchMetadata, 8000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize audio manager with stream element
  useEffect(() => {
    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    if (audioElement) {
      AudioManager.initializeStream(audioElement);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Stream Player - Left Side (Desktop Only) */}
      <div className="hidden lg:block fixed top-1/2 left-4 w-72 transform -translate-y-1/2 z-40">
        <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-6 border-4 border-blue-700 shadow-2xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-4">🎵 Now Playing</div>
            {nowPlaying.albumArt ? (
              <img 
                src={nowPlaying.albumArt} 
                alt="Album Art" 
                className="w-32 h-32 rounded shadow-lg border-2 border-blue-400 object-contain bg-gray-100 mx-auto mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded text-blue-400 text-4xl mx-auto mb-4">
                <span>🎵</span>
              </div>
            )}
            <div className="text-white font-bold text-lg mb-1 truncate">
              {nowPlaying.title || '98.5 The Beach Live'}
            </div>
            <div className="text-blue-200 text-sm truncate mb-2">
              {nowPlaying.artist || 'Space Coast\'s Greatest Hits'}
            </div>
            {/* Player Controls */}
            <div className="mb-3">
              <audio 
                controls 
                className="w-full h-8"
                style={{
                  backgroundColor: '#1e3a8a',
                  borderRadius: '8px',
                  filter: 'hue-rotate(200deg) saturate(120%)'
                }}
              >
                <source src="https://ice41.securenetsystems.net/WSBH" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
            {/* Space Coast Banner */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-center py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center justify-center leading-tight">
              <div>SPACE COAST&apos;S GREATEST HITS</div>
              <div>LIVE FROM MELBOURNE, FLORIDA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stream Player - Bottom (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-white to-red-600 shadow-2xl border-t-4 border-blue-700">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Station Logo & Branding */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <img 
                src="/beach.png" 
                alt="98.5 The Beach WSBH Logo" 
                className="h-8 w-auto object-contain"
              />
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-lg px-3 py-1 rounded-lg shadow-lg">
                98.5
              </div>
            </div>

            {/* Now Playing Info - Center */}
            <div className="flex items-center space-x-3 min-w-0 flex-1 justify-center">
              <div className="text-center min-w-0">
                <div className="text-red-400 text-xs font-semibold">🎵 NOW PLAYING</div>
                <div className="text-white text-sm font-bold truncate max-w-xs">
                  {nowPlaying.title || "98.5 The Beach Live"}
                </div>
              </div>
            </div>

            {/* Audio Player - Right Side */}
            <div className="flex-shrink-0 min-w-0">
              <audio 
                controls 
                className="h-8 w-48"
                style={{
                  backgroundColor: '#1e3a8a',
                  borderRadius: '8px',
                  filter: 'hue-rotate(200deg) saturate(120%)'
                }}
              >
                <source src="https://ice41.securenetsystems.net/WSBH" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>

          </div>
        </div>
        
        {/* Bottom Brand Strip */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-center py-1 text-xs font-bold">
          🌊 SPACE COAST&apos;S GREATEST HITS • LIVE FROM MELBOURNE, FLORIDA 🌊
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:pl-80 lg:pr-80 relative min-h-screen">
        {/* Right Side Static Ad - Desktop Only */}
        <div className="hidden lg:block fixed top-1/2 right-4 w-72 transform -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 border-4 border-yellow-600 shadow-2xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-4">🏖️ Sponsor Spotlight</div>
              <div className="bg-white rounded-xl p-4 mb-4">
                <img 
                  src="/marc-digital-solutions-logo-blk.png" 
                  alt="Marc Digital Solutions" 
                  className="w-full h-auto object-contain mx-auto"
                />
              </div>
              <div className="text-black font-bold mb-2">Marc Digital Solutions</div>
              <div className="text-black text-sm mb-4">Your Digital Marketing Partner</div>
              <button 
                onClick={() => handleSponsorClick('ad')}
                className="bg-white text-orange-600 font-bold py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors duration-200 shadow-lg border-2 border-orange-300 hover:border-orange-400"
              >
                🎯 Click for +50 Points & +1 Life!
              </button>
            </div>
          </div>
        </div>

        {/* Game Content */}
        {/* Intro Sequence */}
        {showIntro && (
          <GameIntroSequence
            isVisible={showIntro}
            onComplete={handleIntroComplete}
          />
        )}

        {/* Tutorial */}
        {showTutorial && (
          <GameTutorial
            isVisible={showTutorial}
            onComplete={handleTutorialComplete}
          />
        )}

        {/* Main Game Content - Only show when game has started */}
        {gameStarted && (
          <div className="flex gap-6">
            {/* Game Content */}
            <div className="flex-1">
              {/* Sponsor Banner - Clickable for engagement */}
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-yellow-600 rounded-lg p-4 mb-6 text-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleSponsorClick('ad')}
              >
                <div className="bg-white rounded p-3">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">🎯 SPONSOR AD HERE 🎯</h3>
                  <p className="text-sm text-gray-600">Click here to earn bonus points!</p>
                </div>
              </div>

              {/* Header with Logo on Left */}
              <header className="mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                  {/* Beach Logo on Left */}
                  <div className="flex justify-center md:justify-start mb-4 md:mb-0 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow-xl">
                      <img 
                        src="/WSBH-Beach-98.5.jpg"
                        alt="98.5 The Beach WSBH Logo"
                        className="h-20 w-auto"
                      />
                    </div>
                  </div>
                  
                  {/* Game Title - Centered */}
                  <div className="text-center flex-1 mx-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-beach-700 mb-2 tracking-wide">BEACH MATCH</h1>
                    <p className="text-beach-600 text-base md:text-lg font-medium">Space Coast&apos;s Greatest Match-3 Game</p>
                  </div>
                  
                  {/* Marc Digital Solutions Logo on Right */}
                  <div className="flex justify-center md:justify-end mt-4 md:mt-0 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow-xl">
                      <img 
                        src="/marc-digital-solutions-logo-blk.png"
                        alt="Marc Digital Solutions Logo"
                        className="h-20 w-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* Game Status */}
                {gameState.isGameOver && (
                  <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg p-4 mb-4 text-center">
                    <h2 className="text-xl font-bold text-red-700 flex items-center justify-center">
                      💥 GAME OVER 💥
                    </h2>
                    <p className="text-red-600 mt-1">
                      Final Score: <strong>{gameState.score.toLocaleString()}</strong> • 
                      High Score: <strong>{engagementData.highScore.toLocaleString()}</strong>
                    </p>
                    <button
                      onClick={handleNewGameWithIntro}
                      className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      🔄 New Game with Intro
                    </button>
                  </div>
                )}
              </header>

              {/* Beach Match Game */}
              <div className="mb-6">
                <BeachMatchGame
                  grid={gameState.grid}
                  selectedPiece={gameState.selectedPiece}
                  onPieceClick={handlePieceClick}
                  isProcessing={isProcessing}
                  score={gameState.score}
                  lives={gameState.lives}
                  combo={gameState.combo}
                  streamTime={gameState.streamTime}
                  hintState={gameState.hintState}
                  gameOverCountdown={gameOverCountdown} // <-- pass countdown
                  boardFlash={boardFlash} // <-- pass boardFlash
                  matchedRows={matchedRows}
                  matchedCols={matchedCols}
                  swappingPieces={swappingPieces}
                />
              </div>

              {/* Game Rules Section - moved here */}
              <div className="mt-8 bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl p-6 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">🎮 How to Play Beach Match</h2>
                  <p className="text-blue-200">Earn lives, points, and bonuses through engagement!</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Life System */}
                  <div className="bg-blue-700/50 rounded-lg p-4">
                    <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                      ❤️ Life System
                    </h3>
                    <ul className="text-blue-200 text-sm space-y-2">
                      <li>• Start with 3 lives</li>
                      <li>• Lose 1 life every 10 minutes of gameplay</li>
                      <li>• Listen to stream for 5+ minutes: +1 life</li>
                      <li>• Click sponsor ads: +1 life (+50 points)</li>
                      <li>• Watch sponsor videos: +2 lives (+100 points)</li>
                      <li>• Visit sponsor links: +1 life (+75 points)</li>
                      <li>• Correct trivia answers: +1 life (+200 points)</li>
                    </ul>
                  </div>
                  {/* Gameplay Tips */}
                  <div className="bg-blue-700/50 rounded-lg p-4">
                    <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                      🌊 Gameplay Tips
                    </h3>
                    <ul className="text-blue-200 text-sm space-y-2">
                      <li>• Match 3+ pieces in a row to score</li>
                      <li>• Special pieces create power-ups</li>
                      <li>• Wave crashes turn boats → waves (2x points)</li>
                      <li>• Answer trivia for big bonuses</li>
                      <li>• Make combos for score multipliers</li>
                      <li>• Stream time = bonus points every 5 min</li>
                      <li>• Keep playing to maintain your streak!</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-3 border-2 border-yellow-300 inline-block">
                    <p className="text-black font-bold">
                      🎵 Keep the stream playing to earn bonus lives and points! 🎵
                    </p>
                  </div>
                </div>
              </div>


            </div>

            {/* Thin Banner Ad - Right Side */}
          </div>
        )}

        {/* Stats Panel */}
        {showStats && (
          <div className="bg-white rounded-lg p-6 shadow-lg border border-beach-200 mb-6">
            <h3 className="text-lg font-bold text-beach-700 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Game Statistics
            </h3>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{engagementData.highScore.toLocaleString()}</div>
                <div className="text-sm text-gray-600">High Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{engagementData.songQuizCorrect}</div>
                <div className="text-sm text-gray-600">Songs Guessed</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{Math.floor(engagementData.streamTime / 60)}m</div>
                <div className="text-sm text-gray-600">Stream Time</div>
              </div>
            </div>

            {/* Daily Challenge */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Daily Challenge
              </h4>
              <p className="text-yellow-700 mb-2">{dailyChallenge.description}</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(dailyChallenge.progress / dailyChallenge.target) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-yellow-600">
                  {dailyChallenge.progress}/{dailyChallenge.target}
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Reward: {dailyChallenge.reward}
                {dailyChallenge.completed && <span className="ml-2">✅ Complete!</span>}
              </p>
            </div>
          </div>
        )}

        {/* Game Actions - Moved down for better spacing */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 mt-4">
          <button
            onClick={handleNewGameWithIntro}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Game</span>
          </button>
          
          <button
            onClick={pauseGame}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
          >
            {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{gameState.isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={showLeaderboardModal}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
          >
            <Info className="w-4 h-4" />
            <span>Stats</span>
          </button>
        </div>

        {/* Song Quiz Modal - Always available */}
        <SongQuizModal
          isOpen={showSongQuiz}
          question={currentSongQuestion}
          timeRemaining={songQuizTimer}
          onAnswer={handleSongQuizAnswer}
          onClose={() => handleSongQuizAnswer(-1)} // Close without answering
          showCelebration={showQuizCelebration}
        />

        {/* Wave Crash Effect */}
        <WaveCrashEffect
          isActive={showWaveCrash}
          onComplete={handleWaveCrashComplete}
        />

        {/* Leaderboard Modal */}
        <Leaderboard
          isOpen={showLeaderboard}
          onClose={hideLeaderboardModal}
          currentScore={gameState.score}
          onNameSubmit={handleLeaderboardNameSubmit}
        />

        {/* Bottom Sponsor Content Area */}
        <div className="mt-8 w-full max-w-6xl">
          <div className="bg-gradient-to-r from-blue-600 via-white to-red-600 rounded-xl p-6 shadow-2xl border-4 border-blue-700">
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-6">
              
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">🌊 Thanks to Our Sponsors! 🌊</h2>
                <p className="text-blue-200">Click sponsor content during gameplay for bonus points and lives!</p>
              </div>
              
              {/* Sponsor Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Main Sponsor - Marc Digital */}
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 text-center">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <img 
                      src="/marc-digital-solutions-logo-blk.png" 
                      alt="Marc Digital Solutions" 
                      className="w-full h-auto object-contain mx-auto"
                    />
                  </div>
                  <h3 className="text-black font-bold mb-2">Marc Digital Solutions</h3>
                  <p className="text-black text-sm mb-3">Web Development & Digital Marketing</p>
                  <button 
                    onClick={() => handleSponsorClick('link')}
                    className="bg-white text-orange-600 font-bold py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors duration-200 w-full border-2 border-orange-300"
                  >
                    Visit Website (+75 Points!)
                  </button>
                </div>

                {/* Space Coast Tourism */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-center">
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="text-white font-bold mb-2">Space Coast Tourism</h3>
                  <p className="text-blue-200 text-sm mb-3">Explore Florida&apos;s Space Coast</p>
                  <button 
                    onClick={() => handleSponsorClick('ad')}
                    className="bg-white text-purple-600 font-bold py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors duration-200 w-full"
                  >
                    Learn More (+50 Points!)
                  </button>
                </div>

                {/* Beach Activities */}
                <div className="bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl p-4 text-center">
                  <div className="text-4xl mb-3">🏖️</div>
                  <h3 className="text-white font-bold mb-2">Beach Adventures</h3>
                  <p className="text-cyan-100 text-sm mb-3">Surf, Sun & Fun Activities</p>
                  <button 
                    onClick={() => handleSponsorClick('video')}
                    className="bg-white text-teal-600 font-bold py-2 px-4 rounded-lg hover:bg-teal-50 transition-colors duration-200 w-full"
                  >
                    Watch Video (+100 Points!)
                  </button>
                </div>
                
              </div>

              {/* Bottom Call to Action */}
              <div className="mt-6 text-center">
                <div className="bg-yellow-500 rounded-lg p-4 border-2 border-yellow-400">
                  <p className="text-black font-bold text-lg mb-2">💡 Pro Tip!</p>
                  <p className="text-black">
                    Click sponsor content while playing to earn bonus points, extra lives, and power-ups! 
                    Every click helps support 98.5 The Beach! 🎵
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* Footer with website and social links */}
      <footer className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white py-6 mt-12 border-t-4 border-blue-800">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
          <div className="text-center md:text-left">
            <a href="https://beach985.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-lg hover:underline">
              98.5 The Beach &bull; beach985.com
            </a>
            <div className="text-xs text-blue-200 mt-1">&copy; {new Date().getFullYear()} Space Coast Radio</div>
          </div>
          <div className="flex items-center gap-4 justify-center">
            <a href="https://facebook.com/985thebeach" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0"/></svg>
            </a>
            <a href="https://twitter.com/985thebeach" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-blue-300 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.117 2.823 5.254a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.058 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z"/></svg>
            </a>
            <a href="https://beach985.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-pink-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.775.13 4.602.388 3.545 1.445 2.488 2.502 2.23 3.675 2.172 4.952.113 8.332 0 8.741 0 12c0 3.259.113 3.668.172 4.948.058 1.277.316 2.45 1.373 3.507 1.057 1.057 2.23 1.315 3.507 1.373C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.277-.058 2.45-.316 3.507-1.373 1.057-1.057 1.315-2.23 1.373-3.507.059-1.28.072-1.689.072-4.948s-.013-3.668-.072-4.948c-.058-1.277-.316-2.45-1.373-3.507C19.398.388 18.225.13 16.948.072 15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
} 