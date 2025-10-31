import React from 'react';
import { CheckCircle, Clock, Timer, Play, Pause, X, Edit2 } from 'lucide-react';
import { Task } from '../../../types/tasks';

interface PremiumTimerCardProps {
  activeTask: Task | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onStopTimer: () => void;
  onCompleteTask: (taskId: string) => void;
  onViewDetails: (task: Task) => void;
}

const PremiumTimerCard: React.FC<PremiumTimerCardProps> = ({
  activeTask,
  timerSeconds,
  isTimerRunning,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  onCompleteTask,
  onViewDetails,
}) => {
  const formatTimerDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const formatTaskDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return 'Overdue';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!activeTask) {
    return (
      <div className="relative bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Timer className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No Active Timer</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Start working on a task to begin tracking</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2">
            <Play className="w-5 h-5" />
            Start Timer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-[1.01] overflow-hidden group">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
              <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-40" />
            </div>
            <div className="px-5 py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                {isTimerRunning ? '● RUNNING' : '⏸ PAUSED'}
              </span>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={isTimerRunning ? onPauseTimer : onStartTimer}
              className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg"
              title={isTimerRunning ? "Pause" : "Start"}
            >
              {isTimerRunning ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={onStopTimer}
              className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 hover:bg-red-500/30 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Stop"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* HERO TIMER DISPLAY */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Glow effect behind timer */}
            <div className="absolute inset-0 blur-3xl bg-white/20 scale-150" />
            <div className="relative text-[84px] font-black text-white font-mono tracking-tight tabular-nums" style={{ letterSpacing: '-0.04em' }}>
              {formatTimerDisplay(timerSeconds)}
            </div>
          </div>
        </div>

        {/* Task Title */}
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-white mb-2 leading-tight">
            {activeTask.name || activeTask.title}
          </h3>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {/* Priority Badge */}
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            activeTask.priority === 'High' || activeTask.priority === 'Urgent'
              ? 'bg-red-500/20 text-red-100 border border-red-400/30'
              : activeTask.priority === 'Medium'
              ? 'bg-amber-500/20 text-amber-100 border border-amber-400/30'
              : 'bg-white/20 text-white border border-white/30'
          }`}>
            {activeTask.priority || 'Medium'} Priority
          </span>

          {/* Due Date */}
          {activeTask.dueDate && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/90 bg-white/15 backdrop-blur-md border border-white/20">
              <Clock className="w-4 h-4" />
              Due {formatTaskDate(activeTask.dueDate)}
            </span>
          )}

          {/* Estimated Time */}
          {activeTask.duration && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/90 bg-white/15 backdrop-blur-md border border-white/20">
              <Timer className="w-4 h-4" />
              {activeTask.duration}m estimated
            </span>
          )}
        </div>

        {/* Premium Progress Bar */}
        {activeTask.duration && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm font-bold text-white/80 mb-3">
              <span>Progress</span>
              <span>
                {Math.min(Math.round((timerSeconds / 60 / activeTask.duration) * 100), 100)}%
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  (timerSeconds / 60) > activeTask.duration
                    ? 'bg-gradient-to-r from-red-400 via-pink-500 to-rose-600 shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 shadow-lg shadow-green-500/50'
                }`}
                style={{
                  width: `${Math.min((timerSeconds / 60 / activeTask.duration) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onCompleteTask(activeTask.id)}
            className="px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center gap-3 group"
          >
            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Complete Task
          </button>
          <button
            onClick={() => onViewDetails(activeTask)}
            className="px-8 py-4 bg-white/20 backdrop-blur-md text-white text-lg font-bold rounded-2xl hover:bg-white/30 transition-all duration-200 border-2 border-white/30 flex items-center gap-3 hover:scale-[1.02]"
          >
            <Edit2 className="w-5 h-5" />
            View Details
          </button>
        </div>

        {/* Task Description Preview */}
        {activeTask.description && (
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-sm text-white/80 leading-relaxed text-center line-clamp-2">
              {stripHtml(activeTask.description)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumTimerCard;