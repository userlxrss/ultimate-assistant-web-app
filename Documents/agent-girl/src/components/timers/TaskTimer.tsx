import React, { useState } from 'react';
import { Play, Pause, Plus, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { useSafeTimer } from '../../hooks/useSafeTimer';
import { Task } from '../../types/tasks';
import { formatTimerDisplay } from '../../utils/timerUtils';

interface TaskTimerProps {
  task: Task;
  className?: string;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task, className = '' }) => {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, addTimeToTimer } = useSafeTimer();
  const [isHovered, setIsHovered] = useState(false);

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
        const minutes = Math.floor(hasDuration / 60);
        const seconds = String(hasDuration % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
      }
      return '--:--';
    }

    // Show active timer display
    if (timerState.hasReachedZero) {
      return `+${formatTimerDisplay(timerState.overtimeTime, true)}`;
    }

    const remainingTime = (timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime;
    return formatTimerDisplay(remainingTime);
  };

  const getTimerState = () => {
    if (!isActiveTask) {
      return {
        status: 'INACTIVE',
        statusBg: 'bg-gray-50',
        statusText: 'text-gray-600',
        statusBorder: 'border-gray-200',
        timerText: 'text-slate-800',
        buttonBg: 'bg-white',
        buttonHover: 'hover:bg-slate-50',
        buttonText: 'text-slate-600'
      };
    }

    if (isPaused) {
      return {
        status: 'PAUSED',
        statusBg: 'bg-amber-50',
        statusText: 'text-amber-700',
        statusBorder: 'border-amber-200',
        timerText: 'text-amber-800',
        buttonBg: 'bg-amber-500',
        buttonHover: 'hover:bg-amber-600',
        buttonText: 'text-white'
      };
    }

    if (timerState.hasReachedZero) {
      return {
        status: 'OVERTIME',
        statusBg: 'bg-red-50',
        statusText: 'text-red-700',
        statusBorder: 'border-red-200',
        timerText: 'text-red-700',
        buttonBg: 'bg-red-500',
        buttonHover: 'hover:bg-red-600',
        buttonText: 'text-white'
      };
    }

    return {
      status: 'ACTIVE',
      statusBg: 'bg-emerald-50',
      statusText: 'text-emerald-700',
      statusBorder: 'border-emerald-200',
      timerText: 'text-emerald-800',
      buttonBg: 'bg-emerald-500',
      buttonHover: 'hover:bg-emerald-600',
      buttonText: 'text-white'
    };
  };

  const state = getTimerState();

  const handleTimerAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasDuration) {
      return;
    }

    if (!isActiveTask) {
      startTimer(task);
    } else if (isRunning) {
      pauseTimer();
    } else if (isPaused) {
      resumeTimer();
    }
  };

  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopTimer();
  };

  const handleAddTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    addTimeToTimer(15);
  };

  // Premium no-duration state
  if (!hasDuration && !isActiveTask) {
    return (
      <div
        className={`relative group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02]">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 pointer-events-none" />

          {/* Inner shadow for depth */}
          <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />

          <div className="relative p-8 flex flex-col items-center justify-center min-h-[160px]">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-4 transition-all duration-300 group-hover:scale-110">
              <TimerIcon className="w-5 h-5 text-gray-400" />
            </div>

            <div className="text-[28px] font-mono font-semibold text-slate-700 tracking-[-0.02em] tabular-nums mb-2">
              --:--
            </div>

            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Set Duration
            </div>

            <div className="mt-3 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              ⚠️ No time set
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02]">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-purple-50/20 pointer-events-none" />

        {/* Inner shadow for depth */}
        <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />

        {/* Status indicator dot - animated when running */}
        {isRunning && (
          <div className="absolute top-4 left-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" />
        )}

        <div className="relative p-8">
          {/* Header with status badge */}
          <div className="flex items-center justify-between mb-6">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${state.statusBg} ${state.statusText} ${state.statusBorder} border transition-all duration-300 ${isRunning ? 'animate-pulse' : ''}`}>
              {state.status}
            </div>

            {/* Subtle close button */}
            {isActiveTask && (
              <button
                onClick={handleStopTimer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 hover:scale-110"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={`text-[42px] font-mono font-semibold ${state.timerText} tracking-[-0.02em] tabular-nums transition-all duration-300 ${isHovered ? 'scale-[1.05]' : ''}`}>
              {getTimerDisplay()}
            </div>

            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-2 opacity-70">
              Timer {isActiveTask ? 'Active' : 'Inactive'}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            {/* Add time button - only show when active */}
            {isActiveTask && (
              <button
                onClick={handleAddTime}
                className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                title="Add 15 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Primary action button */}
            <button
              onClick={handleTimerAction}
              className={`w-12 h-12 rounded-xl ${state.buttonBg} ${state.buttonHover} ${state.buttonText} shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center group`}
              title={isActiveTask ? (isRunning ? 'Pause timer' : 'Resume timer') : 'Start timer'}
            >
              {isActiveTask ? (
                isRunning ? (
                  <Pause className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                ) : (
                  <Play className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                )
              ) : (
                <Play className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>

            {/* Reset button - only show when active */}
            {isActiveTask && (
              <button
                onClick={handleStopTimer}
                className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Subtle border accent */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
    </div>
  );
};

export default TaskTimer;