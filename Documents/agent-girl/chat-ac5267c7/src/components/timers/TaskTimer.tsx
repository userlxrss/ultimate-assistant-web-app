import React from 'react';
import { Play, Pause, Square, Timer as TimerIcon } from 'lucide-react';
import { useSafeTimer } from '../../hooks/useSafeTimer';
import { Task } from '../../types/tasks';
import { formatTimerDisplay } from '../../utils/timerUtils';

interface TaskTimerProps {
  task: Task;
  className?: string;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task, className = '' }) => {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer } = useSafeTimer();

  // Check if this task has an active timer
  const isActiveTask = timerState.taskId === task.id;
  const isRunning = isActiveTask && timerState.isRunning && !timerState.isPaused;
  const isPaused = isActiveTask && timerState.isPaused;
  const hasDuration = task.estimatedTime || task.duration;

  // Get timer display format
  const getTimerDisplay = () => {
    if (!isActiveTask) {
      // Show estimated duration if available
      if (hasDuration) {
        return `⏱️ ${Math.floor(hasDuration / 60)}:${String(hasDuration % 60).padStart(2, '0')}`;
      }
      return '⚠️ Set duration';
    }

    // Show active timer display
    return formatTimerDisplay(timerState);
  };

  const getTimerColor = () => {
    if (!isActiveTask) return 'text-gray-500';
    if (isPaused) return 'text-yellow-500';
    if (timerState.hasReachedZero) return 'text-orange-500';
    return 'text-sage-600 dark:text-sage-400';
  };

  const getTimerBgColor = () => {
    if (!isActiveTask) return 'bg-gray-100 dark:bg-gray-800';
    if (isPaused) return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50';
    if (timerState.hasReachedZero) return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50';
    return 'bg-sage-50 dark:bg-sage-950/30 border-sage-200 dark:border-sage-900/50';
  };

  const handleTimerAction = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening task modal

    if (!hasDuration) {
      return; // Can't start timer without duration
    }

    if (!isActiveTask) {
      // Start timer for this task
      startTimer(task);
    } else if (isRunning) {
      // Pause the timer
      pauseTimer();
    } else if (isPaused) {
      // Resume the timer
      resumeTimer();
    }
  };

  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopTimer();
  };

  if (!hasDuration && !isActiveTask) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getTimerBgColor()} ${getTimerColor()} ${className}`}>
        <TimerIcon className="w-3 h-3" />
        <span>⚠️ Set duration</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getTimerBgColor()} ${getTimerColor()} ${className}`}>
      <button
        onClick={handleTimerAction}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        title={isActiveTask ? (isRunning ? 'Pause timer' : 'Start/Resume timer') : 'Start timer'}
      >
        {isActiveTask ? (
          isRunning ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )
        ) : (
          <TimerIcon className="w-3 h-3" />
        )}
        <span className="font-mono">
          {getTimerDisplay()}
        </span>
      </button>

      {isActiveTask && (
        <button
          onClick={handleStopTimer}
          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
          title="Stop timer"
        >
          <Square className="w-3 h-3" />
        </button>
      )}

      {isActiveTask && (
        <span className="ml-1 text-xs opacity-75">
          {isRunning ? 'ACTIVE' : isPaused ? 'PAUSED' : 'STOPPED'}
        </span>
      )}
    </div>
  );
};