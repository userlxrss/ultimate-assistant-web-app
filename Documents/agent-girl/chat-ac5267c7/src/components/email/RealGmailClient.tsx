import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Check, AlertCircle, Trash2, Star, Link, Settings, User, Lock, Eye, EyeOff, LogOut, Reply } from 'lucide-react';
import { Email } from '../../../types/email';
import { authManager } from '../../utils/authManager';
import { EmailComposer } from './EmailComposer';

export const RealGmailClient: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [gmailAddress, setGmailAddress] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', cc: '', bcc: '' });
  const [isReplying, setIsReplying] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);

  useEffect(() => {
    // Try to restore existing Gmail session
    const gmailSession = authManager.getGmailSession();
    if (gmailSession) {
      console.log('📧 Restoring Gmail session for:', gmailSession.email);
      setSessionId(gmailSession.sessionId);
      setGmailAddress(gmailSession.email);
      setIsAuthenticated(true);

      // Load emails after a short delay to ensure server is ready
      setTimeout(() => {
        loadEmails();
      }, 1000);
    } else {
      console.log('📧 No existing Gmail session found - authentication required');
    }
  }, []);

  // Auto-load emails when component becomes visible/authenticated
  useEffect(() => {
    if (isAuthenticated && emails.length === 0) {
      console.log('📧 Component is authenticated but has no emails - auto-loading...');
      loadEmails();
    }
  }, [isAuthenticated, emails.length]);

  // Check if emails need refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && emails.length === 0) {
        console.log('📧 Tab became visible and needs emails - loading...');
        loadEmails();
      }
    };

    // Listen for custom tab activation event from MainApp
    const handleTabActivation = () => {
      if (isAuthenticated && emails.length === 0) {
        console.log('📧 Tab activated and needs emails - loading...');
        loadEmails();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('tabActivated', handleTabActivation);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('tabActivated', handleTabActivation);
    };
  }, [isAuthenticated, emails.length]);

  // Debug: Monitor emails state changes
  useEffect(() => {
    console.log('📧 Emails state updated:', emails.length, 'emails');
    if (emails.length > 0) {
      console.log('📧 First email in state:', emails[0].subject);
    }
  }, [emails]);

  const saveSession = (newSessionId: string, email: string) => {
    // Use auth manager to save persistent session
    authManager.saveGmailSession(newSessionId, email);
    setSessionId(newSessionId);
    setGmailAddress(email);
    setIsAuthenticated(true);
    console.log('📧 Gmail session saved persistently for:', email);
  };

  const clearSession = () => {
    // Use auth manager to clear persistent session
    authManager.clearGmailSession();
    setSessionId('');
    setGmailAddress('');
    setAppPassword('');
    setIsAuthenticated(false);
    setEmails([]);
    setSelectedEmail(null);
    setError('');
    console.log('📧 Gmail session cleared');
  };

  const handleAuthenticate = async () => {
    if (!gmailAddress.trim() || !appPassword.trim()) {
      setError('Please enter your Gmail address and App Password');
      return;
    }

    if (!gmailAddress.includes('@gmail.com')) {
      setError('Please enter a valid Gmail address (@gmail.com)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting Gmail authentication for:', gmailAddress);
      console.log('📡 Sending request to: http://localhost:3050/api/gmail/authenticate');

      const response = await fetch('http://localhost:3050/api/gmail/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: gmailAddress,
          appPassword: appPassword
        })
      });

      console.log('📬 Response status:', response.status);
      console.log('📬 Response headers:', response.headers);

      const data = await response.json();
      console.log('📬 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      saveSession(data.sessionId, gmailAddress);
      showSuccess('Gmail authenticated successfully!');

      console.log('✅ Gmail authentication successful! Session saved:', data.sessionId);
      console.log('📧 Now loading your emails...');

      // Load emails with error handling
      try {
        await loadEmails();
        console.log('📬 Emails loaded successfully!');
      } catch (emailError) {
        console.error('⚠️ Email loading failed, but auth worked:', emailError);
        // Don't fail the whole authentication if email loading fails
      }

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmails = async () => {
    if (!sessionId) {
      setError('Please authenticate with Gmail first');
      return;
    }

    console.log('📧 Loading real emails from Gmail with session:', sessionId);
    setIsLoading(true);
    setError('');

    // Fetch real emails directly (no mock data)
    try {
      const url = `http://localhost:3050/api/gmail/emails/${sessionId}?limit=50`;
      console.log('📡 Fetching real emails from:', url);

      const response = await fetch(url);
      console.log('📬 Email response status:', response.status);

      if (response.status === 401) {
        // Session expired or invalid - clear it and require re-authentication
        console.log('🔐 Session expired (401), clearing session and requiring re-authentication');
        clearSession();
        setError('Your Gmail session has expired. Please authenticate again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.status}`);
      }

      const data = await response.json();
      console.log('📬 Real email data received:', data);
      console.log('📬 Number of emails:', data.emails?.length || 0);

      if (data.error) {
        throw new Error(data.error);
      }

      const emailList = data.emails || [];
      if (emailList.length > 0) {
        console.log('📧 Real emails loaded successfully:', emailList.length, 'emails');

        // Add snippets to emails by fetching first 200 characters
        const emailsWithSnippets = emailList.map(email => ({
          ...email,
          snippet: email.snippet || 'Click to view email content...'
        }));

        setEmails(emailsWithSnippets);
        console.log('✅ Real email list loaded! Current email count:', emailsWithSnippets.length);

        // Log the first email for verification
        console.log('📧 First email subject:', emailsWithSnippets[0].subject);
        console.log('📧 First email from:', emailsWithSnippets[0].from?.name || emailsWithSnippets[0].from?.email);
      } else {
        console.log('📧 No emails found in inbox');
        setEmails([]);
      }
    } catch (err) {
      console.error('❌ Failed to load real emails:', err);
      if (err instanceof Error && err.message.includes('401')) {
        clearSession();
        setError('Your Gmail session has expired. Please authenticate again.');
      } else {
        setError('Failed to load emails. Please check your connection and try again.');
      }
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  
  
  const handleSendEmail = async (emailData: any) => {
    if (!sessionId) {
      setError('Please authenticate with Gmail first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3050/api/gmail/send/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to.map((addr: any) => addr.email).join(','),
          subject: emailData.subject,
          body: emailData.body,
          cc: emailData.cc && emailData.cc.length > 0 ? emailData.cc.map((addr: any) => addr.email).join(',') : undefined,
          bcc: emailData.bcc && emailData.bcc.length > 0 ? emailData.bcc.map((addr: any) => addr.email).join(',') : undefined,
          replyTo: emailData.replyTo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      setIsComposing(false);
      setIsReplying(false);
      setReplyToEmail(null);
      setComposeData({ to: '', subject: '', body: '', cc: '', bcc: '' });
      showSuccess('Email sent successfully!');
      loadEmails(); // Refresh inbox

    } catch (err) {
      console.error('Send email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setReplyToEmail(selectedEmail);
      setIsReplying(true);
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyToEmail(null);
  };

  const handleToggleRead = async (emailId: string, currentReadStatus: boolean) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`http://localhost:3050/api/gmail/email/${sessionId}/${emailId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: !currentReadStatus })
      });

      if (response.ok) {
        setEmails(emails.map(email =>
          email.id === emailId ? { ...email, isRead: !currentReadStatus } : email
        ));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail({ ...selectedEmail, isRead: !currentReadStatus });
        }
      }
    } catch (err) {
      console.error('Toggle read error:', err);
    }
  };

  const handleToggleStar = async (emailId: string, currentStarred: boolean) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`http://localhost:3050/api/gmail/email/${sessionId}/${emailId}/star`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isStarred: !currentStarred })
      });

      if (response.ok) {
        setEmails(emails.map(email =>
          email.id === emailId ? { ...email, isStarred: !currentStarred } : email
        ));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail({ ...selectedEmail, isStarred: !currentStarred });
        }
      }
    } catch (err) {
      console.error('Toggle star error:', err);
    }
  };

  const handleDelete = async (emailId: string) => {
    if (!sessionId) return;

    if (!confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3050/api/gmail/email/${sessionId}/${emailId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEmails(emails.filter(email => email.id !== emailId));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null);
        }
        showSuccess('Email deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete email');
    }
  };

  const showSuccess = (message: string) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => document.body.removeChild(successDiv), 3000);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return new Date(date).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center">
            Connect Real Gmail Account
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Access your actual Gmail emails with App Password authentication
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Setup (2 minutes):</h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Go to Gmail Settings → Forwarding and POP/IMAP</li>
              <li>Enable IMAP Access and save</li>
              <li>Visit: google.com/account/apppasswords</li>
              <li>Generate 16-digit App Password for "Mail"</li>
              <li>Enter your Gmail and App Password below</li>
            </ol>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              🔒 <strong>Secure:</strong> Your App Password is only used for IMAP/SMTP access and is never stored permanently.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gmail Address:
              </label>
              <input
                type="email"
                value={gmailAddress}
                onChange={(e) => setGmailAddress(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                App Password (16 digits):
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleAuthenticate}
              disabled={isLoading || !gmailAddress.trim() || !appPassword.trim()}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Connect Gmail
                </>
              )}
            </button>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                💡 <strong>Real Gmail:</strong> Access your actual Gmail inbox, send real emails, and manage your account professionally.
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
              {gmailAddress}
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
                To: <span className="text-red-500">*</span>
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
                CC:
              </label>
              <input
                type="email"
                value={composeData.cc}
                onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                placeholder="cc@example.com (optional)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject: <span className="text-red-500">*</span>
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
                Message: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={composeData.body}
                onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                placeholder="Type your message here..."
                rows={12}
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
            Connected (Real IMAP)
          </span>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            <User className="w-3 h-3" />
            {gmailAddress}
          </div>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full">
            {emails.length} emails
          </span>
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
            onClick={clearSession}
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
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
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
                    className={`p-4 border-b border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors ${
                      !email.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    } ${selectedEmail?.id === email.id ? 'ring-2 ring-red-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white truncate flex-1`}>
                        {email.from?.name || email.from?.email}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {email.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(email.date)}
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span>From: {selectedEmail.from?.name || selectedEmail.from?.email}</span>
                      <span>To: {selectedEmail.to?.[0]?.email}</span>
                      <span>{formatDate(selectedEmail.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRead(selectedEmail.id, selectedEmail.isRead)}
                      className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Mark as read/unread"
                    >
                      <Mail className={`w-4 h-4 ${selectedEmail.isRead ? 'text-gray-400' : 'text-blue-500'}`} />
                    </button>
                    <button
                      onClick={() => handleToggleStar(selectedEmail.id, selectedEmail.isStarred)}
                      className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Star/Unstar"
                    >
                      <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={handleReply}
                      className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Delete"
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

                {/* Quick Reply Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={handleReply}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
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

      {/* Email Composer for Reply */}
      {isReplying && replyToEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <EmailComposer
              onSend={handleSendEmail}
              onCancel={handleCancelReply}
              replyToEmail={replyToEmail}
            />
          </div>
        </div>
      )}
    </div>
  );
};