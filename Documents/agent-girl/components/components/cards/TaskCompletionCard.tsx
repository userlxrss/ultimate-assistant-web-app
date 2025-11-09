import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../index';

export const TaskCompletionCard: React.FC = () => {
  const { theme } = useTheme();
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
    todayCompleted: 0,
    weeklyTrend: 0,
  });

  useEffect(() => {
    // Simulate fetching task data
    const completed = 12;
    const total = 18;
    setTaskStats({
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      todayCompleted: 5,
      weeklyTrend: 15, // percentage increase
    });
  }, []);

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  return (
    <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-blue h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="premium-text-primary premium-heading-3">Task Completion</h3>
          <p className="premium-text-muted text-sm">Today's progress</p>
        </div>
        <div className="premium-icon-bg-green p-3 rounded-xl premium-hover-lift">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* Main Stats */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold premium-text-primary mr-2">{taskStats.completed}</span>
          <span className="text-xl premium-text-muted">/ {taskStats.total}</span>
        </div>
        <div className="premium-text-tiny mt-2">
          {taskStats.todayCompleted} completed today
        </div>
      </div>

      {/* Premium Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${taskStats.percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between premium-text-tiny mt-2">
          <span>{taskStats.percentage}% complete</span>
          <span>{taskStats.total - taskStats.completed} remaining</span>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="flex items-center justify-between pt-4 border-t premium-border-subtle">
        <span className="premium-text-muted text-sm">Weekly trend</span>
        <div className={`flex items-center ${getTrendColor(taskStats.weeklyTrend)}`}>
          <span className="mr-2 text-lg">{getTrendIcon(taskStats.weeklyTrend)}</span>
          <span className="font-bold premium-text-primary">{Math.abs(taskStats.weeklyTrend)}%</span>
        </div>
      </div>

      {/* Premium Quick Actions */}
      <div className="mt-6 flex gap-3">
        <button className="premium-button flex-1 text-sm premium-hover-glow">
          View Tasks
        </button>
        <button className="premium-button-secondary text-sm premium-padding-md premium-rounded-xl premium-hover-lift">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};