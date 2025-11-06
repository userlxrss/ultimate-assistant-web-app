import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Check, AlertCircle, Trash2, Star, Link, Settings, User, ExternalLink, Shield } from 'lucide-react';
import { Email } from '../../types/email';

interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
    name: string;
    picture: string;
  };
}

export const GmailOAuthClient: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [showAuthHelp, setShowAuthHelp] = useState(false);

  const PROXY_SERVER_URL = 'http://localhost:3011';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${PROXY_SERVER_URL}/api/auth/status`, {
        credentials: 'include'
      });
      const status = await response.json();
      setAuthStatus(status);

      if (status.authenticated) {
        loadEmails();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setError('Unable to connect to Gmail proxy server. Make sure it\'s running on localhost:3011');
    }
  };

  const loadEmails = async () => {
    if (!authStatus.authenticated) {
      setError('Please authenticate with Gmail first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${PROXY_SERVER_URL}/api/gmail/emails?maxResults=50`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch emails: ${response.status}`);
      }

      const data = await response.json();
      setEmails(data.messages || []);
    } catch (err) {
      console.error('Failed to load Gmail:', err);
      setError('Failed to load Gmail emails. Please try re-authenticating.');
      if (err.message.includes('Token expired')) {
        setAuthStatus({ authenticated: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${PROXY_SERVER_URL}/auth/google`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const { authUrl } = await response.json();

      // Open OAuth popup
      const popup = window.open(authUrl, 'gmail-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      if (!popup) {
        setError('Please allow popups for this site');
        setIsLoading(false);
        return;
      }

      // Poll for authentication completion
      const checkAuth = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${PROXY_SERVER_URL}/api/auth/status`, {
            credentials: 'include'
          });
          const status = await statusResponse.json();

          if (status.authenticated) {
            setAuthStatus(status);
            clearInterval(checkAuth);
            popup.close();
            setIsLoading(false);
            loadEmails();
          }

          if (popup.closed) {
            clearInterval(checkAuth);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      }, 2000);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkAuth);
        if (!popup.closed) {
          popup.close();
        }
        setIsLoading(false);
      }, 120000); // 2 minutes

    } catch (error) {
      console.error('Authentication error:', error);
      setError('Failed to start authentication process');
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${PROXY_SERVER_URL}/api/gmail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to send email: ${response.status}`);
      }

      const result = await response.json();

      setIsComposing(false);
      setComposeData({ to: '', subject: '', body: '' });

      showSuccess('Email sent successfully!');
      loadEmails(); // Refresh inbox
    } catch (err) {
      setError('Failed to send email: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${PROXY_SERVER_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      setAuthStatus({ authenticated: false });
      setEmails([]);
      setSelectedEmail(null);
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const showSuccess = (message: string) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => document.body.removeChild(successDiv), 3000);
  };

  const handleToggleRead = (emailId: string) => {
    setEmails(emails.map(email =>
      email.id === emailId ? { ...email, isRead: !email.isRead } : email
    ));
  };

  const handleToggleStar = (emailId: string) => {
    setEmails(emails.map(email =>
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const handleDelete = (emailId: string) => {
    setEmails(emails.filter(email => email.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (!authStatus.authenticated) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center">
            Connect Gmail via OAuth 2.0
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Securely connect your Gmail account to read and send emails using OAuth 2.0 authentication.
          </p>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Secure & Official:</h3>
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Uses Google's official OAuth 2.0 authentication</li>
              <li>• Your password is never stored or shared</li>
              <li>• Limited permissions (read & send emails only)</li>
              <li>• Can be revoked at any time</li>
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Connect Gmail Account
                </>
              )}
            </button>

            <button
              onClick={() => setShowAuthHelp(!showAuthHelp)}
              className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              {showAuthHelp ? 'Hide' : 'Show'} Setup Instructions
            </button>

            {showAuthHelp && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Setup Instructions:</h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
                  <li>Make sure the Gmail OAuth server is running on localhost:3011</li>
                  <li>Click "Connect Gmail Account" above</li>
                  <li>A Google sign-in window will open</li>
                  <li>Sign in with your Gmail account (tuescalarina3@gmail.com)</li>
                  <li>Grant permission to read and send emails</li>
                  <li>You'll be redirected back automatically</li>
                </ol>

                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> The first time you connect, Google will ask for permission.
                    This is normal and required for the app to access your emails.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>⚠️ Important:</strong> Make sure the Gmail OAuth server is running on localhost:3011
                before attempting to connect.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isComposing) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compose Email</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
              <User className="w-3 h-3" />
              {authStatus.user?.email}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To:
              </label>
              <input
                type="email"
                value={composeData.to}
                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject:
              </label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                placeholder="Email subject"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message:
              </label>
              <textarea
                value={composeData.body}
                onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                placeholder="Type your message here..."
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSendEmail}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
              <button
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gmail</h1>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
            Connected (OAuth 2.0)
          </span>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            <User className="w-3 h-3" />
            {authStatus.user?.email}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEmails}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </>
            )}
          </button>

          <button
            onClick={() => setIsComposing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Compose
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Inbox ({emails.length})</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {emails.length === 0 ? (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {isLoading ? 'Loading emails...' : 'No emails found'}
                </p>
              ) : (
                emails.map(email => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !email.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${selectedEmail?.id === email.id ? 'ring-2 ring-red-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white truncate flex-1`}>
                        {email.from?.name || email.from?.email}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {email.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(new Date(email.date))}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white mb-1 truncate`}>
                      {email.subject}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {email.snippet}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Email Viewer */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span>From: {selectedEmail.from?.name || selectedEmail.from?.email}</span>
                      <span>To: {selectedEmail.to?.[0]?.email}</span>
                      <span>{formatDate(new Date(selectedEmail.date))}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRead(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Mail className={`w-4 h-4 ${selectedEmail.isRead ? 'text-gray-400' : 'text-blue-500'}`} />
                    </button>
                    <button
                      onClick={() => handleToggleStar(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedEmail.body}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select an email
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose an email from the inbox to view its contents
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};