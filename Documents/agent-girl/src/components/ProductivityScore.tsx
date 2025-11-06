import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';

interface ProductivityScoreProps {
  score: number;
  trend: 'up' | 'down' | 'stable';
  previousScore?: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-sage-600 dark:text-sage-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreGradient = (score: number) => {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-sage-500 to-sage-600';
  if (score >= 40) return 'from-yellow-500 to-orange-600';
  return 'from-red-500 to-rose-600';
};

const getScoreLevel = (score: number) => {
  if (score >= 90) return { level: 'Exceptional', emoji: '🏆', description: 'You\'re performing at your peak!' };
  if (score >= 80) return { level: 'Excellent', emoji: '⭐', description: 'Outstanding productivity!' };
  if (score >= 70) return { level: 'Great', emoji: '🎯', description: 'You\'re doing really well!' };
  if (score >= 60) return { level: 'Good', emoji: '👍', description: 'Solid performance!' };
  if (score >= 50) return { level: 'Average', emoji: '📈', description: 'Room for improvement!' };
  if (score >= 40) return { level: 'Below Average', emoji: '📊', description: 'Focus on key areas!' };
  return { level: 'Needs Work', emoji: '🎯', description: 'Let\'s build better habits!' };
};

const CircularProgress: React.FC<{
  score: number;
  size: number;
  strokeWidth: number;
}> = ({ score, size, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={score >= 80 ? '#10b981' : score >= 60 ? '#69b491' : score >= 40 ? '#f59e0b' : '#ef4444'} />
            <stop offset="100%" stopColor={score >= 80 ? '#059669' : score >= 60 ? '#559172' : score >= 40 ? '#ea580c' : '#dc2626'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
        </div>
      </div>
    </div>
  );
};

export const ProductivityScoreComponent: React.FC<ProductivityScoreProps> = ({
  score,
  trend,
  previousScore
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreLevel = getScoreLevel(score);
  const scoreChange = previousScore ? score - previousScore : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);

    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productivity Score</h3>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">This Week</span>
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <CircularProgress score={animatedScore} size={160} strokeWidth={12} />
      </div>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">{scoreLevel.emoji}</span>
          <h4 className={`text-xl font-bold ${getScoreColor(score)}`}>
            {scoreLevel.level}
          </h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {scoreLevel.description}
        </p>
      </div>

      {previousScore && (
        <div className="flex items-center justify-center gap-3 p-3 bg-white/10 dark:bg-white/5 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${
              trend === 'up' ? 'text-green-500' :
              trend === 'down' ? 'text-red-500' :
              'text-gray-500'
            }`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {scoreChange > 0 ? '+' : ''}{scoreChange} points
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">vs last week</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="glass-button text-center py-2 text-sm font-medium text-sage-600 dark:text-sage-400">
          View Details
        </button>
        <button className="glass-button text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          Set Goals
        </button>
      </div>
    </div>
  );
};