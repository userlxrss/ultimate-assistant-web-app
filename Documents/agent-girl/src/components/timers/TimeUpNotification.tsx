import React from 'react';
import { X, CheckCircle, Plus, Play } from 'lucide-react';
import { useSafeTimer } from '../../hooks/useSafeTimer';

interface TimeUpNotificationProps {
  taskName: string;
  onMarkComplete: () => void;
  onAddTime: () => void;
  onDismiss: () => void;
}

export const TimeUpNotification: React.FC<TimeUpNotificationProps> = ({
  taskName,
  onMarkComplete,
  onAddTime,
  onDismiss
}) => {
  const { timerState } = useSafeTimer();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header with time icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Time's up!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Task: <span className="font-medium">{taskName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Overtime display if applicable */}
        {timerState.hasReachedZero && timerState.overtimeTime > 0 && (
          <div className="mb-6 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900/50">
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Overtime: +{Math.floor(timerState.overtimeTime / 60000)}:{String(Math.floor((timerState.overtimeTime % 60000) / 1000)).padStart(2, '0')}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onMarkComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            <CheckCircle className="w-5 h-5" />
            ✅ Mark Complete
          </button>

          <button
            onClick={onAddTime}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            <Plus className="w-5 h-5" />
            ⏱️ Add 15 mins
          </button>

          <button
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            <Play className="w-5 h-5" />
            ▶️ Still Working
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          The timer will continue tracking in overtime mode
        </p>
      </div>
    </div>
  );
};