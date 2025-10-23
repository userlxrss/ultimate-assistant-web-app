import React from 'react';
import { X, Clock, CheckCircle, Plus, Play } from 'lucide-react';
import { Task } from '../../types/tasks';
import { useTimer } from '../../contexts/TimerContext';

interface TimeUpNotificationProps {
  task: Task;
  isVisible: boolean;
  onClose: () => void;
  onMarkComplete: () => void;
  onAddTime: (minutes: number) => void;
  onContinueWorking: () => void;
}

const TimeUpNotification: React.FC<TimeUpNotificationProps> = ({
  task,
  isVisible,
  onClose,
  onMarkComplete,
  onAddTime,
  onContinueWorking
}) => {
  const { timerState } = useTimer();

  if (!isVisible) return null;

  const handleMarkComplete = () => {
    onMarkComplete();
    onClose();
  };

  const handleAddTime = () => {
    onAddTime(15); // Add 15 minutes
    onClose();
  };

  const handleContinueWorking = () => {
    onContinueWorking();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Glassmorphism Modal */}
      <div className="relative w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 pointer-events-none" />

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Timer Icon */}
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg animate-pulse">
              <Clock className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ⏰ Time's up!
            </h2>

            {/* Task Name */}
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 px-4">
              Task: <span className="font-semibold text-gray-900 dark:text-white">{task.title}</span>
            </p>

            {/* Time Info */}
            <div className="mb-8 p-4 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/20">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estimated time: <span className="font-mono font-semibold text-gray-900 dark:text-white">{task.estimatedTime || 0}m</span>
              </p>
              {timerState.overtimeTime > 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Overtime: <span className="font-mono font-semibold">
                    +{Math.floor(timerState.overtimeTime / 60000)}:{((timerState.overtimeTime % 60000) / 1000).toFixed(0).padStart(2, '0')}
                  </span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Mark Complete Button */}
              <button
                onClick={handleMarkComplete}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <CheckCircle className="w-5 h-5" />
                Mark Complete
              </button>

              {/* Add Time Button */}
              <button
                onClick={handleAddTime}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add 15 minutes
              </button>

              {/* Continue Working Button */}
              <button
                onClick={handleContinueWorking}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/70 dark:bg-gray-700/70 hover:bg-white/90 dark:hover:bg-gray-700/90 text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 border border-white/30 dark:border-gray-600/30"
              >
                <Play className="w-5 h-5" />
                Still Working
              </button>
            </div>

            {/* Footer Text */}
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Timer will continue tracking overtime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeUpNotification;