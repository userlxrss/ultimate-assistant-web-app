import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Plus, Play, Clock, ChevronRight } from 'lucide-react';
import { Task } from '../../types/tasks';
import { useTimer } from '../../contexts/TimerContext';
import { useTheme } from '../../contexts/ThemeContext';
import { forceCloseAllModals } from '../../utils/emergencyModalClose';

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
  const { timerState, resetTimeUpNotification } = useTimer();
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  // Auto-force close after 5 minutes as emergency failsafe
  useEffect(() => {
    if (isVisible) {
      closeTimeoutRef.current = setTimeout(() => {
        console.warn('Timer notification auto-closed after 5 minutes (emergency failsafe)');
        handleForceClose();
      }, 5 * 60 * 1000);

      return () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }
  }, [isVisible]);

  // Multiple close handlers for maximum reliability
  const handleSafeClose = () => {
    try {
      if (isAnimatingOut) return;

      setIsAnimatingOut(true);

      // Reset timer state immediately
      resetTimeUpNotification();

      // Clear any pending timeouts
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      // Call the provided close handler after animation
      setTimeout(() => {
        onClose();
        setIsAnimatingOut(false);
      }, 200);
    } catch (error) {
      console.error('Error closing timer notification:', error);
      // Fallback: force close even if there's an error
      try {
        onClose();
      } catch (fallbackError) {
        console.error('Fallback close also failed:', fallbackError);
      }
    }
  };

  const handleForceClose = () => {
    console.log('Force closing timer notification');
    handleSafeClose();
  };

  const handleMarkComplete = () => {
    try {
      onMarkComplete();
      handleSafeClose();
    } catch (error) {
      console.error('Error in mark complete:', error);
      handleSafeClose();
    }
  };

  const handleAddTime = () => {
    try {
      onAddTime(15);
      handleSafeClose();
    } catch (error) {
      console.error('Error in add time:', error);
      handleSafeClose();
    }
  };

  const handleContinueWorking = () => {
    try {
      onContinueWorking();
      handleSafeClose();
    } catch (error) {
      console.error('Error in continue working:', error);
      handleSafeClose();
    }
  };

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && !isAnimatingOut) {
        e.preventDefault();
        e.stopPropagation();
        handleSafeClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isVisible, isAnimatingOut]);

  // Multiple click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isVisible && !isAnimatingOut) {
        handleSafeClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, isAnimatingOut]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      return () => {
        document.body.style.overflow = 'unset';
        document.body.classList.remove('modal-open');
      };
    }
  }, [isVisible]);

  // Listen for global emergency close event
  useEffect(() => {
    const handleEmergencyClose = (e: CustomEvent) => {
      console.log('Emergency close event received in TimeUpNotification:', e.detail);
      if (isVisible) {
        handleForceClose();
      }
    };

    if (isVisible) {
      document.addEventListener('emergencyModalClose', handleEmergencyClose as EventListener);
      return () => {
        document.removeEventListener('emergencyModalClose', handleEmergencyClose as EventListener);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const formatOvertime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const actionButtons = [
    {
      id: 'complete',
      label: 'Mark Complete',
      icon: CheckCircle,
      onClick: handleMarkComplete,
      gradient: theme === 'dark'
        ? 'from-emerald-600 via-green-600 to-emerald-600'
        : 'from-emerald-500 via-green-500 to-emerald-500',
      hoverGradient: theme === 'dark'
        ? 'from-emerald-500 via-green-500 to-emerald-500'
        : 'from-emerald-600 via-green-600 to-emerald-600',
      textColor: 'text-white'
    },
    {
      id: 'addTime',
      label: 'Add 15 minutes',
      icon: Plus,
      onClick: handleAddTime,
      gradient: theme === 'dark'
        ? 'from-blue-600 via-indigo-600 to-blue-600'
        : 'from-blue-500 via-indigo-500 to-blue-500',
      hoverGradient: theme === 'dark'
        ? 'from-blue-500 via-indigo-500 to-blue-500'
        : 'from-blue-600 via-indigo-600 to-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'continue',
      label: 'Continue Working',
      icon: Play,
      onClick: handleContinueWorking,
      gradient: theme === 'dark'
        ? 'from-gray-700 via-gray-600 to-gray-700'
        : 'from-gray-100 via-white to-gray-100',
      hoverGradient: theme === 'dark'
        ? 'from-gray-600 via-gray-500 to-gray-600'
        : 'from-gray-200 via-gray-50 to-gray-200',
      textColor: theme === 'dark' ? 'text-gray-200' : 'text-gray-700',
      border: theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
    }
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-300 ${
      isAnimatingOut ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Sophisticated Backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90'
            : 'bg-gradient-to-br from-slate-50/90 via-white/95 to-slate-50/90'
        } backdrop-blur-sm`}
        onClick={handleSafeClose}
      />

      {/* Premium Modal Container */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg transform transition-all duration-300 ${
          isAnimatingOut ? 'scale-95 translate-y-4 opacity-0' : 'scale-100 translate-y-0 opacity-100'
        }`}
      >
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50'
            : 'bg-gradient-to-br from-white/95 to-slate-50/95 border border-slate-200/50'
        } backdrop-blur-xl`}>

          {/* Sophisticated Top Accent */}
          <div className={`h-1 w-full transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500'
              : 'bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400'
          }`} />

          {/* Close Button */}
          <button
            onClick={handleSafeClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
            aria-label="Close notification"
            title="Close (ESC)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Premium Content */}
          <div className="p-8">
            {/* Elegant Timer Icon */}
            <div className="flex justify-center mb-8">
              <div className={`relative transition-all duration-500 ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                  : 'bg-gradient-to-br from-amber-400/20 to-orange-400/20'
              } rounded-3xl p-6 shadow-lg`}>
                <div className={`absolute inset-0 rounded-3xl transition-all duration-1000 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 animate-pulse'
                    : 'bg-gradient-to-br from-amber-400/30 to-orange-400/30 animate-pulse'
                } blur-xl`} />
                <Clock className={`relative w-10 h-10 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                }`} />
              </div>
            </div>

            {/* Elegant Typography */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-light mb-3 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Timer Complete
              </h2>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Your focus session has ended
              </p>
            </div>

            {/* Task Information Card */}
            <div className={`mb-8 p-6 rounded-2xl transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-slate-800/50 border border-slate-700/30'
                : 'bg-slate-50/50 border border-slate-200/30'
            } backdrop-blur-sm`}>
              <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {task.title}
              </h3>
              <div className={`space-y-2 text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span>Estimated time</span>
                  <span className={`font-mono font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {task.estimatedTime || 0}m
                  </span>
                </div>
                {timerState.overtimeTime > 0 && (
                  <div className={`flex items-center justify-between pt-2 border-t transition-colors duration-300 ${
                    theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <span>Overtime</span>
                    <span className={`font-mono font-medium transition-colors duration-300 ${
                      theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}>
                      +{formatOvertime(timerState.overtimeTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Action Buttons */}
            <div className="space-y-3">
              {actionButtons.map((button) => (
                <button
                  key={button.id}
                  onClick={button.onClick}
                  onMouseEnter={() => setHoveredAction(button.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className={`group relative w-full flex items-center justify-between px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                    button.border ? `border ${button.border}` : ''
                  } ${
                    theme === 'dark' && button.id === 'continue'
                      ? 'hover:shadow-lg hover:shadow-black/20'
                      : theme !== 'dark' && button.id === 'continue'
                      ? 'hover:shadow-lg hover:shadow-slate-200/50'
                      : 'hover:shadow-lg hover:shadow-current/20'
                  }`}
                  style={{
                    background: hoveredAction === button.id
                      ? `linear-gradient(135deg, ${button.hoverGradient.replace('from-', '').replace(' via-', ', ').replace(' to-', ', ')})`
                      : `linear-gradient(135deg, ${button.gradient.replace('from-', '').replace(' via-', ', ').replace(' to-', ', ')})`,
                  }}
                >
                  <span className={`flex items-center gap-3 ${button.textColor}`}>
                    <button.icon className="w-5 h-5" />
                    <span>{button.label}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                    button.textColor
                  } ${hoveredAction === button.id ? 'translate-x-1' : ''}`} />
                </button>
              ))}
            </div>

            {/* Subtle Footer */}
            <div className={`mt-8 text-center text-xs transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Press ESC or click outside to dismiss
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeUpNotification;