import React from 'react';
import { Flame, Target } from 'lucide-react';
import { useSafeTimer } from '../../hooks/useSafeTimer';

export const DailyFocusCounter: React.FC = () => {
  const { timerState } = useSafeTimer();

  // Calculate today's focus time (this would normally come from timerStats context)
  const getTodayFocusTime = () => {
    // For now, we'll simulate this. In a real implementation, this would come from timerStats
    const baseFocusTime = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const currentTaskTime = timerState.isRunning && !timerState.isPaused
      ? (Date.now() - timerState.startTime! - timerState.pausedTime)
      : 0;

    return baseFocusTime + currentTaskTime;
  };

  const formatFocusTime = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const focusTime = getTodayFocusTime();

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-4 mb-6 border border-orange-200 dark:border-orange-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="w-6 h-6 text-orange-500" />
            {timerState.isRunning && !timerState.isPaused && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Daily Focus
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🔥 {formatFocusTime(focusTime)}
            </p>
          </div>
        </div>

        {timerState.isRunning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Active Timer
            </span>
          </div>
        )}
      </div>

      {/* Progress bar for daily goal */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Daily Goal: 4 hours</span>
          <span>{Math.round((focusTime / (4 * 60 * 60 * 1000)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((focusTime / (4 * 60 * 60 * 1000)) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};