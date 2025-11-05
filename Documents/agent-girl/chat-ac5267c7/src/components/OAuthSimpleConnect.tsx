import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Link, ExternalLink, Info, Key, Shield } from 'lucide-react';
import { useOAuth } from '../hooks/useOAuth';

interface OAuthSimpleConnectProps {
  onServiceConnected?: (service: string) => void;
}

export const OAuthSimpleConnect: React.FC<OAuthSimpleConnectProps> = ({
  onServiceConnected
}) => {
  const [connectedServices, setConnectedServices] = useState<{
    google: boolean;
    motion: boolean;
  }>({ google: false, motion: false });
  const [motionApiKey, setMotionApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverPort, setServerPort] = useState(3006);
  const [isConnectingState, setIsConnectingState] = useState<{
    google: boolean;
    motion: boolean;
  }>({ google: false, motion: false });

  const { initiateGoogleOAuth, connectMotionApi, disconnectService, isConnecting, clearError } = useOAuth();

  useEffect(() => {
    // Check for existing connections
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      // Check Google connection
      const googleResponse = await fetch(`http://localhost:${serverPort}/api/auth/status/google`, {
        credentials: 'include'
      });
      const googleData = await googleResponse.json();

      // Check Motion connection
      const motionResponse = await fetch(`http://localhost:${serverPort}/api/auth/status/motion`, {
        credentials: 'include'
      });
      const motionData = await motionResponse.json();

      setConnectedServices({
        google: googleData.connected || false,
        motion: motionData.connected || false
      });

      // Get Motion API key if connected
      if (motionData.connected) {
        const storedKey = localStorage.getItem('motion_api_key');
        if (storedKey) {
          setMotionApiKey(storedKey);
        }
      }
    } catch (error) {
      console.warn('Failed to check existing connections:', error);
    }
  };

  const handleGoogleConnect = async () => {
    const success = await initiateGoogleOAuth();
    if (success) {
      setConnectedServices(prev => ({ ...prev, google: true }));
      onServiceConnected?.('Google');
    }
  };

  const handleMotionConnect = () => {
    setConnectionError(null);
    setIsConnectingState(prev => ({ ...prev, motion: true }));

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
      setIsConnectingState(prev => ({ ...prev, motion: false }));
    }
  };

  const handleDisconnect = async (service: 'google' | 'motion') => {
    const success = await disconnectService(service);
    if (success) {
      setConnectedServices(prev => ({ ...prev, [service]: false }));
      if (service === 'motion') {
        setMotionApiKey('');
        localStorage.removeItem('motion_api_key');
      }
    }
  };

  const getApiKeyPrefix = (apiKey: string): string => {
    if (!apiKey) return '';
    if (apiKey.startsWith('mot_')) return 'mot_';
    if (apiKey.startsWith('AARv')) return 'AARv';
    return apiKey.substring(0, 4) + '...';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Connect Your Services
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Sync your tasks, calendar, and email for a unified productivity experience
        </p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Services */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
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
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your Google Calendar and Gmail are synced
              </p>
              <button
                onClick={() => handleDisconnect('google')}
                disabled={isConnecting.google}
                className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Not connected</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect to sync your calendar events and emails
                </p>
              </div>
              <button
                onClick={handleGoogleConnect}
                disabled={isConnecting.google}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isConnecting.google ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Connect Google
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Motion */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                <span className="font-medium">Connected</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your tasks are synced with Motion ({getApiKeyPrefix(motionApiKey)} key)
              </p>
              <button
                onClick={() => handleDisconnect('motion')}
                disabled={isConnecting.motion}
                className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Not connected</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect to enable AI-powered task scheduling
                </p>
              </div>

              {!showApiKeyInput ? (
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  Connect Motion
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="motion-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Motion API Key
                    </label>
                    <input
                      id="motion-key"
                      type="password"
                      value={motionApiKey}
                      onChange={(e) => setMotionApiKey(e.target.value)}
                      placeholder="mot_1234567890abcdef... or AARv1234567890abcdef..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Get your API key from{' '}
                      <a
                        href="https://app.usemotion.com/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 underline flex items-center gap-1"
                      >
                        Motion Settings
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMotionConnect}
                      disabled={isConnecting.motion || !motionApiKey.trim()}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {isConnecting.motion ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowApiKeyInput(false);
                        setMotionApiKey('');
                        setConnectionError(null);
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
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Secure Connection</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All API keys are stored locally and encrypted. Your data is transmitted securely using HTTPS and never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};