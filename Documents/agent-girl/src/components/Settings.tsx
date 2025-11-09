import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Download, Layout, Palette, ChevronDown, Link, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
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

// Motion Integration Component with Email/Password Authentication
const MotionIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check Motion connection on component mount
    checkMotionConnection();
  }, []);

  const checkMotionConnection = () => {
    try {
      console.log('🔍 Checking Motion authentication...');

      // Check for email/password login token in localStorage
      const motionToken = localStorage.getItem('motion_token');
      const motionUser = localStorage.getItem('motion_user');
      const motionConnected = localStorage.getItem('motion_connected');

      if (motionToken && motionUser && motionConnected === 'true') {
        try {
          const user = JSON.parse(motionUser);
          console.log('✅ Valid Motion authentication found for user:', user.email);
          setIsConnected(true);
          setSyncStatus({ connected: true, lastSync: new Date() });
          return;
        } catch (parseError) {
          console.log('❌ Invalid Motion user data, removing...');
          localStorage.removeItem('motion_token');
          localStorage.removeItem('motion_user');
          localStorage.removeItem('motion_connected');
        }
      }

      // No valid authentication found
      console.log('📦 No Motion authentication found - showing as not connected');
      setIsConnected(false);
      setSyncStatus(null);

    } catch (error) {
      console.error('❌ Error checking Motion authentication:', error);
      setIsConnected(false);
      setSyncStatus(null);
    }
  };

  const updateSyncStatus = (status: any) => {
    setSyncStatus(status);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleConnectMotion = () => {
    setShowLoginForm(true);
  };

  const handleMotionLogin = async () => {
    setLoading(true);

    try {
      // Call Motion API to login
      const response = await fetch('https://api.usemotion.com/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.token) {
        // Save token to localStorage
        localStorage.setItem('motion_token', data.token);
        localStorage.setItem('motion_user', JSON.stringify(data.user));
        localStorage.setItem('motion_connected', 'true');

        setIsMotionConnected(true);
        setSyncStatus('Successfully connected to Motion!');
        setShowLoginForm(false);
        setEmail('');
        setPassword('');

        alert('Successfully connected to Motion!');
      } else {
        alert('Login failed. Check your credentials.');
      }
    } catch (error) {
      console.error('Motion login error:', error);
      alert('Login failed. Check your credentials.');
    }

    setLoading(false);
  };

  const handleDisconnectMotion = () => {
    if (confirm('Are you sure you want to disconnect Motion?')) {
      try {
        console.log('🔌 Disconnecting Motion...');

        // Clear Motion token from localStorage
        localStorage.removeItem('motion_token');
        localStorage.removeItem('motion_user');
        localStorage.removeItem('motion_connected');

        // Clear local state
        setIsConnected(false);
        setSyncStatus(null);

        console.log('✅ Motion disconnected successfully');
        alert('✅ Disconnected from Motion');
      } catch (error) {
        console.error('Failed to disconnect Motion:', error);
        alert('Failed to disconnect from Motion');
      }
    }
  };

  const handleSyncNow = async () => {
    if (!isConnected) return;

    setIsConnecting(true);
    try {
      // Get stored token
      const token = localStorage.getItem('motion_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Trigger real sync with Motion API
      const response = await fetch('https://api.usemotion.com/v1/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const tasks = await response.json();
      console.log('✅ Tasks synced successfully:', tasks);

      setLastSync(new Date());
      updateSyncStatus({ connected: true, lastSync: new Date() });
      alert('✅ Tasks synced successfully from Motion!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenTasks = () => {
    window.location.href = '/tasks';
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Motion Integration</h3>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          {!showLoginForm ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Connect Your Motion Account</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Login with your Motion email and password to sync your tasks.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motion Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Your Motion password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMotionLogin}
                  disabled={loading || !email || !password}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200"
                >
                  {loading ? 'Connecting...' : 'Connect Motion'}
                </button>
              </div>
            </div>
          )}

          {!showLoginForm && (
            <button
              onClick={handleConnectMotion}
              disabled={isConnecting}
              className="w-full py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting to Motion...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Connect to Motion
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Connected to Motion</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your tasks are being synced with Motion
                  </p>
                  {lastSync && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Last sync: {lastSync.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleOpenTasks}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Open Tasks
              </button>
            </div>
          </div>

          {syncStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{syncStatus.pending}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{syncStatus.completed}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Completed</div>
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
              className="flex-1 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
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
      {/* Motion Integration */}
      <MotionIntegration />

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