import React, { useState, useEffect } from 'react';
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

const Dropdown: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon: React.ReactNode;
}> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-button flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{options.find(opt => opt.value === value)?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-10 animate-slide-up">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
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
};

// Get API key prefix for display
const getApiKeyPrefix = (apiKey: string): string => {
  if (!apiKey) return '';
  if (apiKey.startsWith('mot_')) return 'mot_';
  if (apiKey.startsWith('AARv')) return 'AARv';
  return apiKey.substring(0, 4) + '...';
};

// Motion Integration Component
const MotionIntegration: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    // Check if Motion API key is already stored
    if (motionAPI.hasApiKey()) {
      setApiKey(localStorage.getItem('motion_api_key') || '');
      setIsConnected(true);
    }
    updateSyncStatus();
  }, []);

  const updateSyncStatus = () => {
    const status = motionAPI.getSyncStatus();
    setSyncStatus(status);
  };

  const handleConnectMotion = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Motion API key');
      return;
    }

    setIsConnecting(true);
    try {
      // Test the API key with real Motion API
      motionAPI.setApiKey(apiKey.trim());
      const testResult = await motionAPI.testConnection();

      if (!testResult.success) {
        throw new Error(testResult.error || 'Invalid API key');
      }

      setIsConnected(true);
      setShowApiKeyInput(false);
      updateSyncStatus();
    } catch (error) {
      console.error('Failed to connect Motion:', error);
      motionAPI.clearApiKey(); // Clear invalid key
      alert(`Failed to connect to Motion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectMotion = () => {
    motionAPI.clearApiKey();
    setApiKey('');
    setIsConnected(false);
    setSyncStatus(null);
  };

  const handleSyncNow = async () => {
    if (!isConnected) return;

    setIsConnecting(true);
    try {
      // Trigger real sync with Motion API
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
  };

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
                </p>
              </div>
            </div>
          </div>

          {syncStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{syncStatus.pending}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{syncStatus.completed}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Completed</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{syncStatus.syncing}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Syncing</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{syncStatus.errors}</div>
                <div className="text-xs text-red-600 dark:text-red-400">Errors</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSyncNow}
              disabled={isConnecting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
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
};

export const SettingsPanel: React.FC<SettingsProps> = ({
  dateRange,
  onDateRangeChange,
  onExport
}) => {
  const [layout, setLayout] = useState('default');
  const [exportFormat, setExportFormat] = useState('pdf');

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

      {/* General Settings */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-sage-600 dark:text-sage-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings & Customization</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Dropdown
            label="Date Range"
            value={dateRange}
            options={dateRanges}
            onChange={onDateRangeChange}
            icon={<Calendar className="w-4 h-4" />}
          />

          <Dropdown
            label="Widget Layout"
            value={layout}
            options={widgetLayouts}
            onChange={setLayout}
            icon={<Layout className="w-4 h-4" />}
          />

          <Dropdown
            label="Export Format"
            value={exportFormat}
            options={exportFormats}
            onChange={setExportFormat}
            icon={<Download className="w-4 h-4" />}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onExport}
            className="flex-1 glass-button py-2 text-sm font-medium text-sage-600 dark:text-sage-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Dashboard
          </button>

          <button className="flex-1 glass-button py-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
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
};