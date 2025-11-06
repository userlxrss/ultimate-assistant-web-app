import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, LogOut, Activity, Zap } from 'lucide-react';
import {
  emergencyRecovery,
  performEmergencySignOut,
  performHealthCheck,
  clearAllTimers,
  forceThemeOverride
} from '../utils/criticalFixes';

interface HealthStatus {
  healthy: boolean;
  issues: string[];
  timestamp: string;
}

const EmergencyRecovery: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  // Auto health check every 30 seconds
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const interval = setInterval(() => {
      const health = performHealthCheck();
      setHealthStatus(health);

      // Auto-recover if critical issues detected
      if (!health.healthy && health.issues.some(issue => issue.includes('memory') || issue.includes('timers'))) {
        console.warn('🚨 Critical issues detected, initiating auto-recovery');
        handleEmergencyRecovery();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoCheckEnabled]);

  // Initial health check
  useEffect(() => {
    const health = performHealthCheck();
    setHealthStatus(health);
  }, []);

  const handleEmergencyRecovery = async () => {
    setIsRecovering(true);
    try {
      const success = emergencyRecovery();
      if (success) {
        // Refresh health status after recovery
        setTimeout(() => {
          const health = performHealthCheck();
          setHealthStatus(health);
        }, 2000);
      }
    } catch (error) {
      console.error('Emergency recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleEmergencySignOut = () => {
    if (window.confirm('Are you sure you want to sign out? This will clear all local data.')) {
      performEmergencySignOut();
    }
  };

  const handleThemeReset = (theme: 'light' | 'dark') => {
    forceThemeOverride(theme);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleTimerCleanup = () => {
    clearAllTimers();
    setTimeout(() => {
      const health = performHealthCheck();
      setHealthStatus(health);
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Emergency Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative p-3 rounded-full shadow-lg transition-all duration-300
          ${healthStatus?.healthy
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-red-500 hover:bg-red-600 animate-pulse'
          }
          text-white
        `}
        title={healthStatus?.healthy ? 'System Healthy' : 'System Issues Detected'}
      >
        {healthStatus?.healthy ? (
          <Activity className="w-5 h-5" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}

        {!healthStatus?.healthy && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Emergency Recovery
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {/* Health Status */}
          {healthStatus && (
            <div className={`
              p-3 rounded-lg mb-4
              ${healthStatus.healthy
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }
            `}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`
                  w-2 h-2 rounded-full
                  ${healthStatus.healthy ? 'bg-green-500' : 'bg-red-500'}
                `} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {healthStatus.healthy ? 'System Healthy' : 'Issues Detected'}
                </span>
              </div>

              {!healthStatus.healthy && healthStatus.issues.length > 0 && (
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                  {healthStatus.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Last check: {new Date(healthStatus.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Recovery Actions */}
          <div className="space-y-2">
            <button
              onClick={handleEmergencyRecovery}
              disabled={isRecovering}
              className="w-full flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />
              {isRecovering ? 'Recovering...' : 'Emergency Recovery'}
            </button>

            <button
              onClick={handleTimerCleanup}
              className="w-full flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Timers
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleThemeReset('light')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm"
              >
                Light Theme
              </button>
              <button
                onClick={() => handleThemeReset('dark')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm"
              >
                Dark Theme
              </button>
            </div>

            <button
              onClick={handleEmergencySignOut}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Emergency Sign Out
            </button>
          </div>

          {/* Auto Check Toggle */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="autoCheck"
              checked={autoCheckEnabled}
              onChange={(e) => setAutoCheckEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoCheck" className="text-sm text-gray-600 dark:text-gray-400">
              Auto health check (30s)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyRecovery;