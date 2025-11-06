import React, { useState, useEffect } from 'react';
import { Mail, Link, Check, AlertCircle, RefreshCw, Settings, Calendar, ExternalLink } from 'lucide-react';
import { realGmailAPI } from '../../utils/realGmailAPI';

export const GmailSettings: React.FC = React.memo(() => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [gmailAddress, setGmailAddress] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    realGmailAPI.loadSavedConnection();
    if (realGmailAPI.isAuthenticated()) {
      setIsConnected(true);
      testConnection();
    }
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Connecting to Gmail and fetching your actual emails...');
      const gmailEmails = await realGmailAPI.getRecentEmails();
      setEmails(gmailEmails);
      setStatus(`🎉 SUCCESS! Found ${gmailEmails.length} of your REAL Gmail emails!`);
    } catch (error) {
      setStatus('❌ Gmail connection failed: ' + (error as Error).message + ' (This may be due to CORS restrictions)');
    }
  };

  const handleConnect = async () => {
    if (!gmailAddress.trim()) {
      setStatus('Please enter your Gmail address');
      return;
    }

    setIsConnecting(true);
    setStatus('Connecting to your Gmail account...');

    try {
      realGmailAPI.connect(gmailAddress);
      setIsConnected(true);

      // Test the connection and fetch REAL emails
      await testConnection();
    } catch (error) {
      setStatus('Failed to connect to Gmail: ' + (error as Error).message);
      setIsConnecting(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    realGmailAPI.clearConnection();
    setIsConnected(false);
    setEmails([]);
    setStatus('Disconnected from Gmail');
    setGmailAddress('');
  };

  const handleRefresh = async () => {
    if (!isConnected) return;

    setIsConnecting(true);
    setStatus('Refreshing emails...');

    try {
      await testConnection();
    } catch (error) {
      setStatus('Refresh failed: ' + (error as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const instructions = [
    'Open Gmail and go to Settings (gear icon ⚙️)',
    'Click "See all settings"',
    'Go to "Forwarding and POP/IMAP" tab',
    'Enable IMAP access',
    'Save changes',
    'Enter your Gmail address below',
    'Click "Connect Gmail" to sync emails'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gmail Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Connect your Gmail via iCal feed</p>
          </div>
        </div>

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {showInstructions && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📧 Gmail iCal Setup Instructions
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                {instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
              <p className="text-xs mt-3 text-blue-600 dark:text-blue-400">
                💡 This uses Gmail's Atom feed - no API keys required, just like your calendar integration!
              </p>
            </div>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Connected to Gmail</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {emails.length} recent emails available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isConnecting}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-green-600 dark:text-green-400 ${isConnecting ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>

          {status && (
            <div className={`p-3 rounded-lg text-sm ${
              status.includes('Connected') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              status.includes('failed') || status.includes('Failed') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {status.includes('Connected') ? <Check className="w-4 h-4" /> :
                 status.includes('failed') ? <AlertCircle className="w-4 h-4" /> :
                 <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{status}</span>
              </div>
            </div>
          )}

          {emails.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Emails</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {emails.slice(0, 3).map((email) => (
                  <div key={email.id} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {email.subject}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          From: {email.from.name || email.from.email}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {emails.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  ... and {emails.length - 3} more emails
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Where to see emails:</strong> Go to the Email tab in your dashboard to view and manage your Gmail messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gmail Address
            </label>
            <input
              type="email"
              value={gmailAddress}
              onChange={(e) => setGmailAddress(e.target.value)}
              placeholder="your.email@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter your Gmail address to connect via iCal feed
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !gmailAddress.trim()}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link className="w-4 h-4" />
                Connect Gmail
              </>
            )}
          </button>

          {status && (
            <div className={`p-3 rounded-lg text-sm ${
              status.includes('Connected') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              status.includes('failed') || status.includes('Failed') || status.includes('Please') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {status.includes('Connected') ? <Check className="w-4 h-4" /> :
                 status.includes('failed') || status.includes('Please') ? <AlertCircle className="w-4 h-4" /> :
                 <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{status}</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🔗 <strong>No API Keys Required:</strong> Uses Gmail's Atom feed, just like your calendar integration!
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
GmailSettings.displayName = "GmailSettings";
