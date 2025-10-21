import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Notification context
interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 2500,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        clearNotification(id);
      }, newNotification.duration);
    }
  };

  const showSuccess = (title: string, message?: string) => {
    showNotification({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    showNotification({ type: 'error', title, message, duration: 5000 });
  };

  const showWarning = (title: string, message?: string) => {
    showNotification({ type: 'warning', title, message, duration: 4000 });
  };

  const showInfo = (title: string, message?: string) => {
    showNotification({ type: 'info', title, message, duration: 3000 });
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      clearNotification,
      clearAllNotifications
    }}>
      {children}
      <NotificationContainer notifications={notifications} clearNotification={clearNotification} />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification container component
const NotificationContainer: React.FC<{
  notifications: Notification[];
  clearNotification: (id: string) => void;
}> = ({ notifications, clearNotification }) => {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => clearNotification(notification.id)}
          index={index}
        />
      ))}
    </div>
  );
};

// Individual notification item
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
  index: number;
}> = ({ notification, onClose, index }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          border: 'border-green-200/50 dark:border-green-800/30',
          bg: 'bg-green-50/90 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-200',
          icon: 'text-green-500 dark:text-green-400',
          button: 'hover:bg-green-100/80 dark:hover:bg-green-800/30'
        };
      case 'error':
        return {
          border: 'border-red-200/50 dark:border-red-800/30',
          bg: 'bg-red-50/90 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-500 dark:text-red-400',
          button: 'hover:bg-red-100/80 dark:hover:bg-red-800/30'
        };
      case 'warning':
        return {
          border: 'border-yellow-200/50 dark:border-yellow-800/30',
          bg: 'bg-yellow-50/90 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-500 dark:text-yellow-400',
          button: 'hover:bg-yellow-100/80 dark:hover:bg-yellow-800/30'
        };
      case 'info':
        return {
          border: 'border-blue-200/50 dark:border-blue-800/30',
          bg: 'bg-blue-50/90 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-500 dark:text-blue-400',
          button: 'hover:bg-blue-100/80 dark:hover:bg-blue-800/30'
        };
      default:
        return {
          border: 'border-gray-200/50 dark:border-gray-800/30',
          bg: 'bg-gray-50/90 dark:bg-gray-900/20',
          text: 'text-gray-800 dark:text-gray-200',
          icon: 'text-gray-500 dark:text-gray-400',
          button: 'hover:bg-gray-100/80 dark:hover:bg-gray-800/30'
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`
        pointer-events-auto
        glass-card
        ${colors.border}
        ${colors.bg}
        rounded-2xl
        p-4
        min-w-[320px]
        max-w-[400px]
        backdrop-blur-xl
        shadow-2xl
        transform
        transition-all
        duration-500
        ease-out
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
      style={{
        animationDelay: `${index * 100}ms`,
        marginBottom: `${index * 8}px`
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${colors.text}`}>
            {notification.title}
          </div>
          {notification.message && (
            <div className={`text-sm ${colors.text} opacity-80 mt-1`}>
              {notification.message}
            </div>
          )}

          {/* Action button */}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className={`
                mt-2
                px-3
                py-1
                text-sm
                rounded-lg
                ${colors.button}
                ${colors.text}
                transition-colors
                duration-200
              `}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            flex-shrink-0
            p-1
            rounded-lg
            ${colors.button}
            ${colors.icon}
            transition-colors
            duration-200
          `}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="mt-3">
          <div className={`w-full h-1 ${colors.icon} ${colors.bg} rounded-full overflow-hidden`}>
            <div
              className="h-full bg-current opacity-60 rounded-full"
              style={{
                animation: `shrink ${notification.duration}ms linear`,
                animationFillMode: 'forwards'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Custom styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
if (!document.head.querySelector('style[data-notification-animations]')) {
  style.setAttribute('data-notification-animations', 'true');
  document.head.appendChild(style);
}