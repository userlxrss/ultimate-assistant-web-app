// Simple Google Calendar Integration - No API Keys Required! (CORS Proxy)

import React, { useState, useEffect } from 'react';
import { Calendar, Check, AlertCircle, RefreshCw, ExternalLink, Copy, Link2, LogOut, Download } from 'lucide-react';
import { corsProxyCalendarAPI, CorsProxyCalendarAPI } from '../../utils/corsProxyCalendarAPI';
import { CalendarEvent } from '../../types/calendar';
import { format } from 'date-fns';

interface SimpleGoogleCalendarIntegrationProps {
  onEventsSynced?: (events: CalendarEvent[]) => void;
}

export const SimpleGoogleCalendarIntegration: React.FC<SimpleGoogleCalendarIntegrationProps> = ({ onEventsSynced }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [icalUrl, setIcalUrl] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    // Load saved iCal URL
    const savedIcalUrl = localStorage.getItem('google_calendar_ical_url');
    if (savedIcalUrl) {
      setIcalUrl(savedIcalUrl);
      corsProxyCalendarAPI.setICalUrl(savedIcalUrl);
      setIsConnected(true);
    }

    // Load last sync time
    const lastSync = localStorage.getItem('google_calendar_last_sync');
    if (lastSync) setLastSyncTime(new Date(lastSync));
  }, []);

  const handleConnect = () => {
    if (!icalUrl.trim()) {
      setSyncStatus('Please enter your iCal URL');
      return;
    }

    if (!CorsProxyCalendarAPI.isValidICalUrl(icalUrl)) {
      setSyncStatus('Please enter a valid Google Calendar iCal URL');
      return;
    }

    // Save iCal URL
    localStorage.setItem('google_calendar_ical_url', icalUrl);
    corsProxyCalendarAPI.setICalUrl(icalUrl);
    setIsConnected(true);
    setSyncStatus('Successfully connected to Google Calendar!');
  };

  const handleDisconnect = () => {
    corsProxyCalendarAPI.signOut();
    setIsConnected(false);
    setSyncStatus('Disconnected from Google Calendar');
    localStorage.removeItem('google_calendar_ical_url');
    localStorage.removeItem('google_calendar_last_sync');
    setLastSyncTime(null);
    setIcalUrl('');
  };

  const handleSync = async () => {
    if (!isConnected) {
      setSyncStatus('Please connect your Google Calendar first');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Syncing calendar events...');

    try {
      // Get events from last 30 days to next 30 days
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const events = await corsProxyCalendarAPI.syncEvents(timeMin, timeMax);

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
      const calendars = await corsProxyCalendarAPI.getCalendarList();
      setSyncStatus(`Connected! Found ${calendars.length} calendar(s)`);
    } catch (error) {
      console.error('Connection test failed:', error);
      setSyncStatus(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyInstructions = async () => {
    const instructions = CorsProxyCalendarAPI.getICalUrlInstructions().join('\n');
    try {
      await navigator.clipboard.writeText(instructions);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy instructions:', error);
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Simple Google Calendar Integration
        </h3>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
          No API Required
        </span>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Connect Your Google Calendar via iCal
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Sync your Google Calendar events using a simple iCal URL. No API keys required!
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                How to Get Your iCal URL:
              </h4>
              <button
                onClick={copyInstructions}
                className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                title="Copy instructions"
              >
                {showCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-2 list-decimal list-inside">
              {CorsProxyCalendarAPI.getICalUrlInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Calendar iCal URL
            </label>
            <input
              type="url"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Looks like: https://calendar.google.com/calendar/ical/your-email@gmail.com/public/basic.ics
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={!icalUrl.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Connected to Google Calendar
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your Google Calendar is connected and ready to sync via iCal
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
              className="py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
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