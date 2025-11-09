import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Check, AlertCircle, Trash2, Star, Reply, Calendar, Download, Link } from 'lucide-react';

interface SimpleEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
}

export const ICalEmailClient: React.FC = () => {
  const [emails, setEmails] = useState<SimpleEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SimpleEmail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    // Load sample emails for demonstration
    loadSampleEmails();
  }, []);

  const loadSampleEmails = () => {
    const sampleEmails: SimpleEmail[] = [
      {
        id: '1',
        from: 'notifications@github.com',
        subject: 'GitHub Security Alert: New package updates available',
        body: 'We found security vulnerabilities in your dependencies and recommend updating them soon. This automated message helps keep your projects secure.',
        date: new Date().toISOString(),
        isRead: false,
        isStarred: true
      },
      {
        id: '2',
        from: 'team@slack.com',
        subject: 'Your workspace has new activity',
        body: 'You have 3 unread messages and 2 channel mentions. Stay connected with your team by checking in on the latest conversations.',
        date: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        isStarred: false
      },
      {
        id: '3',
        from: 'support@notion.so',
        subject: 'Your workspace backup is complete',
        body: 'Your Notion workspace backup has been successfully created. All your pages, databases, and files are now safely stored. You can download the backup anytime.',
        date: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
        isStarred: false
      },
      {
        id: '4',
        from: 'news@techcrunch.com',
        subject: 'Today\'s Top Stories: AI Breakthroughs and Startup News',
        body: 'Breaking: Major AI company announces new technology, startup funding reaches record highs, and the latest in mobile tech innovation. Read our comprehensive coverage.',
        date: new Date(Date.now() - 10800000).toISOString(),
        isRead: true,
        isStarred: false
      },
      {
        id: '5',
        from: 'account@netflix.com',
        subject: 'New episodes added to your watchlist',
        body: 'Good news! New episodes of your favorite shows are now available. Don\'t miss out on the latest content from Netflix. Update your watchlist today.',
        date: new Date(Date.now() - 14400000).toISOString(),
        isRead: true,
        isStarred: true
      }
    ];
    setEmails(sampleEmails);
    setShowInstructions(false);
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      setError('Please fill in all fields');
      return;
    }

    // Simulate sending email
    const newEmail: SimpleEmail = {
      id: Date.now().toString(),
      from: 'me@example.com',
      subject: composeData.subject,
      body: composeData.body,
      date: new Date().toISOString(),
      isRead: true,
      isStarred: false
    };

    setEmails([newEmail, ...emails]);
    setIsComposing(false);
    setComposeData({ to: '', subject: '', body: '' });
    setError('');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email</h1>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            Demo Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Gmail Sync
          </button>

          <button
            onClick={() => setIsComposing(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* Gmail Sync Instructions */}
      {showInstructions && (
        <div className="mb-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                🚀 Gmail Calendar Sync - Super Easy Setup!
              </h3>

              <div className="space-y-3 text-sm text-purple-700 dark:text-purple-300">
                <div>
                  <p className="font-medium mb-1">📅 Method 1: Gmail Calendar Export (Recommended)</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to Gmail → Settings → See all settings</li>
                    <li>Click "Forwarding and POP/IMAP"</li>
                    <li>Enable IMAP access</li>
                    <li>Use any email client like Thunderbird or Outlook</li>
                    <li>Export emails as calendar events</li>
                  </ol>
                </div>

                <div>
                  <p className="font-medium mb-1">📱 Method 2: Gmail Mobile App</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Open Gmail app on your phone</li>
                    <li>Go to Settings → Sync settings</li>
                    <li>Enable calendar sync</li>
                    <li>Your emails will appear as calendar events</li>
                  </ol>
                </div>

                <div>
                  <p className="font-medium mb-1">🔗 Method 3: Google Calendar Integration</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to Google Calendar</li>
                    <li>Settings → Add calendar → Browse calendars of interest</li>
                    <li>Find "Gmail" integration</li>
                    <li>Connect your Gmail account</li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  💡 <strong>Pro Tip:</strong> This demo shows sample emails. Use one of the methods above to sync your real Gmail with calendar functionality!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {isComposing ? (
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Compose Email</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To:</label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject:</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  placeholder="Email subject"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message:</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                  placeholder="Type your message here..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Email
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Inbox ({emails.length})</h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {emails.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 dark:text-gray-400">No emails</p>
                ) : (
                  emails.map(email => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !email.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${selectedEmail?.id === email.id ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white truncate flex-1`}>
                          {email.from}
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
                        {email.body}
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
                        <span>From: {selectedEmail.from}</span>
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Choose an email from the inbox to view its contents
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  💡 Click "Gmail Sync" above for real Gmail integration options
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};