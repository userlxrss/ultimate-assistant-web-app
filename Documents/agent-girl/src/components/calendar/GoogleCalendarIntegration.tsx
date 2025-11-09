import React, { useState, useEffect } from 'react';
import { Calendar, Check, AlertCircle, RefreshCw, ExternalLink, Settings, LogOut, Download } from 'lucide-react';
import { mockGoogleCalendarAPI } from '../../utils/mockGoogleCalendarAPI';
import { googleCalendarAPI } from '../../utils/googleCalendarAPI';
import { CalendarEvent } from '../../types/calendar';
import { format } from 'date-fns';

interface GoogleCalendarIntegrationProps {
  onEventsSynced?: (events: CalendarEvent[]) => void;
}

export const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({ onEventsSynced }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');

  // Determine which API to use based on whether real credentials are provided
  const getCalendarAPI = () => {
    // Use real Google Calendar API if both API key and client ID are provided
    if (apiKey && clientId) {
      return googleCalendarAPI;
    }
    // Fall back to mock API for testing
    return mockGoogleCalendarAPI;
  };

  useEffect(() => {
    // Load saved API keys
    const savedApiKey = localStorage.getItem('google_calendar_api_key');
    const savedClientId = localStorage.getItem('google_calendar_client_id');
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedClientId) setClientId(savedClientId);

    // Check if already authenticated (use the appropriate API)
    const currentAPI = getCalendarAPI();
    setIsConnected(currentAPI.isAuthenticated());

    // Load last sync time
    const lastSync = localStorage.getItem('google_calendar_last_sync');
    if (lastSync) setLastSyncTime(new Date(lastSync));

    // Set up callback for sign-in (only for mock API)
    if (currentAPI === mockGoogleCalendarAPI) {
      mockGoogleCalendarAPI.setSignInCallback((success) => {
        setIsConnecting(false);
        if (success) {
          setIsConnected(true);
          setSyncStatus('Successfully connected to Google Calendar!');
        } else {
          setSyncStatus('Failed to connect to Google Calendar');
        }
      });
    } else if (currentAPI === googleCalendarAPI && savedApiKey && savedClientId) {
      // For real Google Calendar API, initialize on mount if credentials are available
      const initializeRealAPI = async () => {
        try {
          await googleCalendarAPI.initializeGoogleAPI(savedClientId, savedApiKey);
          if (googleCalendarAPI.isAuthenticated()) {
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Failed to initialize Google Calendar API:', error);
        }
      };
      initializeRealAPI();
    }
  }, [apiKey, clientId]);

  const handleConnect = async () => {
    if (!apiKey || !clientId) {
      setSyncStatus('Please enter both API Key and Client ID');
      return;
    }

    setIsConnecting(true);
    setSyncStatus('Connecting to Google Calendar...');

    try {
      // Save API keys to localStorage
      localStorage.setItem('google_calendar_api_key', apiKey);
      localStorage.setItem('google_calendar_client_id', clientId);

      const currentAPI = getCalendarAPI();

      if (currentAPI === googleCalendarAPI) {
        // Use real Google Calendar API
        setSyncStatus('Initializing Google API...');
        await googleCalendarAPI.initializeGoogleAPI(clientId, apiKey);

        setSyncStatus('Authenticating with Google...');
        await googleCalendarAPI.signIn();

        setIsConnected(true);
        setSyncStatus('Successfully connected to Google Calendar!');
        setShowApiKeySettings(false);
      } else {
        // Use mock API
        setSyncStatus('Initializing Mock API...');

        // Set up callback and sign in
        mockGoogleCalendarAPI.setSignInCallback((success) => {
          setIsConnecting(false);
          if (success) {
            setIsConnected(true);
            setSyncStatus('Successfully connected to Google Calendar!');
            setShowApiKeySettings(false);
          } else {
            setSyncStatus('Failed to connect to Google Calendar');
          }
        });

        // Trigger sign in
        await mockGoogleCalendarAPI.signIn();
      }
    } catch (error) {
      console.error('Failed to connect to Google Calendar:', error);
      setIsConnecting(false);
      setSyncStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = () => {
    const currentAPI = getCalendarAPI();
    currentAPI.signOut();
    setIsConnected(false);
    setSyncStatus('Disconnected from Google Calendar');
    localStorage.removeItem('google_calendar_last_sync');
    setLastSyncTime(null);
  };

  const handleSync = async () => {
    if (!isConnected) return;

    setIsSyncing(true);
    setSyncStatus('Syncing calendar events...');

    try {
      // Get events from last 30 days to next 30 days
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const currentAPI = getCalendarAPI();

      // Initialize the real Google Calendar API if needed
      if (currentAPI === googleCalendarAPI && apiKey && clientId) {
        setSyncStatus('Initializing Google API...');
        await googleCalendarAPI.initializeGoogleAPI(clientId, apiKey);

        // Check if authenticated, if not, authenticate
        if (!googleCalendarAPI.isAuthenticated()) {
          setSyncStatus('Authenticating with Google...');
          await googleCalendarAPI.signIn();
        }
      }

      setSyncStatus('Fetching calendar events...');
      const events = await currentAPI.syncEvents(timeMin, timeMax);

      setLastSyncTime(new Date());
      localStorage.setItem('google_calendar_last_sync', new Date().toISOString());

      setSyncStatus(`Successfully synced ${events.length} events`);
      onEventsSynced?.(events);
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      setSyncStatus(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isConnected) return;

    setIsSyncing(true);
    setSyncStatus('Testing connection...');

    try {
      const currentAPI = getCalendarAPI();
      const calendars = await currentAPI.getCalendarList();
      setSyncStatus(`Connected! Found ${calendars.length} calendar(s)`);
    } catch (error) {
      console.error('Connection test failed:', error);
      setSyncStatus(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Calendar Integration</h3>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Connect Your Google Calendar</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Sync your Google Calendar events to keep everything in one place.
                </p>
                <ol className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1 list-decimal list-inside mb-3">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a></li>
                  <li>Enable the Google Calendar API</li>
                  <li>Create OAuth 2.0 credentials (Client ID)</li>
                  <li>Get your API Key from the same project</li>
                  <li>Enter your credentials below</li>
                </ol>
              </div>
            </div>
          </div>

          {!showApiKeySettings ? (
            <button
              onClick={() => setShowApiKeySettings(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configure Google Calendar
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google API Key"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OAuth Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your OAuth Client ID"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !apiKey.trim() || !clientId.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
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
                  onClick={() => setShowApiKeySettings(false)}
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
                <h4 className="font-medium text-green-900 dark:text-green-100">Connected to Google Calendar</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your Google Calendar is connected and ready to sync
                </p>
              </div>
            </div>
          </div>

          {lastSyncTime && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Last sync: {format(lastSyncTime, 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Sync Events
                </>
              )}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isSyncing}
              className="py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </button>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Disconnect Google Calendar
          </button>

          {syncStatus && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              syncStatus.includes('Successfully') || syncStatus.includes('Connected')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : syncStatus.includes('Failed') || syncStatus.includes('Error')
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {syncStatus.includes('Successfully') || syncStatus.includes('Connected') ? (
                  <Check className="w-4 h-4" />
                ) : syncStatus.includes('Failed') || syncStatus.includes('Error') ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span>{syncStatus}</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 <span className="font-medium">Auto-sync:</span> Click "Sync Events" to import your Google Calendar events
            </p>
          </div>
        </div>
      )}
    </div>
  );
};