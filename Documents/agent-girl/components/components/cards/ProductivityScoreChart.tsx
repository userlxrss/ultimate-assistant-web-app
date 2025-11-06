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
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 55) return 'text-warning';
    return 'text-error';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-success to-emerald-600';
    if (score >= 70) return 'from-primary to-blue-600';
    if (score >= 55) return 'from-warning to-amber-600';
    return 'from-error to-red-600';
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
      <div className="space-y-6">
        {/* Current Score Card */}
        <div className="glass glass-blur-8 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">{getScoreEmoji(currentScore)}</div>
          <div className="text-sm opacity-70 mb-2">Productivity Score</div>
          <div className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
            {currentScore}
          </div>
          <div className="text-sm opacity-70 mt-1">
            {currentScore >= 85 ? 'Excellent!' :
             currentScore >= 70 ? 'Great job!' :
             currentScore >= 55 ? 'Good progress' : 'Keep improving'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass glass-blur-8 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{averageScore}</div>
            <div className="text-sm opacity-70">Avg Score</div>
          </div>
          <div className="glass glass-blur-8 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-info">{totalFocusTime}h</div>
            <div className="text-sm opacity-70">Total Focus</div>
          </div>
        </div>

        {/* Detailed Chart */}
        <div className="glass glass-blur-8 rounded-lg p-4">
          <h4 className="font-medium mb-4">Weekly Breakdown</h4>
          <div className="space-y-3">
            {productivityData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-sm opacity-70">{data.day}</div>
                <div className="flex-1">
                  <div className="bg-secondary/20 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreGradient(data.score)} rounded-full transition-all duration-500`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium">{data.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Task & Focus Summary */}
        <div className="glass glass-blur-8 rounded-lg p-4">
          <h4 className="font-medium mb-3">This Week's Activity</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Tasks Completed</span>
              <span className="font-medium">{totalTasks} tasks</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Focus Time</span>
              <span className="font-medium">{totalFocusTime} hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Daily Average</span>
              <span className="font-medium">{Math.round(totalTasks / 7)} tasks/day</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Productivity</h3>
          <p className="text-sm opacity-70">Your score today</p>
        </div>
        <div className="glass glass-blur-8 rounded-lg p-2 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Current Score */}
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">{getScoreEmoji(currentScore)}</div>
        <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
          {currentScore}
        </div>
        <div className="text-sm opacity-70">Productivity Score</div>
      </div>

      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="opacity-20"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - currentScore / 100)}`}
              className={`transition-all duration-1000 ${getScoreColor(currentScore)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{currentScore}%</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass glass-blur-8 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-primary">{averageScore}</div>
          <div className="text-xs opacity-70">Avg Score</div>
        </div>
        <div className="glass glass-blur-8 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-info">{totalFocusTime}h</div>
          <div className="text-xs opacity-70">Focus Time</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="glass-button glass-button-primary flex-1 text-sm">
          View Details
        </button>
        <button className="glass-button glass-button-secondary text-sm px-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
};