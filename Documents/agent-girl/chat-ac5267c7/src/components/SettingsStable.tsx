import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Calendar, Download, Layout, Palette, ChevronDown, Link, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { motionAPI } from '../utils/motionApi';
import { OAuthIntegration } from './oauth/OAuthIntegration';
import { GmailSettings } from './email/GmailSettings';

interface SettingsProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onExport: () => void;
}

const dateRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'year', label: 'This year' }
];

const widgetLayouts = [
  { value: 'default', label: 'Default Layout' },
  { value: 'compact', label: 'Compact View' },
  { value: 'detailed', label: 'Detailed View' },
  { value: 'custom', label: 'Custom Layout' }
];

const exportFormats = [
  { value: 'pdf', label: 'PDF Report' },
  { value: 'csv', label: 'CSV Data' },
  { value: 'json', label: 'JSON Export' }
];

// Stable Dropdown Component with proper state management
const StableDropdown: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon: React.ReactNode;
}> = React.memo(({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = useCallback((selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className="relative dropdown-container">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-button flex items-center justify-between text-left"
        type="button"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{options.find(opt => opt.value === value)?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-50 animate-slide-up">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200 ${
                value === option.value ? 'bg-white/20 dark:bg-white/10' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

StableDropdown.displayName = 'StableDropdown';

// Get API key prefix for display
const getApiKeyPrefix = (apiKey: string): string => {
  if (!apiKey) return '';
  if (apiKey.startsWith('mot_')) return 'mot_';
  if (apiKey.startsWith('AARv')) return 'AARv';
  return apiKey.substring(0, 4) + '...';
};

// Stable Motion Integration Component
const StableMotionIntegration: React.FC = React.memo(() => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Initialize component state
  useEffect(() => {
    const initializeMotion = () => {
      try {
        const storedKey = localStorage.getItem('motion_api_key');
        if (storedKey && motionAPI.isAuthenticated()) {
          setApiKey(storedKey);
          setIsConnected(true);
          updateSyncStatus();
        }
      } catch (error) {
        console.error('Error initializing Motion integration:', error);
      }
    };

    initializeMotion();
  }, []);

  const updateSyncStatus = useCallback(() => {
    try {
      const status = motionAPI.getSyncStatus();
      setSyncStatus(status);
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }, []);

  const handleConnectMotion = useCallback(async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Motion API key');
      return;
    }

    setIsConnecting(true);
    try {
      motionAPI.setApiKey(apiKey.trim());
      const testResult = await motionAPI.testConnection();

      if (!testResult.success) {
        throw new Error(testResult.error || 'Invalid API key');
      }

      localStorage.setItem('motion_api_key', apiKey.trim());
      setIsConnected(true);
      setShowApiKeyInput(false);
      updateSyncStatus();
    } catch (error) {
      console.error('Failed to connect Motion:', error);
      motionAPI.clearApiKey();
      localStorage.removeItem('motion_api_key');
      alert(`Failed to connect to Motion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  }, [apiKey, updateSyncStatus]);

  const handleDisconnectMotion = useCallback(() => {
    try {
      motionAPI.clearApiKey();
      localStorage.removeItem('motion_api_key');
      setApiKey('');
      setIsConnected(false);
      setSyncStatus(null);
      setLastSyncTime(null);
    } catch (error) {
      console.error('Error disconnecting Motion:', error);
    }
  }, []);

  const handleSyncNow = useCallback(async () => {
    if (!isConnected) return;

    setIsConnecting(true);
    try {
      updateSyncStatus();
      const syncResult = await motionAPI.getTasks();

      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Sync failed');
      }

      updateSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, updateSyncStatus]);

  // Memoize the sync status display to prevent re-renders
  const syncStatusDisplay = useMemo(() => {
    if (!syncStatus) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{syncStatus.pending || 0}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{syncStatus.completed || 0}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Completed</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{syncStatus.syncing || 0}</div>
          <div className="text-xs text-green-600 dark:text-green-400">Syncing</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{syncStatus.errors || 0}</div>
          <div className="text-xs text-red-600 dark:text-red-400">Errors</div>
        </div>
      </div>
    );
  }, [syncStatus]);

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Motion Integration</h3>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Connect Your Motion Account</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Sync your tasks with Motion for AI-powered scheduling and time blocking.
                </p>
                <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside mb-3">
                  <li>Go to <a href="https://app.usemotion.com/settings/api" target="_blank" rel="noopener noreferrer" className="underline font-medium">Motion Settings → API</a></li>
                  <li>Generate a new API key</li>
                  <li>Copy and paste your API key below</li>
                </ol>
              </div>
            </div>
          </div>

          {!showApiKeyInput ? (
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              type="button"
            >
              <Link className="w-4 h-4" />
              Connect Motion Account
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motion API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="mot_1234567890abcdef... or AARv1234567890abcdef..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConnectMotion}
                  disabled={isConnecting || !apiKey.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  type="button"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowApiKeyInput(false);
                    setApiKey('');
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">Connected to Motion</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your tasks are being synced with Motion ({getApiKeyPrefix(apiKey)} key)
                  {lastSyncTime && (
                    <span className="ml-2 text-xs">
                      Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {syncStatusDisplay}

          <div className="flex gap-2">
            <button
              onClick={handleSyncNow}
              disabled={isConnecting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              type="button"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </button>
            <button
              onClick={handleDisconnectMotion}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              type="button"
            >
              Disconnect
            </button>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 <span className="font-medium">Auto-sync:</span> Tasks automatically sync when created, updated, or completed
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

StableMotionIntegration.displayName = 'StableMotionIntegration';

export const SettingsPanelStable: React.FC<SettingsProps> = React.memo(({
  dateRange,
  onDateRangeChange,
  onExport
}) => {
  const [layout, setLayout] = useState('default');
  const [exportFormat, setExportFormat] = useState('pdf');

  // Memoize handlers to prevent unnecessary re-renders
  const handleDateRangeChange = useCallback((range: string) => {
    onDateRangeChange(range);
  }, [onDateRangeChange]);

  const handleLayoutChange = useCallback((newLayout: string) => {
    setLayout(newLayout);
  }, []);

  const handleExportFormatChange = useCallback((format: string) => {
    setExportFormat(format);
  }, []);

  const handleExport = useCallback(() => {
    onExport();
  }, [onExport]);

  return (
    <div className="space-y-6">
      {/* OAuth Integration */}
      <OAuthIntegration onServiceConnected={(service) => {
        // Trigger service-specific events for existing components
        if (service === 'Google') {
          window.dispatchEvent(new CustomEvent('googleCalendarEventsSynced', { detail: [] }));
          window.dispatchEvent(new CustomEvent('gmailConnected'));
        }
      }} />

      {/* Gmail Integration */}
      <GmailSettings />

      {/* Motion Integration */}
      <StableMotionIntegration />

      {/* General Settings */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-sage-600 dark:text-sage-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings & Customization</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StableDropdown
            label="Date Range"
            value={dateRange}
            options={dateRanges}
            onChange={handleDateRangeChange}
            icon={<Calendar className="w-4 h-4" />}
          />

          <StableDropdown
            label="Widget Layout"
            value={layout}
            options={widgetLayouts}
            onChange={handleLayoutChange}
            icon={<Layout className="w-4 h-4" />}
          />

          <StableDropdown
            label="Export Format"
            value={exportFormat}
            options={exportFormats}
            onChange={handleExportFormatChange}
            icon={<Download className="w-4 h-4" />}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 glass-button py-2 text-sm font-medium text-sage-600 dark:text-sage-400 flex items-center justify-center gap-2"
            type="button"
          >
            <Download className="w-4 h-4" />
            Export Dashboard
          </button>

          <button className="flex-1 glass-button py-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2" type="button">
            <Palette className="w-4 h-4" />
            Customize Theme
          </button>
        </div>

        <div className="mt-4 p-3 bg-sage-500/10 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
            💡 <span className="font-medium">Pro tip:</span> Your settings are automatically saved and synced across devices
          </p>
        </div>
      </div>
    </div>
  );
});
SettingsPanelStable.displayName = "SettingsPanelStable";
