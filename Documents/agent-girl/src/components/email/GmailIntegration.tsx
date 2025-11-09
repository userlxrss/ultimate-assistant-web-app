import React, { useState, useEffect } from 'react';
import { Mail, Link2, Check, AlertCircle, RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { gmailAPI } from '../../utils/gmailAPI';

interface GmailIntegrationProps {
  onConnected: () => void;
}

export const GmailIntegration: React.FC<GmailIntegrationProps> = ({ onConnected }) => {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showClientId, setShowClientId] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    if (gmailAPI.isAuthenticated()) {
      setIsConnected(true);
      onConnected();
    }

    // Load saved credentials
    const savedApiKey = localStorage.getItem('gmail_api_key');
    const savedClientId = localStorage.getItem('gmail_client_id');
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedClientId) setClientId(savedClientId);
  }, [onConnected]);

  const handleSaveCredentials = async () => {
    if (!apiKey.trim() || !clientId.trim()) {
      setConnectionStatus('Please enter both API Key and Client ID');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Saving credentials...');

    try {
      // Save credentials
      gmailAPI.saveConfig({
        apiKey: apiKey.trim(),
        clientId: clientId.trim(),
      });

      setConnectionStatus('Credentials saved! Starting OAuth flow...');

      // Initiate OAuth flow
      const authUrl = gmailAPI.initiateOAuth();
      const popup = window.open(authUrl, 'gmail-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setConnectionStatus('Popup blocked! Please allow popups for this site and try again.');
        setIsConnecting(false);
        return;
      }

      // Listen for OAuth callback
      const handleOAuthCallback = (event: MessageEvent) => {
        if (event.data.type === 'gmail-oauth-callback') {
          window.removeEventListener('message', handleOAuthCallback);

          if (event.data.success) {
            setIsConnected(true);
            setConnectionStatus('Successfully connected to Gmail!');
            onConnected();
          } else {
            setConnectionStatus(`Connection failed: ${event.data.error}`);
          }
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleOAuthCallback);

      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleOAuthCallback);
        if (isConnecting) {
          setIsConnecting(false);
          setConnectionStatus('Connection timeout. Please try again.');
        }
      }, 300000);

    } catch (error) {
      console.error('Gmail connection failed:', error);
      setConnectionStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isConnected) return;

    setIsConnecting(true);
    setConnectionStatus('Testing connection...');

    try {
      const result = await gmailAPI.testConnection();
      if (result.success) {
        setConnectionStatus(result.message);
      } else {
        setConnectionStatus(result.message);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    gmailAPI.clearConfig();
    setIsConnected(false);
    setApiKey('');
    setClientId('');
    setConnectionStatus('Disconnected from Gmail');
    localStorage.removeItem('gmail_api_key');
    localStorage.removeItem('gmail_client_id');
  };

  const copyInstructions = () => {
    const instructions = `To get your Gmail API credentials:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 Client ID:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URI: ${window.location.origin}/oauth/gmail/callback
5. Create API Key:
   - Go to "Credentials" → "Create Credentials" → "API Key"
6. Copy your API Key and Client ID below`;

    navigator.clipboard.writeText(instructions);
  };

  if (isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Gmail Connected
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Your Gmail account is connected and ready to sync emails
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isConnecting}
            className="flex-1 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Disconnect
          </button>
        </div>

        {connectionStatus && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            connectionStatus.includes('Successfully') || connectionStatus.includes('Connected')
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : connectionStatus.includes('Failed') || connectionStatus.includes('Error')
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              {connectionStatus.includes('Successfully') || connectionStatus.includes('Connected') ? (
                <Check className="w-4 h-4" />
              ) : connectionStatus.includes('Failed') || connectionStatus.includes('Error') ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
              <span>{connectionStatus}</span>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Next Steps</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your Gmail is now connected! Click the "Sync Gmail" button in the email header to start syncing your emails.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
          <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Your Gmail Account
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Sync your Gmail emails with the dashboard for seamless email management
        </p>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-amber-900 dark:text-amber-100">
            Setup Instructions:
          </h4>
          <button
            onClick={copyInstructions}
            className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
            title="Copy instructions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a></li>
          <li>Create a new project or select existing one</li>
          <li>Enable the Gmail API</li>
          <li>Create OAuth 2.0 Client ID credentials</li>
          <li>Create an API Key</li>
          <li>Copy your credentials below</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Google Cloud API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Found in Google Cloud Console → Credentials → API Keys
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            OAuth 2.0 Client ID
          </label>
          <div className="relative">
            <input
              type={showClientId ? 'text' : 'password'}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="123456789-abc123..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowClientId(!showClientId)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Found in Google Cloud Console → Credentials → OAuth 2.0 Client IDs
          </p>
        </div>

        <button
          onClick={handleSaveCredentials}
          disabled={isConnecting || !apiKey.trim() || !clientId.trim()}
          className="w-full py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              Connect Gmail Account
            </>
          )}
        </button>
      </div>

      {connectionStatus && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          connectionStatus.includes('Successfully') || connectionStatus.includes('Connected')
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : connectionStatus.includes('Failed') || connectionStatus.includes('Error')
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {connectionStatus.includes('Successfully') || connectionStatus.includes('Connected') ? (
              <Check className="w-4 h-4" />
            ) : connectionStatus.includes('Failed') || connectionStatus.includes('Error') ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            <span>{connectionStatus}</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          🔒 <span className="font-medium">Secure & Private:</span> Your credentials are stored locally and never shared with third parties
        </p>
      </div>
    </div>
  );
};