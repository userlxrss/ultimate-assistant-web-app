import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../index';

interface ProductivityData {
  day: string;
  score: number;
  focusTime: number;
  tasksCompleted: number;
}

interface ProductivityScoreChartProps {
  detailed?: boolean;
}

export const ProductivityScoreChart: React.FC<ProductivityScoreChartProps> = ({ detailed = false }) => {
  const { theme } = useTheme();
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([]);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    // Generate sample productivity data
    const days = detailed ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({
      day,
      score: Math.floor(Math.random() * 30) + 60, // 60-90 range
      focusTime: Math.floor(Math.random() * 4) + 3, // 3-7 hours
      tasksCompleted: Math.floor(Math.random() * 8) + 4, // 4-12 tasks
    }));
    setProductivityData(data);
    setCurrentScore(data[data.length - 1]?.score || 0);
  }, [detailed]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 55) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (score >= 70) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    if (score >= 55) return 'bg-gradient-to-r from-amber-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-pink-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 85) return '🚀';
    if (score >= 70) return '⭐';
    if (score >= 55) return '📈';
    return '💪';
  };

  const averageScore = Math.round(
    productivityData.reduce((sum, day) => sum + day.score, 0) / productivityData.length
  );

  const totalFocusTime = productivityData.reduce((sum, day) => sum + day.focusTime, 0);
  const totalTasks = productivityData.reduce((sum, day) => sum + day.tasksCompleted, 0);

  if (detailed) {
    return (
      <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-purple">
        <h3 className="premium-text-primary premium-heading-3 mb-6">Productivity Analysis</h3>

        {/* Current Score Card */}
        <div className="premium-glass-card premium-padding-md text-center mb-6">
          <div className="text-5xl mb-3">{getScoreEmoji(currentScore)}</div>
          <div className="premium-text-tiny mb-2">Productivity Score</div>
          <div className={`text-5xl font-bold premium-text-primary mb-2 ${getScoreColor(currentScore)}`}>
            {currentScore}
          </div>
          <div className="premium-text-tiny">
            {currentScore >= 85 ? 'Excellent performance!' :
             currentScore >= 70 ? 'Great job!' :
             currentScore >= 55 ? 'Good progress' : 'Keep improving'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="premium-glass-card premium-padding-md text-center">
            <div className="text-3xl font-bold premium-text-primary">{averageScore}</div>
            <div className="premium-text-tiny">Weekly Average</div>
          </div>
          <div className="premium-glass-card premium-padding-md text-center">
            <div className="text-3xl font-bold premium-text-primary">{totalFocusTime}h</div>
            <div className="premium-text-tiny">Total Focus Time</div>
          </div>
        </div>

        {/* Enhanced Chart */}
        <div className="premium-glass-card premium-padding-md mb-6">
          <h4 className="premium-text-secondary font-medium mb-4">Weekly Performance</h4>
          <div className="space-y-3">
            {productivityData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 premium-text-tiny text-sm">{data.day}</div>
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-full h-6 overflow-hidden backdrop-blur-sm">
                    <div
                      className={`h-full ${getScoreGradient(data.score)} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                      style={{ width: `${data.score}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="premium-text-primary font-bold">{data.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Task & Focus Summary */}
        <div className="premium-glass-card premium-padding-md">
          <h4 className="premium-text-secondary font-medium mb-4">This Week's Activity</h4>
          <div className="space-y-3">
            <div className="flex justify-between premium-text-secondary">
              <span className="premium-text-tiny">Tasks Completed</span>
              <span className="font-medium premium-text-primary">{totalTasks} tasks</span>
            </div>
            <div className="flex justify-between premium-text-secondary">
              <span className="premium-text-tiny">Focus Time</span>
              <span className="font-medium premium-text-primary">{totalFocusTime} hours</span>
            </div>
            <div className="flex justify-between premium-text-secondary">
              <span className="premium-text-tiny">Daily Average</span>
              <span className="font-medium premium-text-primary">{Math.round(totalTasks / 7)} tasks/day</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-purple h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="premium-text-primary premium-heading-3">Productivity</h3>
          <p className="premium-text-muted text-sm">Your score today</p>
        </div>
        <div className="premium-icon-bg-pink p-3 rounded-xl premium-hover-lift">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Current Score */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{getScoreEmoji(currentScore)}</div>
        <div className={`text-3xl font-bold premium-text-primary mb-2 ${getScoreColor(currentScore)}`}>
          {currentScore}
        </div>
        <div className="premium-text-tiny">Productivity Score</div>
      </div>

      {/* Premium Circular Progress */}
      <div className="flex justify-center mb-6">
        <div className="relative w-28 h-28">
          <svg className="transform -rotate-90 w-28 h-28">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-600 opacity-30"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 48}`}
              strokeDashoffset={`${2 * Math.PI * 48 * (1 - currentScore / 100)}`}
              className="transition-all duration-1000"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={currentScore >= 85 ? '#10b981' : currentScore >= 70 ? '#3b82f6' : currentScore >= 55 ? '#f59e0b' : '#ef4444'} />
                <stop offset="100%" stopColor={currentScore >= 85 ? '#059669' : currentScore >= 70 ? '#2563eb' : currentScore >= 55 ? '#d97706' : '#dc2626'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold premium-text-primary">{currentScore}%</span>
          </div>
        </div>
      </div>

      {/* Premium Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="premium-glass-card premium-padding-md text-center">
          <div className="text-xl font-bold premium-text-primary">{averageScore}</div>
          <div className="premium-text-tiny">Avg Score</div>
        </div>
        <div className="premium-glass-card premium-padding-md text-center">
          <div className="text-xl font-bold premium-text-primary">{totalFocusTime}h</div>
          <div className="premium-text-tiny">Focus Time</div>
        </div>
      </div>

      {/* Premium Quick Actions */}
      <div className="flex gap-3">
        <button className="premium-button flex-1 text-sm premium-hover-glow">
          View Details
        </button>
        <button className="premium-button-secondary text-sm premium-padding-md premium-rounded-xl premium-hover-lift">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
};