import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User, UserCheck, X } from 'lucide-react';

interface LeaderboardEntry {
  score: number;
  name?: string;
  timestamp: number;
  id: string;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  onNameSubmit?: (name: string, score: number) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  isOpen,
  onClose,
  currentScore,
  onNameSubmit
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Load leaderboard from localStorage
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('beach-match-leaderboard');
    if (savedLeaderboard) {
      try {
        const parsed = JSON.parse(savedLeaderboard);
        setLeaderboard(parsed.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score));
      } catch (e) {
        console.error('Error loading leaderboard:', e);
      }
    }
  }, [isOpen]);

  // Check if current score is a new high score
  useEffect(() => {
    if (currentScore > 0 && leaderboard.length < 10) {
      setIsNewHighScore(true);
    } else if (currentScore > 0 && leaderboard.length >= 10) {
      const lowestScore = leaderboard[leaderboard.length - 1]?.score || 0;
      setIsNewHighScore(currentScore > lowestScore);
    }
  }, [currentScore, leaderboard]);

  const saveLeaderboard = (newLeaderboard: LeaderboardEntry[]) => {
    localStorage.setItem('beach-match-leaderboard', JSON.stringify(newLeaderboard));
    setLeaderboard(newLeaderboard);
  };

  const handleSubmitScore = (withName: boolean = false) => {
    const newEntry: LeaderboardEntry = {
      score: currentScore,
      timestamp: Date.now(),
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (withName && playerName.trim()) {
      newEntry.name = playerName.trim();
      onNameSubmit?.(playerName.trim(), currentScore);
    }

    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep only top 10

    saveLeaderboard(newLeaderboard);
    setShowNameInput(false);
    setPlayerName('');
    setIsNewHighScore(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-blue-600 font-bold">#{rank}</div>;
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl shadow-2xl border-4 border-white/20 max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* New High Score Notification */}
          {isNewHighScore && !showNameInput && (
            <div className="mb-6 bg-yellow-500 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🎉 NEW HIGH SCORE! 🎉</div>
              <div className="text-black font-bold text-xl mb-3">{formatScore(currentScore)} Points</div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowNameInput(true)}
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Add My Name to Leaderboard</span>
                </button>
                <button
                  onClick={() => handleSubmitScore(false)}
                  className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors w-full"
                >
                  Submit Anonymous Score
                </button>
              </div>
            </div>
          )}

          {/* Name Input */}
          {showNameInput && (
            <div className="mb-6 bg-white/20 rounded-lg p-4">
              <div className="text-white font-bold mb-3">Enter Your Name:</div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name here..."
                maxLength={20}
                className="w-full p-2 rounded border border-gray-300 mb-3 text-black"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSubmitScore(true)}
                  disabled={!playerName.trim()}
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex-1 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Submit with Name
                </button>
                <button
                  onClick={() => setShowNameInput(false)}
                  className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <div className="text-center text-white/70 py-8">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-white/50" />
                <p>No scores yet!</p>
                <p className="text-sm">Be the first to make the leaderboard!</p>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    index < 3 
                      ? 'bg-gradient-to-r from-yellow-400/30 to-yellow-600/30 border border-yellow-400/50' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getRankIcon(index + 1)}
                    <div>
                      <div className="text-white font-bold">
                        {entry.name ? (
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{entry.name}</span>
                          </span>
                        ) : (
                          <span className="text-white/70">Anonymous Player</span>
                        )}
                      </div>
                      <div className="text-white/60 text-sm">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">
                      {formatScore(entry.score)}
                    </div>
                    <div className="text-white/60 text-xs">points</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <div className="text-white/70 text-sm">
              🏖️ Beach Match Leaderboard • Top 10 Scores
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 