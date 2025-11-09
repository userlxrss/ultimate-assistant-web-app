import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Settings, Check, AlertCircle, Eye, EyeOff, Trash2, Star, Reply } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
}

interface SimpleEmailClientProps {
  onBack?: () => void;
}

export const SimpleEmailClient: React.FC<SimpleEmailClientProps> = ({ onBack }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email configuration
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    password: '',
    imapServer: 'imap.gmail.com',
    imapPort: 993,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587
  });

  // Compose email state
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem('email_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setEmailConfig(config);
      if (config.email && config.password) {
        setIsConnected(true);
        loadSampleEmails();
      }
    }
  }, []);

  const loadSampleEmails = () => {
    // Load sample emails for demo
    const sampleEmails: Email[] = [
      {
        id: '1',
        from: 'team@github.com',
        subject: 'Security alert: new sign-in to your account',
        body: 'We noticed a new sign-in to your GitHub account from a new device. If this was you, you can safely ignore this email. If you did not sign in recently, please review your account activity.',
        date: new Date().toISOString(),
        isRead: false,
        isStarred: true
      },
      {
        id: '2',
        from: 'newsletter@techcrunch.com',
        subject: 'Daily Tech Briefing - AI Updates and More',
        body: 'Today in tech: Major AI developments, startup funding news, and the latest in mobile technology. Read our comprehensive coverage of the tech industry biggest stories.',
        date: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        isStarred: false
      },
      {
        id: '3',
        from: 'support@notion.so',
        subject: 'Your workspace has been upgraded',
        body: 'Great news! Your Notion workspace has been successfully upgraded with new features including improved collaboration tools and enhanced database functionality.',
        date: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
        isStarred: false
      }
    ];
    setEmails(sampleEmails);
  };

  const handleConnect = () => {
    if (!emailConfig.email || !emailConfig.password) {
      alert('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    // Simulate connection (in real app, this would connect to IMAP server)
    setTimeout(() => {
      localStorage.setItem('email_config', JSON.stringify(emailConfig));
      setIsConnected(true);
      setIsLoading(false);
      setIsConfiguring(false);
      loadSampleEmails();
    }, 2000);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('email_config');
    setIsConnected(false);
    setEmails([]);
    setSelectedEmail(null);
    setEmailConfig({
      ...emailConfig,
      email: '',
      password: ''
    });
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      alert('Please fill in all fields');
      return;
    }

    // Simulate sending email
    alert(`Email sent to ${composeData.to}`);
    setIsComposing(false);
    setComposeData({ to: '', subject: '', body: '' });
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

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Connect Your Email
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Use your email credentials to access your inbox
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={emailConfig.email}
                onChange={(e) => setEmailConfig({...emailConfig, email: e.target.value})}
                placeholder="your.email@gmail.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={emailConfig.password}
                  onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                  placeholder="Your email password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For Gmail: Use an App Password instead of your regular password
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Gmail Users:</strong> Enable "Less secure app access" or use an App Password from your Google Account settings.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={isLoading || !emailConfig.email || !emailConfig.password}
              className="w-full py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Connect Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isComposing) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Compose Email</h2>

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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email</h1>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
            {emailConfig.email}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsComposing(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Compose
          </button>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Inbox</h3>
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
                    } ${selectedEmail?.id === email.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white`}>
                        {email.from}
                      </span>
                      <div className="flex items-center gap-1">
                        {email.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(email.date)}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white mb-1`}>
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
                  <div>
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
                      onClick={() => handleToggleStar(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleToggleRead(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Mail className={`w-4 h-4 ${selectedEmail.isRead ? 'text-gray-400' : 'text-blue-500'}`} />
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