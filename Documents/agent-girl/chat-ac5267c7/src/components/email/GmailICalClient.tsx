import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Check, AlertCircle, Trash2, Star, Reply, Link, Settings, Calendar } from 'lucide-react';
import { gmailICalAPI } from '../../utils/gmailICalAPI';
import { Email } from '../../types/email';

export const GmailICalClient: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [gmailAddress, setGmailAddress] = useState('');

  useEffect(() => {
    // Load saved configuration
    gmailICalAPI.loadSavedConfig();
    if (gmailICalAPI.isAuthenticated()) {
      setIsConnected(true);
      loadEmails();
    }
  }, []);

  const loadEmails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const gmailEmails = await gmailICalAPI.getRecentEmails();
      setEmails(gmailEmails);
    } catch (err) {
      setError('Failed to load Gmail emails: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    if (!gmailAddress.trim()) {
      setError('Please enter your Gmail address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const feedUrl = gmailICalAPI.generateFeedUrl(gmailAddress);
      gmailICalAPI.setFeedUrl(feedUrl);
      setIsConnected(true);
      setShowSetup(false);
      loadEmails();
    } catch (err) {
      setError('Failed to connect to Gmail: ' + (err as Error).message);
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    gmailICalAPI.clearConnection();
    setIsConnected(false);
    setEmails([]);
    setSelectedEmail(null);
    setGmailAddress('');
    setShowSetup(false);
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const to = [{ email: composeData.to, name: composeData.to.split('@')[0] }];
      await gmailICalAPI.sendEmail(to, composeData.subject, composeData.body);
      setIsComposing(false);
      setComposeData({ to: '', subject: '', body: '' });

      // Show success message
      const successMessage = {
        id: Date.now().toString(),
        threadId: `sent-${Date.now()}`,
        subject: composeData.subject,
        snippet: composeData.body.substring(0, 100) + '...',
        body: composeData.body,
        from: { email: 'me@gmail.com', name: 'Me' },
        to: [{ email: composeData.to, name: composeData.to.split('@')[0] }],
        date: new Date(),
        isRead: true,
        isStarred: false,
        isImportant: false,
        labels: ['SENT'],
        attachments: [],
        hasAttachments: false,
        folder: 'sent'
      };
      setEmails([successMessage, ...emails]);
    } catch (err) {
      setError('Failed to send email: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
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

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center">
            Connect Gmail via iCal
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Use the same method as your calendar - simple iCal integration!
          </p>

          {showSetup ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Setup Instructions:</h3>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  {gmailICalAPI.getSetupInstructions().map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

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

              <div className="flex gap-3">
                <button
                  onClick={handleConnect}
                  disabled={isLoading || !gmailAddress.trim()}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
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
                <button
                  onClick={() => setShowSetup(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowSetup(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Setup Gmail Connection
              </button>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  💡 <strong>Same as Calendar:</strong> Uses iCal feed integration - no API keys required!
                </p>
              </div>
            </div>
          )}

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
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Compose Email</h2>

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
            Connected (iCal)
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
            onClick={handleDisconnect}
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
                        {email.from.name || email.from.email}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span>From: {selectedEmail.from.name || selectedEmail.from.email}</span>
                      <span>To: {selectedEmail.to[0]?.email}</span>
                      <span>{formatDate(selectedEmail.date)}</span>
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