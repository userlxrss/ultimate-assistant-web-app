import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Mail, Send, RefreshCw, Check, AlertCircle, Trash2, Star, Link, Settings, User, Lock, Eye, EyeOff, LogOut, Reply, Search, Filter, Archive, Inbox, Clock, Zap, Shield, ArrowLeft, Paperclip, Download, ExternalLink, X } from 'lucide-react';
import { Email } from '../../types/email';

interface CachedEmails {
  emails: Email[];
  timestamp: number;
  sessionId: string;
}

const SophisticatedEmailClient: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [gmailAddress, setGmailAddress] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isStarAnimating, setIsStarAnimating] = useState(false);
  const [emailTransitioning, setEmailTransitioning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: ''
  });

  // CRITICAL FIX: Use port 3007 for working simple Gmail server
  const GMAIL_SERVER_PORT = '3007';

  // Enhanced error handling with comprehensive logging
  const fetchWithRetry = useCallback(async (url: string, options: RequestInit = {}, maxRetries = 3) => {
    let lastError: Error | null = null;

    console.log('🔍 GMAIL API DEBUG - Attempting connection to:', url);
    console.log('🔍 GMAIL API DEBUG - Request options:', options);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Gmail API Request (attempt ${attempt}/${maxRetries}):`, url);

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        console.log('📡 Gmail API Response Status:', response.status);
        console.log('📡 Gmail API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Gmail API Response Success:', data);
          console.log('✅ Gmail API - Fetched', data.emails?.length || 0, 'emails');
          return { response, data };
        } else {
          const errorText = await response.text();
          console.error(`❌ Gmail API Error (${response.status}):`, errorText);
          console.error('❌ Full error details:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            errorText: errorText
          });

          if (response.status === 401) {
            throw new Error('Authentication expired. Please reconnect your Gmail account.');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          } else if (response.status >= 500) {
            throw new Error('Gmail server error. Please try again in a few moments.');
          } else {
            throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
          }
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error occurred');
        console.error(`❌ Attempt ${attempt} failed:`, lastError);
        console.error('❌ Full error object:', lastError);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ All retry attempts failed. Last error:', lastError);
    throw lastError;
  }, []);

  // Initialize from persistent storage
  useEffect(() => {
    const initializeFromStorage = () => {
      try {
        // Check for existing Gmail session
        const storedSession = localStorage.getItem('gmail_session');
        const storedEmails = localStorage.getItem('gmail_emails_cache');

        if (storedSession) {
          const session = JSON.parse(storedSession);
          console.log('📧 Restoring persistent Gmail session for:', session.email);
          setSessionId(session.sessionId);
          setGmailAddress(session.email);
          setIsAuthenticated(true);
          setLastSyncTime(new Date(session.lastSync || Date.now()));
        }

        // Load cached emails if available and recent (within 5 minutes)
        if (storedEmails) {
          const cached: CachedEmails = JSON.parse(storedEmails);
          const now = Date.now();
          const cacheAge = now - cached.timestamp;

          if (cacheAge < 5 * 60 * 1000 && cached.sessionId === sessionId) { // 5 minutes cache
            console.log('📧 Loading emails from cache (age:', Math.round(cacheAge / 1000), 'seconds)');
            setEmails(cached.emails);

            // Auto-refresh if cache is older than 2 minutes
            if (cacheAge > 2 * 60 * 1000) {
              setTimeout(() => loadEmails(true), 1000);
            }
          } else {
            console.log('📧 Cache expired or invalid, fetching fresh emails');
            if (sessionId) {
              setTimeout(() => loadEmails(true), 500);
            }
          }
        } else if (sessionId) {
          // No cache but authenticated, load emails
          setTimeout(() => loadEmails(true), 500);
        }
      } catch (error) {
        console.error('❌ Failed to initialize from storage:', error);
        // Clear corrupted data
        localStorage.removeItem('gmail_session');
        localStorage.removeItem('gmail_emails_cache');
      }
    };

    initializeFromStorage();
  }, [sessionId]);

  // Auto-refresh emails every 5 minutes when enabled
  useEffect(() => {
    if (!autoRefreshEnabled || !isAuthenticated) return;

    const interval = setInterval(() => {
      console.log('📧 Auto-refreshing emails...');
      loadEmails(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, isAuthenticated]);

  // Save session to persistent storage
  const saveSession = useCallback((newSessionId: string, email: string) => {
    const session = {
      sessionId: newSessionId,
      email: email,
      timestamp: Date.now(),
      lastSync: Date.now()
    };

    localStorage.setItem('gmail_session', JSON.stringify(session));
    setSessionId(newSessionId);
    setGmailAddress(email);
    setIsAuthenticated(true);
    setLastSyncTime(new Date());

    console.log('📧 Gmail session saved persistently for:', email);
  }, []);

  // Cache emails to localStorage for fast loading
  const cacheEmails = useCallback((emailList: Email[]) => {
    const cache: CachedEmails = {
      emails: emailList,
      timestamp: Date.now(),
      sessionId: sessionId
    };

    localStorage.setItem('gmail_emails_cache', JSON.stringify(cache));
    console.log('📧 Cached', emailList.length, 'emails for fast loading');
  }, [sessionId]);

  // Clear all stored data
  const clearAllData = useCallback(() => {
    localStorage.removeItem('gmail_session');
    localStorage.removeItem('gmail_emails_cache');
    setSessionId('');
    setGmailAddress('');
    setAppPassword('');
    setIsAuthenticated(false);
    setEmails([]);
    setSelectedEmail(null);
    setError('');
    setLastSyncTime(null);
    console.log('📧 All Gmail data cleared');
  }, []);

  const handleAuthenticate = useCallback(async () => {
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

      // CRITICAL FIX: Use correct port 3007
      const authUrl = `http://localhost:${GMAIL_SERVER_PORT}/api/gmail/authenticate`;
      console.log('🔍 AUTH URL:', authUrl);

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gmailAddress,
          appPassword: appPassword
        })
      });

      console.log('🔍 AUTH RESPONSE STATUS:', response.status);
      const data = await response.json();
      console.log('🔍 AUTH RESPONSE DATA:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      saveSession(data.sessionId, gmailAddress);
      showNotification('Gmail authenticated successfully!', 'success');
      setRetryCount(0); // Reset retry count on successful auth

      // Load emails immediately after authentication
      await loadEmails(true);

    } catch (err) {
      console.error('❌ Authentication error:', err);
      console.error('❌ Full auth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [gmailAddress, appPassword, saveSession]);

  const loadEmails = useCallback(async (isBackgroundRefresh = false) => {
    if (!sessionId) {
      setError('Please authenticate with Gmail first');
      return;
    }

    if (!isBackgroundRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError('');

    try {
      // CRITICAL FIX: Use correct port 3007
      const url = `http://localhost:${GMAIL_SERVER_PORT}/api/gmail/emails/${sessionId}?limit=100`;
      console.log('📡 Fetching emails from:', url);
      console.log('📡 Session ID:', sessionId);

      const { response, data } = await fetchWithRetry(url);

      console.log('📡 Email fetch response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const emailList = data.emails || [];

      if (emailList.length > 0) {
        // Process and optimize emails
        const optimizedEmails = emailList.map((email: any) => ({
          ...email,
          snippet: email.snippet || email.body?.substring(0, 150) + '...' || 'No preview',
          body: email.body || '',
          to: email.to ? [email.to] : [],
          attachments: email.attachments || [],
          labels: email.labels || [],
          isImportant: email.isImportant || false,
          folder: email.folder || 'inbox',
          threadId: email.threadId || email.id,
          html: email.html || null
        }));

        setEmails(optimizedEmails);
        cacheEmails(optimizedEmails);
        setLastSyncTime(new Date());
        setRetryCount(0); // Reset retry count on success

        console.log('✅ Loaded', optimizedEmails.length, 'emails successfully');

        if (!isBackgroundRefresh) {
          showNotification(`Loaded ${optimizedEmails.length} emails`, 'success');
        }
      } else {
        setEmails([]);
        showNotification('No emails found in inbox', 'info');
      }

    } catch (err) {
      console.error('❌ Failed to load emails:', err);
      console.error('❌ Full email loading error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load emails';

      if (errorMessage.includes('401') || errorMessage.includes('Authentication expired')) {
        clearAllData();
        setError('Your Gmail session has expired. Please authenticate again.');
      } else if (errorMessage.includes('429') || errorMessage.includes('Too many requests')) {
        setError('Rate limit exceeded. Please wait a moment before trying again.');
      } else {
        setError(errorMessage);
      }

      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sessionId, cacheEmails, clearAllData, fetchWithRetry]);

  // Enhanced reconnection handler
  const handleReconnect = useCallback(async () => {
    setIsReconnecting(true);
    setError('');

    try {
      // Clear current session
      clearAllData();

      // Brief delay before allowing re-authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      showNotification('Please authenticate with Gmail again', 'info');
    } catch (err) {
      console.error('Reconnection error:', err);
      setError('Failed to reconnect. Please try again.');
    } finally {
      setIsReconnecting(false);
    }
  }, [clearAllData]);

  // Filter emails based on search and filter
  const filteredEmails = useMemo(() => {
    let filtered = emails;

    // Apply filter
    if (selectedFilter === 'unread') {
      filtered = filtered.filter(email => !email.isRead);
    } else if (selectedFilter === 'starred') {
      filtered = filtered.filter(email => email.isStarred);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject?.toLowerCase().includes(query) ||
        email.from?.name?.toLowerCase().includes(query) ||
        email.from?.email?.toLowerCase().includes(query) ||
        email.snippet?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [emails, searchQuery, selectedFilter]);

  const handleSendEmail = useCallback(async (emailData: any) => {
    if (!sessionId) {
      setError('Please authenticate with Gmail first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // CRITICAL FIX: Use correct port 3007
      const response = await fetch(`http://localhost:${GMAIL_SERVER_PORT}/api/gmail/send/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          cc: emailData.cc,
          bcc: emailData.bcc
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      setIsComposing(false);
      setComposeData({ to: '', subject: '', body: '', cc: '', bcc: '' });
      showNotification('Email sent successfully!', 'success');

      // Refresh emails after sending
      await loadEmails(true);

    } catch (err) {
      console.error('Send email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, loadEmails]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const formatDate = (date: Date | string) => {
    const now = new Date();
    const emailDate = new Date(date);
    const diff = now.getTime() - emailDate.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return emailDate.toLocaleDateString();
  };

  const handleStarToggle = useCallback(() => {
    if (!selectedEmail) return;

    setIsStarAnimating(true);
    setTimeout(() => setIsStarAnimating(false), 600);

    // Update local state immediately for responsive UI
    const updatedEmail = { ...selectedEmail, isStarred: !selectedEmail.isStarred };
    setSelectedEmail(updatedEmail);

    // Update emails list
    setEmails(prevEmails =>
      prevEmails.map(email =>
        email.id === selectedEmail.id ? updatedEmail : email
      )
    );
  }, [selectedEmail]);

  const handleSelectEmail = useCallback((email: Email) => {
    setEmailTransitioning(true);
    setTimeout(() => {
      setSelectedEmail(email);
      setEmailTransitioning(false);

      // Mark email as read
      if (!email.isRead) {
        setEmails(prevEmails =>
          prevEmails.map(e =>
            e.id === email.id ? { ...e, isRead: true } : e
          )
        );
      }
    }, 150);
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return { icon: '📄', color: '#DC2626' };
    if (mimeType.includes('word') || mimeType.includes('document')) return { icon: '📝', color: '#2563EB' };
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return { icon: '📊', color: '#059669' };
    if (mimeType.includes('image')) return { icon: '🖼️', color: '#7C3AED' };
    if (mimeType.includes('zip') || mimeType.includes('rar')) return { icon: '📦', color: '#EA580C' };
    return { icon: '📎', color: '#6B7280' };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                <Mail className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Gmail Client
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Professional email management with persistent authentication
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl mb-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Lightning Fast Setup</p>
                  <ol className="text-blue-700 dark:text-blue-300 space-y-1">
                    <li>1. Enable IMAP in Gmail Settings</li>
                    <li>2. Generate App Password at google.com/account/apppasswords</li>
                    <li>3. Connect once - stay logged in automatically</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Gmail Address
                </label>
                <input
                  type="email"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  App Password (16 digits)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleAuthenticate}
                disabled={isLoading || !gmailAddress.trim() || !appPassword.trim()}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-3 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Connect Gmail Securely
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Your credentials are encrypted and stored locally for convenience
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compose Email UI
  if (isComposing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compose Email</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">From: {gmailAddress}</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={composeData.to}
                    onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    CC
                  </label>
                  <input
                    type="email"
                    value={composeData.cc}
                    onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                    placeholder="cc@example.com (optional)"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  placeholder="Email subject"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                  placeholder="Type your message here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all duration-200"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSendEmail(composeData)}
                  disabled={isLoading || !composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-3 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsComposing(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Email Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gmail</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                    Connected
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {lastSyncTime && `Last sync: ${formatDate(lastSyncTime)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <User className="w-3 h-3" />
              {gmailAddress}
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              <Inbox className="w-3 h-3" />
              {filteredEmails.length} emails
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                autoRefreshEnabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title="Auto-refresh every 5 minutes"
            >
              <Clock className="w-4 h-4" />
            </button>

            <button
              onClick={() => loadEmails(true)}
              disabled={isLoading || isRefreshing}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
            >
              {(isLoading || isRefreshing) ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>

            <button
              onClick={() => setIsComposing(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Mail className="w-4 h-4" />
              Compose
            </button>

            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* PREMIUM ENHANCED ERROR BANNER WITH EXACT STYLING */}
      {error && (
        <div
          className="mx-6 mt-4 rounded-lg shadow-lg animate-slide-down"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
            border: '1px solid #FECACA',
            borderLeft: '4px solid #EF4444',
            borderRadius: '10px',
            margin: '16px 20px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
          }}
        >
          {/* Error icon and message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              fontSize: '16px',
              fontWeight: '700'
            }}>!</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#991B1B', marginBottom: '2px' }}>
                Failed to fetch
              </div>
              <div style={{ fontSize: '13px', color: '#B91C1C' }}>
                {error}
              </div>
              {retryCount > 2 && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '2px' }}>
                  Multiple failed attempts. Consider reconnecting your Gmail account.
                </div>
              )}
            </div>
          </div>

          {/* Retry and Close buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!error.includes('expired') && (
              <button
                onClick={() => loadEmails(true)}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1.5px solid #EF4444',
                  borderRadius: '6px',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
              >
                Retry
              </button>
            )}
            {error.includes('expired') && (
              <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1.5px solid #EF4444',
                  borderRadius: '6px',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isReconnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                Reconnect
              </button>
            )}
            <button
              onClick={() => setError('')}
              style={{
                width: '28px',
                height: '28px',
                background: 'transparent',
                border: 'none',
                color: '#991B1B',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="px-6 py-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedFilter === 'all'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Inbox className="w-4 h-4 inline mr-1" />
                All
              </button>
              <button
                onClick={() => setSelectedFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedFilter === 'unread'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-1" />
                Unread
              </button>
              <button
                onClick={() => setSelectedFilter('starred')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedFilter === 'starred'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1" />
                Starred
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedFilter === 'all' && 'All Emails'}
                  {selectedFilter === 'unread' && 'Unread Emails'}
                  {selectedFilter === 'starred' && 'Starred Emails'}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({filteredEmails.length})
                  </span>
                </h3>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {isLoading && filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Loading emails...</p>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 40px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                      animation: 'float 3s ease-in-out infinite'
                    }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2"/>
                        <path d="M3 7l9 6 9-6"/>
                      </svg>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                      {searchQuery ? 'No matching emails' : 'Your inbox is empty'}
                    </h3>

                    <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px', maxWidth: '280px' }}>
                      {searchQuery
                        ? 'Try adjusting your search terms or filters'
                        : 'No emails to display. Your emails will appear here when they arrive.'
                      }
                    </p>

                    {!searchQuery && (
                      <button
                        onClick={() => setIsComposing(true)}
                        style={{
                          padding: '12px 28px',
                          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 7h18M3 12h18M3 17h18"/>
                        </svg>
                        Compose Email
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmails.map(email => (
                      <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                          !email.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                        } ${selectedEmail?.id === email.id ? 'ring-2 ring-red-500 bg-gray-50 dark:bg-gray-700/50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!email.isRead && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: '#3B82F6' }}
                                ></div>
                              )}
                              <span className={`text-sm truncate ${
                                !email.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {email.from?.name || email.from?.email}
                              </span>
                            </div>
                            <div className={`text-sm mb-1 ${
                              !email.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {email.subject}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {email.snippet}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {email.isStarred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(email.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PREMIUM EMAIL DETAIL PANEL WITH EXACT STYLING */}
          <div className="lg:col-span-2">
            {selectedEmail ? (
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  background: 'linear-gradient(to bottom, #FFFFFF, #FAFBFC)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
                  margin: '20px',
                  opacity: emailTransitioning ? 0.8 : 1,
                  transform: emailTransitioning ? 'translateY(10px)' : 'translateY(0)'
                }}
              >
                {/* EXACT HEADER SECTION */}
                <div style={{
                  padding: '28px 32px',
                  borderBottom: '1px solid #E2E8F0',
                  background: 'linear-gradient(to bottom, #FFFFFF, #FAFBFC)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '22px',
                        fontWeight: '600',
                        boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                        border: '3px solid white'
                      }}>
                        {(selectedEmail.from?.name || selectedEmail.from?.email || 'Unknown').charAt(0).toUpperCase()}
                      </div>

                      {/* Sender Info */}
                      <div>
                        <div style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: '#0F172A',
                          marginBottom: '4px'
                        }}>
                          {selectedEmail.from?.name || selectedEmail.from?.email || 'Unknown Sender'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#64748B'
                        }}>
                          To: {selectedEmail.to?.[0]?.email || gmailAddress}
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#94A3B8'
                    }}>
                      {formatDate(selectedEmail.date)}
                    </div>
                  </div>
                </div>

                {/* EXACT ACTION ICONS */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px 32px',
                  borderBottom: '1px solid #F1F5F9'
                }}>
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.querySelector('svg').style.color = '#64748B';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.querySelector('svg').style.color = '#94A3B8';
                    }}
                    onClick={() => setSelectedEmail(null)}
                  >
                    <ArrowLeft style={{ color: '#94A3B8', width: '20px', height: '20px' }} />
                  </button>

                  <button
                    style={{
                      background: selectedEmail.isStarred ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedEmail.isStarred) {
                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                        e.currentTarget.querySelector('svg').style.color = '#FBBF24';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedEmail.isStarred) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.querySelector('svg').style.color = '#94A3B8';
                      }
                    }}
                    onClick={handleStarToggle}
                  >
                    <Star style={{
                      color: selectedEmail.isStarred ? '#FBBF24' : '#94A3B8',
                      width: '20px',
                      height: '20px',
                      fill: selectedEmail.isStarred ? 'currentColor' : 'none'
                    }} />
                  </button>

                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.querySelector('svg').style.color = '#3B82F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.querySelector('svg').style.color = '#94A3B8';
                    }}
                  >
                    <Archive style={{ color: '#94A3B8', width: '20px', height: '20px' }} />
                  </button>

                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.querySelector('svg').style.color = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.querySelector('svg').style.color = '#94A3B8';
                    }}
                  >
                    <Trash2 style={{ color: '#94A3B8', width: '20px', height: '20px' }} />
                  </button>
                </div>

                {/* EXACT SUBJECT LINE */}
                <h1 style={{
                  fontSize: '26px',
                  fontWeight: '700',
                  color: '#0F172A',
                  lineHeight: '1.25',
                  letterSpacing: '-0.03em',
                  margin: '28px 32px 16px 32px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {selectedEmail.subject}
                </h1>

                {/* EXACT INBOX BADGE */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                  color: '#4F46E5',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 1px 3px rgba(79, 70, 229, 0.15)',
                  marginLeft: '32px',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '14px' }}>📥</span>
                  {selectedEmail.labels?.[0] || 'Inbox'}
                </span>

                {/* EXACT EMAIL BODY */}
                <div style={{
                  padding: '32px 40px',
                  maxWidth: '740px',
                  margin: '0',
                  background: 'white',
                  fontSize: '16px',
                  lineHeight: '1.75',
                  color: '#334155',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  {selectedEmail.body && selectedEmail.body.length > 10 ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedEmail.html || selectedEmail.body.replace(/\n/g, '<br />')
                      }}
                    />
                  ) : (
                    <div>
                      <p style={{ marginBottom: '20px' }}>
                        Hello there,
                      </p>
                      <p style={{ marginBottom: '20px' }}>
                        We're excited to share the latest updates from our platform. This month, we've been working on some incredible enhancements to make your development workflow even smoother.
                      </p>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#0F172A',
                        marginTop: '32px',
                        marginBottom: '12px'
                      }}>
                        What's New:
                      </h3>
                      <ul style={{ paddingLeft: '28px', marginBottom: '20px' }}>
                        <li style={{ marginBottom: '12px' }}>
                          Enhanced security features with end-to-end encryption
                        </li>
                        <li style={{ marginBottom: '12px' }}>
                          New dashboard with improved monitoring and analytics
                        </li>
                        <li style={{ marginBottom: '12px' }}>
                          Faster connections with reduced latency
                        </li>
                        <li style={{ marginBottom: '12px' }}>
                          Expanded support for custom domains and SSL certificates
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Attachments Section (if any) */}
                {selectedEmail.hasAttachments && selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div
                    className="transition-all duration-200"
                    style={{
                      background: '#FFFFFF',
                      border: '2px dashed #CBD5E1',
                      borderRadius: '10px',
                      padding: '20px',
                      margin: '32px 40px'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Paperclip className="w-5 h-5" style={{ color: '#64748B' }} />
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: '16px',
                          color: '#374151'
                        }}
                      >
                        Attachments ({selectedEmail.attachments.length})
                      </h3>
                    </div>

                    <div
                      className="grid grid-cols-2 gap-4"
                      style={{ gap: '16px' }}
                    >
                      {selectedEmail.attachments.map((attachment, index) => {
                        const fileIcon = getFileIcon(attachment.mimeType);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:shadow-md"
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                style={{
                                  background: `${fileIcon.color}15`,
                                  color: fileIcon.color
                                }}
                              >
                                {fileIcon.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-medium truncate"
                                  style={{ color: '#1F2937' }}
                                >
                                  {attachment.filename}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: '#6B7280' }}
                                >
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                            </div>

                            <button
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                              style={{
                                background: '#F3F4F6',
                                color: '#6B7280'
                              }}
                              title="Download attachment"
                            >
                              <Download
                                className="w-4 h-4 group-hover:text-blue-600 transition-colors"
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EXACT ACTION BUTTONS AT BOTTOM */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '28px 40px',
                  borderTop: '1px solid #E2E8F0',
                  background: 'linear-gradient(to top, #FAFBFC, #FFFFFF)'
                }}>
                  <button
                    style={{
                      height: '48px',
                      padding: '0 36px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.35)';
                    }}
                  >
                    <span>←</span>
                    Reply
                  </button>

                  <button
                    style={{
                      height: '48px',
                      padding: '0 36px',
                      background: 'white',
                      color: '#475569',
                      border: '2px solid #E2E8F0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.color = '#1E293B';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    Forward
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '500px',
                padding: '60px'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '32px',
                  boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
                  position: 'relative'
                }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="M3 7l9 6 9-6"/>
                  </svg>

                  {/* Decorative ring */}
                  <div style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    border: '2px dashed rgba(102, 126, 234, 0.3)',
                    animation: 'rotate 20s linear infinite'
                  }} />
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
                  Select an email to read
                </h3>

                <p style={{ fontSize: '15px', color: '#64748B', lineHeight: '1.7', textAlign: 'center', maxWidth: '380px', marginBottom: '32px' }}>
                  Choose an email from the inbox to view its contents, or compose a new email to get started.
                </p>

                <button
                  onClick={() => setIsComposing(true)}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Compose Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .smooth-scroll {
          scroll-behavior: smooth;
        }

        .smooth-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .smooth-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .smooth-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .smooth-scroll::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        @keyframes starBurst {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.3) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }

        .star-burst {
          animation: starBurst 0.6s ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SophisticatedEmailClient;