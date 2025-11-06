import React, { useState, useEffect } from 'react';
import { Mail, Calendar, CheckCircle, AlertCircle, XCircle, LogOut, Settings } from 'lucide-react';
import { authManager } from '../utils/authManager';

interface AuthStatusIndicatorProps {
  onGmailDisconnect?: () => void;
  onMotionDisconnect?: () => void;
  onGoogleDisconnect?: () => void;
}

export const AuthStatusIndicator: React.FC<AuthStatusIndicatorProps> = ({
  onGmailDisconnect,
  onMotionDisconnect,
  onGoogleDisconnect
}) => {
  const [authStatus, setAuthStatus] = useState({
    gmail: false,
    motion: false,
    google: false,
    totalConnections: 0
  });
  const [showDropdown, setShowDropdown] = useState(false);

  // Check authentication status on component mount and periodically
  useEffect(() => {
    const updateAuthStatus = () => {
      const status = authManager.getAuthStatus();
      setAuthStatus(status);
    };

    updateAuthStatus();

    // Update every 30 seconds
    const interval = setInterval(updateAuthStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDisconnectAll = () => {
    authManager.clearAllSessions();
    onGmailDisconnect?.();
    onMotionDisconnect?.();
    onGoogleDisconnect?.();
    setShowDropdown(false);
  };

  const handleDisconnectService = (service: 'gmail' | 'motion' | 'google') => {
    switch (service) {
      case 'gmail':
        authManager.clearGmailSession();
        onGmailDisconnect?.();
        break;
      case 'motion':
        authManager.clearMotionSession();
        onMotionDisconnect?.();
        break;
      case 'google':
        authManager.clearGoogleSession();
        onGoogleDisconnect?.();
        break;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'gmail':
        return <Mail className="w-4 h-4" />;
      case 'motion':
        return <CheckCircle className="w-4 h-4" />;
      case 'google':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getServiceName = (service: string) => {
    switch (service) {
      case 'gmail':
        return 'Gmail';
      case 'motion':
        return 'Motion Tasks';
      case 'google':
        return 'Google Calendar';
      default:
        return service;
    }
  };

  const getStatusColor = (isConnected: boolean) => {
    return isConnected
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  };

  return (
    <div className="relative">
      {/* Status Badge */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
          authStatus.totalConnections > 0
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/40'
            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-900/40'
        }`}
      >
        <div className="flex items-center gap-1">
          {authStatus.totalConnections > 0 ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>{authStatus.totalConnections} Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>No Services</span>
            </>
          )}
        </div>
        <Settings className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Connected Services</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {authStatus.totalConnections === 0
                ? 'No services connected. Connect services to enable full functionality.'
                : `${authStatus.totalConnections} service${authStatus.totalConnections > 1 ? 's' : ''} connected.`
              }
            </p>
          </div>

          {/* Service Status List */}
          <div className="p-4 space-y-3">
            {(['gmail', 'motion', 'google'] as const).map(service => (
              <div
                key={service}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(authStatus[service])}`}
              >
                <div className="flex items-center gap-3">
                  {getServiceIcon(service)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getServiceName(service)}
                    </div>
                    <div className="text-xs">
                      {authStatus[service] ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>

                {authStatus[service] && (
                  <button
                    onClick={() => handleDisconnectService(service)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                    title={`Disconnect ${getServiceName(service)}`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          {authStatus.totalConnections > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDisconnectAll}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect All Services
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};