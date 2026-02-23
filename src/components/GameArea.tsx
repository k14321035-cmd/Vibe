import React, { useState, useEffect } from 'react';
import { GameType, QuizQuestion, User } from '../types';
import { getSocket } from '../lib/socket';
import { Sparkles, CheckCircle, XCircle, RefreshCw, Zap, Flame, Gift } from 'lucide-react';
import AdRewarded from './AdRewarded';

interface PlayerAnswer {
  userId: string;
  username: string;
  avatarUrl?: string;
  answerIndex: number;
}

interface GameAreaProps {
  gameType: GameType;
  currentUser: User;
  onGameEnd: () => void;
}

interface TodData {
  type: 'TRUTH' | 'DARE';
  prompt: string;
}

interface QuizData extends QuizQuestion {
  category?: string;
  emoji?: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const GameArea: React.FC<GameAreaProps> = ({ gameType, currentUser, onGameEnd }) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<QuizData | null>(null);
  const [todData, setTodData] = useState<TodData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]); // All players' answers
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [rewardToast, setRewardToast] = useState(false);

  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data: { gameType: GameType; gameData?: any }) => {
      setLoading(false);
      setSelectedAnswer(null);
      setPlayerAnswers([]); // Clear all answers on new question

      if (data.gameType === GameType.QUIZ && data.gameData) {
        setQuestion(data.gameData);
        setTodData(null);
      } else if (data.gameType === GameType.TRUTH_DARE && data.gameData) {
        setTodData(data.gameData);
        setQuestion(null);
      }
    };

    const handleAnswerReceived = (data: PlayerAnswer) => {
      setPlayerAnswers(prev => {
        // Replace if player already answered, otherwise add
        const exists = prev.find(p => p.userId === data.userId);
        if (exists) return prev.map(p => p.userId === data.userId ? data : p);
        return [...prev, data];
      });
    };

    socket.on('game-started', handleGameStarted);
    socket.on('quiz-answer-received', handleAnswerReceived);
    return () => {
      socket.off('game-started', handleGameStarted);
      socket.off('quiz-answer-received', handleAnswerReceived);
    };
  }, [socket]);

  useEffect(() => {
    if (gameType === GameType.NONE) {
      setQuestion(null);
      setTodData(null);
      setSelectedAnswer(null);
      setPlayerAnswers([]);
      setScore(0);
      setStreak(0);
    }
  }, [gameType]);

  const handleNextQuestion = () => {
    if (socket) {
      setLoading(true);
      socket.emit('start-game', { gameType }, (res: any) => {
        if (!res.success) { setLoading(false); console.error("Failed to fetch next game content"); }
      });
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !question) return;
    setSelectedAnswer(index);
    setQuestionsAnswered(q => q + 1);

    // Emit to sync with other players
    socket?.emit('quiz-answer', { answerIndex: index });

    if (index === question.correctIndex) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 100 + (newStreak > 1 ? (newStreak - 1) * 25 : 0);
      setScore(s => s + points);
      if (newStreak >= 2) {
        setShowStreak(true);
        setTimeout(() => setShowStreak(false), 2000);
      }
    } else {
      setStreak(0);
    }
  };

  if (gameType === GameType.NONE) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 text-gray-400 min-h-[200px]">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Sparkles size={32} className="text-yellow-500 opacity-50" />
        </div>
        <p className="font-semibold text-gray-300">No game active yet</p>
        <p className="text-sm mt-1 text-gray-500">Start one from the game selector above!</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-xl border border-white/10 relative overflow-hidden">

      {/* Rewarded Ad modal */}
      {showRewardedAd && (
        <AdRewarded
          rewardLabel="🌟 Bonus Points x2"
          onClose={() => setShowRewardedAd(false)}
          onReward={() => {
            setScore(s => s + 200);
            setRewardToast(true);
            setTimeout(() => setRewardToast(false), 3000);
          }}
        />
      )}

      {/* Reward toast */}
      {rewardToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-green-500 text-white font-black text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce pointer-events-none">
          🎁 +200 Bonus Points!
        </div>
      )}

      {/* Streak popup */}
      {showStreak && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-orange-500 text-white font-black text-2xl px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
            <Flame size={24} /> {streak}🔥 Streak!
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm sticky top-0 z-10 border-b border-white/10">
        <h2 className="font-bold text-white flex items-center gap-2 text-sm">
          <Sparkles className="text-yellow-400" size={16} />
          {gameType === GameType.QUIZ ? 'Trivia Time' : 'Truth or Dare'}
        </h2>
        <div className="flex items-center gap-3">
          {gameType === GameType.QUIZ && (
            <div className="flex items-center gap-2 text-xs">
              {streak >= 2 && (
                <span className="flex items-center gap-1 text-orange-400 font-bold">
                  <Flame size={12} /> x{streak}
                </span>
              )}
              <span className="text-yellow-400 font-mono font-bold">{score} pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-center items-center gap-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Syncing Game Master...</span>
          </div>
        ) : (
          <>
            {/* QUIZ */}
            {gameType === GameType.QUIZ && question && (
              <div className="w-full max-w-sm">
                {/* Category badge */}
                {question.category && (
                  <div className="flex justify-center mb-4">
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-400/30">
                      {question.emoji} {question.category}
                    </span>
                  </div>
                )}

                <h3 className="text-base md:text-lg font-bold text-white text-center mb-5 leading-snug">{question.question}</h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {question.options.map((opt, idx) => {
                    let btnClass = "bg-white/5 hover:bg-white/10 border-white/10 text-gray-200";
                    let labelClass = "bg-white/10 text-gray-400";

                    // Players who picked this option
                    const choosers = playerAnswers.filter(p => p.answerIndex === idx);

                    if (selectedAnswer !== null) {
                      if (idx === question.correctIndex) {
                        btnClass = "bg-green-500/30 border-green-400 text-white shadow-lg shadow-green-500/20";
                        labelClass = "bg-green-500 text-white";
                      } else if (idx === selectedAnswer) {
                        btnClass = "bg-red-500/30 border-red-400 text-white shadow-lg shadow-red-500/20";
                        labelClass = "bg-red-500 text-white";
                      } else {
                        btnClass = "opacity-30 bg-black/20 border-white/5";
                        labelClass = "bg-gray-700 text-gray-600";
                      }
                    } else if (choosers.length > 0) {
                      // Others have voted here but we haven't answered — show subtle highlight
                      btnClass = "bg-white/5 hover:bg-white/10 border-indigo-400/30 text-gray-200";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedAnswer !== null}
                        className={`p-3 rounded-xl border text-left transition-all font-medium text-xs md:text-sm flex items-center gap-3 ${btnClass}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${labelClass}`}>
                          {OPTION_LABELS[idx]}
                        </span>
                        <span className="flex-1">{opt}</span>

                        {/* Show avatars of players who picked this option */}
                        {choosers.length > 0 && (
                          <div className="flex -space-x-1.5 shrink-0">
                            {choosers.slice(0, 4).map(p => (
                              <img
                                key={p.userId}
                                src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                                alt={p.username}
                                title={p.username}
                                className="w-5 h-5 rounded-full border-2 border-gray-900"
                              />
                            ))}
                            {choosers.length > 4 && (
                              <span className="w-5 h-5 rounded-full bg-gray-700 border-2 border-gray-900 text-[8px] flex items-center justify-center text-gray-300 font-bold">+{choosers.length - 4}</span>
                            )}
                          </div>
                        )}

                        {selectedAnswer !== null && idx === question.correctIndex && <CheckCircle size={16} className="shrink-0 text-green-400" />}
                        {selectedAnswer !== null && idx === selectedAnswer && idx !== question.correctIndex && <XCircle size={16} className="shrink-0 text-red-400" />}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div className={`mt-4 p-3 rounded-xl text-center font-bold text-sm ${selectedAnswer === question.correctIndex ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {selectedAnswer === question.correctIndex
                      ? streak >= 2 ? `🔥 ${streak} in a row! +${100 + (streak - 1) * 25} pts` : '✅ Correct! +100 pts'
                      : `❌ The answer was: ${question.options[question.correctIndex]}`
                    }
                  </div>
                )}
              </div>
            )}

            {/* TRUTH OR DARE */}
            {gameType === GameType.TRUTH_DARE && todData && (
              <div className="text-center w-full max-w-sm">
                <div className={`rounded-2xl border p-6 mb-5 shadow-2xl ${todData.type === 'TRUTH' ? 'bg-blue-500/20 border-blue-400/40 shadow-blue-500/10' : 'bg-orange-500/20 border-orange-400/40 shadow-orange-500/10'}`}>
                  <div className="text-4xl mb-3">{todData.type === 'TRUTH' ? '🔵' : '🔥'}</div>
                  <div className={`text-xs font-black uppercase tracking-widest mb-3 ${todData.type === 'TRUTH' ? 'text-blue-400' : 'text-orange-400'}`}>
                    {todData.type}
                  </div>
                  <p className="text-white font-semibold text-base leading-relaxed">{todData.prompt}</p>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="px-7 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 text-sm flex items-center gap-2 mx-auto"
                >
                  <Zap size={16} /> Spin Again
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-black/20 flex justify-center gap-3 border-t border-white/5 flex-wrap">
        {gameType === GameType.QUIZ && selectedAnswer !== null && (
          <button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/30 px-4 py-2 rounded-full transition-all"
          >
            <RefreshCw size={14} /> Next Question
          </button>
        )}
        {gameType === GameType.QUIZ && (
          <span className="text-[10px] text-gray-500 self-center">{questionsAnswered} answered</span>
        )}
        {/* Rewarded Ad button */}
        <button
          onClick={() => setShowRewardedAd(true)}
          className="flex items-center gap-1.5 text-[10px] text-yellow-400 hover:text-yellow-300 font-bold bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 px-3 py-1.5 rounded-full transition-all"
        >
          <Gift size={12} /> Watch Ad for Bonus
        </button>
        <button
          onClick={onGameEnd}
          className="text-[10px] text-gray-500 hover:text-white transition-colors underline self-center"
        >
          End Game
        </button>
      </div>
    </div>
  );
};

export default GameArea;