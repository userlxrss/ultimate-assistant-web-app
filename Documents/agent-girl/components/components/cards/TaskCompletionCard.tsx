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
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-error';
    return 'text-secondary';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  return (
    <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Task Completion</h3>
          <p className="text-sm opacity-70">Today's progress</p>
        </div>
        <div className="glass glass-blur-8 rounded-lg p-2 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* Main Stats */}
      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold mr-2">{taskStats.completed}</span>
          <span className="text-lg opacity-70">/ {taskStats.total}</span>
        </div>
        <div className="text-sm opacity-70 mt-1">
          {taskStats.todayCompleted} completed today
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-secondary/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${taskStats.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>{taskStats.percentage}% complete</span>
          <span>{taskStats.total - taskStats.completed} remaining</span>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="flex items-center justify-between pt-4 border-t border-light/50">
        <span className="text-sm opacity-70">Weekly trend</span>
        <div className={`flex items-center ${getTrendColor(taskStats.weeklyTrend)}`}>
          <span className="mr-1">{getTrendIcon(taskStats.weeklyTrend)}</span>
          <span className="font-semibold">{Math.abs(taskStats.weeklyTrend)}%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <button className="glass-button glass-button-primary flex-1 text-sm">
          View Tasks
        </button>
        <button className="glass-button glass-button-secondary text-sm px-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};