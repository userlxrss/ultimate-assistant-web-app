import React, { useState, useEffect } from 'react';
import { useTheme } from '../../index';

interface ConnectionStatus {
  isConnected: boolean;
  lastSync?: Date;
  syncInProgress: boolean;
  error?: string;
}

export const ConnectionStatusBadge: React.FC = () => {
  const { theme } = useTheme();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    syncInProgress: false,
  });

  // Simulate connection monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: Math.random() > 0.1, // 90% uptime simulation
        lastSync: new Date(),
      }));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setConnectionStatus(prev => ({ ...prev, syncInProgress: true }));

    // Simulate sync process
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
      }));
    }, 2000);
  };

  const getStatusColor = () => {
    if (connectionStatus.syncInProgress) return 'text-warning';
    if (!connectionStatus.isConnected) return 'text-error';
    return 'text-success';
  };

  const getStatusText = () => {
    if (connectionStatus.syncInProgress) return 'Syncing...';
    if (!connectionStatus.isConnected) return 'Offline';
    return 'Connected';
  };

  const formatLastSync = () => {
    if (!connectionStatus.lastSync) return 'Never';

    const now = new Date();
    const diff = now.getTime() - connectionStatus.lastSync.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        glass glass-blur-16 glass-shadow-lg rounded-full px-4 py-2
        flex items-center space-x-2 text-sm
        transition-all duration-300
        ${connectionStatus.isConnected ? 'border-success/30' : 'border-error/30'}
        ${connectionStatus.syncInProgress ? 'animate-pulse' : ''}
      `}>
        {/* Status Indicator */}
        <div className={`
          w-2 h-2 rounded-full
          ${connectionStatus.syncInProgress ? 'bg-warning animate-ping' : ''}
          ${!connectionStatus.syncInProgress && connectionStatus.isConnected ? 'bg-success' : ''}
          ${!connectionStatus.isConnected ? 'bg-error' : ''}
        `} />

        {/* Status Text */}
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>

        {/* Last Sync Time */}
        <span className="opacity-70 text-xs">
          {formatLastSync()}
        </span>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={connectionStatus.syncInProgress}
          className={`
            glass-button glass-button-xs
            ${connectionStatus.syncInProgress ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title="Manual sync"
        >
          <svg
            className={`w-4 h-4 ${connectionStatus.syncInProgress ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Error Indicator */}
        {connectionStatus.error && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-error rounded-full animate-pulse" title={connectionStatus.error} />
          </div>
        )}
      </div>

      {/* Detailed Connection Info (expandable) */}
      <div className="absolute bottom-full right-0 mb-2 w-64 hidden">
        <div className="glass glass-blur-16 glass-shadow-lg rounded-lg p-4 border border-light">
          <h4 className="font-semibold text-sm mb-2">Connection Details</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={getStatusColor()}>{getStatusText()}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span>{formatLastSync()}</span>
            </div>
            <div className="flex justify-between">
              <span>Server:</span>
              <span>API Server 1</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span>42ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};