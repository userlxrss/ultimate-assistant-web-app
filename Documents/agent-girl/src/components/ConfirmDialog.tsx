import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-red-200/50 dark:border-red-800/30',
          bg: 'bg-red-50/95 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-500 dark:text-red-400',
          button: {
            confirm: 'bg-red-500 hover:bg-red-600 text-white',
            cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
          }
        };
      case 'warning':
        return {
          border: 'border-yellow-200/50 dark:border-yellow-800/30',
          bg: 'bg-yellow-50/95 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-500 dark:text-yellow-400',
          button: {
            confirm: 'bg-yellow-500 hover:bg-yellow-600 text-white',
            cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
          }
        };
      default:
        return {
          border: 'border-blue-200/50 dark:border-blue-800/30',
          bg: 'bg-blue-50/95 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-emerald-500 dark:text-emerald-400',
          button: {
            confirm: 'bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white',
            cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
          }
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className={`relative glass-card rounded-2xl p-6 max-w-md w-full ${colors.border} ${colors.bg} shadow-2xl animate-fade-in`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${colors.bg} ${colors.icon}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${colors.text}`}>
                {title}
              </h3>
              <p className={`text-sm ${colors.text} opacity-80 mt-1`}>
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-1 rounded-lg transition-colors duration-200 ${colors.icon} hover:bg-white/20`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${colors.button.cancel}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${colors.button.confirm} font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;