import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Link, ExternalLink, Eye, EyeOff, Key, Shield, RefreshCw, Code } from 'lucide-react';

export const OAuthTestPage: React.FC = () => {
  const [connectedServices, setConnectedServices] = useState<{
    google: boolean;
    motion: boolean;
  }>({ google: false, motion: false });
  const [motionApiKey, setMotionApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      const [googleResponse, motionResponse] = await Promise.all([
        fetch('http://localhost:3006/api/auth/status/google', { credentials: 'include' }),
        fetch('http://localhost:3006/api/auth/status/motion', { credentials: 'include' })
      ]);

      const googleData = await googleResponse.json();
      const motionData = await motionResponse.json();

      setConnectedServices({
        google: googleData.connected || false,
        motion: motionData.connected || false
      });

      if (motionData.connected) {
        const storedKey = localStorage.getItem('motion_api_key');
        if (storedKey) {
          setMotionApiKey(storedKey);
        }
      }
    } catch (error) {
      console.warn('Failed to check connections:', error);
    }
  };

  const handleGoogleConnect = async () => {
    setConnectionStatus('Initiating Google OAuth...');
    setConnectionError(null);

    try {
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        'http://localhost:3006/auth/google',
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Failed to open OAuth window. Please allow popups for this site.');
      }

      return new Promise((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== 'http://localhost:5174') return;

          if (event.data.type === 'oauth-callback') {
            window.removeEventListener('message', messageHandler);
            popup.close();

            if (event.data.success) {
              setConnectionStatus('Google connected successfully!');
              setConnectedServices(prev => ({ ...prev, google: true }));
              resolve(true);
            } else {
              setConnectionError(event.data.error || 'Google OAuth failed');
              resolve(false);
            }
          }
        };

        window.addEventListener('message', messageHandler);

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            setConnectionError('OAuth window was closed before completion');
            resolve(false);
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (!popup.closed) {
            popup.close();
          }
          setConnectionError('OAuth flow timed out');
          resolve(false);
        }, 5 * 60 * 1000);
      });
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect Google');
      return false;
    }
  };

  const handleMotionConnect = () => {
    setConnectionError(null);
    setConnectionStatus('Redirecting to Motion OAuth...');

    try {
      // REAL OAuth: Redirect user to Motion's actual login page
      const MOTION_CLIENT_ID = import.meta.env.VITE_MOTION_CLIENT_ID || 'your-motion-client-id'; // Replace with your actual Motion client ID
      const REDIRECT_URI = encodeURIComponent('http://localhost:5175/auth/motion/callback');
      const SCOPE = 'tasks:read tasks:write calendar:read';
      const STATE = Math.random().toString(36).substring(7);

      // Build REAL OAuth URL - this will take user to Motion's login page
      const motionOAuthUrl = `https://app.usemotion.com/oauth/authorize?client_id=${MOTION_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&state=${STATE}`;

      console.log('🔗 Redirecting to Motion OAuth page:', motionOAuthUrl);

      // REDIRECT USER TO MOTION'S ACTUAL LOGIN PAGE
      // Open OAuth popup
      const popup = window.open(
        motionOAuthUrl,
        'motion-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        alert('Popup blocked! Please allow popups for this site and try again.');
        setIsConnecting(false);
        return;
      }

      // Listen for OAuth callback
      const handleOAuthCallback = (event) => {
        if (event.data.type === 'motion-oauth-callback') {
          window.removeEventListener('message', handleOAuthCallback);
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleOAuthCallback);;
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to start Motion OAuth');
      setConnectionStatus('');
    }
  };

  const handleDisconnect = async (service: 'google' | 'motion') => {
    try {
      const response = await fetch(`http://localhost:3006/api/auth/disconnect/${service}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to disconnect ${service}`);
      }

      setConnectedServices(prev => ({ ...prev, [service]: false }));
      if (service === 'motion') {
        setMotionApiKey('');
        localStorage.removeItem('motion_api_key');
      }
      setConnectionStatus(`${service.charAt(0).toUpperCase() + service.slice(1)} disconnected successfully`);

    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : `Failed to disconnect ${service}`);
    }
  };

  const runTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    setConnectionStatus('Running API tests...');

    const tests = [];

    // Test Google Calendar API
    if (connectedServices.google) {
      try {
        const response = await fetch('http://localhost:3006/api/google/calendar/events', {
          credentials: 'include'
        });
        const data = await response.json();

        tests.push({
          service: 'Google Calendar',
          status: response.ok ? 'success' : 'error',
          message: response.ok ? `Found ${data.events?.length || 0} events` : data.error || 'Failed to fetch events',
          data: data
        });
      } catch (error) {
        tests.push({
          service: 'Google Calendar',
          status: 'error',
          message: error instanceof Error ? error.message : 'Network error',
          data: null
        });
      }

      // Test Gmail API
      try {
        const response = await fetch('http://localhost:3006/api/gmail/messages', {
          credentials: 'include'
        });
        const data = await response.json();

        tests.push({
          service: 'Gmail',
          status: response.ok ? 'success' : 'error',
          message: response.ok ? `Found ${data.messages?.length || 0} messages` : data.error || 'Failed to fetch messages',
          data: data
        });
      } catch (error) {
        tests.push({
          service: 'Gmail',
          status: 'error',
          message: error instanceof Error ? error.message : 'Network error',
          data: null
        });
      }
    }

    // Test Motion API
    if (connectedServices.motion) {
      try {
        const response = await fetch('http://localhost:3006/api/motion/tasks', {
          credentials: 'include'
        });
        const data = await response.json();

        tests.push({
          service: 'Motion',
          status: response.ok ? 'success' : 'error',
          message: response.ok ? `Found ${data.tasks?.length || 0} tasks` : data.error || 'Failed to fetch tasks',
          data: data
        });
      } catch (error) {
        tests.push({
          service: 'Motion',
          status: 'error',
          message: error instanceof Error ? error.message : 'Network error',
          data: null
        });
      }
    }

    setTestResults(tests);
    setIsTesting(false);
    setConnectionStatus('API tests completed');
  };

  const getApiKeyPrefix = (apiKey: string): string => {
    if (!apiKey) return '';
    if (apiKey.startsWith('mot_')) return 'mot_';
    if (apiKey.startsWith('AARv')) return 'AARv';
    return apiKey.substring(0, 4) + '...';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          OAuth Connection Test Page
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Test and debug your API connections
        </p>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-800">{connectionStatus}</p>
        </div>
      )}

      {/* Connection Error */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Connection Error</p>
            <p className="text-sm text-red-600">{connectionError}</p>
          </div>
          <button
            onClick={() => setConnectionError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Panel */}
        <div className="space-y-6">
          {/* Google Services */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Services</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Calendar & Gmail</p>
              </div>
            </div>

            {connectedServices.google ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected</span>
                </div>
                <button
                  onClick={() => handleDisconnect('google')}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Disconnect Google
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleConnect}
                className="w-full py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Link className="w-4 h-4" />
                Connect Google
              </button>
            )}
          </div>

          {/* Motion */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Motion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">AI Task Scheduling</p>
              </div>
            </div>

            {connectedServices.motion ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected ({getApiKeyPrefix(motionApiKey)} key)</span>
                </div>
                <button
                  onClick={() => handleDisconnect('motion')}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Disconnect Motion
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!showApiKeyInput ? (
                  <button
                    onClick={() => setShowApiKeyInput(true)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Connect Motion
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <label htmlFor="motion-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Motion API Key
                      </label>
                      <input
                        id="motion-key"
                        type={showApiKey ? "text" : "password"}
                        value={motionApiKey}
                        onChange={(e) => setMotionApiKey(e.target.value)}
                        placeholder="mot_1234567890abcdef... or AARv1234567890abcdef..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMotionConnect}
                        disabled={!motionApiKey.trim()}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        Connect
                      </button>
                      <button
                        onClick={() => {
                          setShowApiKeyInput(false);
                          setMotionApiKey('');
                        }}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              API Testing
            </h3>
            <button
              onClick={runTests}
              disabled={isTesting || (!connectedServices.google && !connectedServices.motion)}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing APIs...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Run API Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results</h3>

          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Connect to services and run tests to see results
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {result.service}
                      </h4>
                      <p className={`text-sm ${
                        result.status === 'success'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {result.message}
                      </p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                            View Response Data
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Debug Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Google Connected:</span>
            <span className={`ml-2 ${connectedServices.google ? 'text-green-600' : 'text-red-600'}`}>
              {connectedServices.google ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Motion Connected:</span>
            <span className={`ml-2 ${connectedServices.motion ? 'text-green-600' : 'text-red-600'}`}>
              {connectedServices.motion ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Motion API Key:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {motionApiKey ? getApiKeyPrefix(motionApiKey) : 'Not set'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Test Results Count:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {testResults.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};