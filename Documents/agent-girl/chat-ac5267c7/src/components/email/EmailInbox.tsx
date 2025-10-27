import React from 'react';
import { Email, EmailFolder } from '../../types/email';
import { Mail, Send, FileText, Star, AlertCircle, Search, RefreshCw, ChevronDown, User, Calendar, Clock, Paperclip } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface EmailInboxProps {
  emails: Email[];
  folders: EmailFolder[];
  currentView: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewChange: (view: string) => void;
  onEmailClick: (email: Email) => void;
  onCompose: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isGmailConnected: boolean;
}

export const EmailInbox: React.FC<EmailInboxProps> = ({
  emails,
  folders,
  currentView,
  searchQuery,
  onSearchChange,
  onViewChange,
  onEmailClick,
  onCompose,
  onRefresh,
  isRefreshing,
  isGmailConnected,
}) => {
  const getFolderIcon = (folderId: string) => {
    switch (folderId) {
      case 'inbox':
        return <Mail className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'drafts':
        return <FileText className="w-4 h-4" />;
      case 'starred':
        return <Star className="w-4 h-4" />;
      case 'important':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 pr-4">
        <button
          onClick={onCompose}
          className="w-full mb-6 px-4 py-3 bg-sage-500 hover:bg-sage-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Compose
        </button>

        <nav className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onViewChange(folder.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 ${
                currentView === folder.id
                  ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {getFolderIcon(folder.id)}
                <span className="font-medium">{folder.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {folder.unreadCount > 0 && (
                  <span className="px-2 py-1 bg-sage-500 text-white text-xs rounded-full">
                    {folder.unreadCount}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {folder.count}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={onRefresh}
              disabled={isRefreshing || !isGmailConnected}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                isRefreshing
                  ? 'text-gray-400 cursor-wait'
                  : isGmailConnected
                  ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={isGmailConnected ? 'Refresh emails' : 'Connect Gmail to refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {emails.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No emails found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? 'No emails match your search criteria'
                  : currentView === 'starred'
                  ? 'No starred emails'
                  : currentView === 'important'
                  ? 'No important emails'
                  : 'Your inbox is empty'
                }
              </p>
              {!isGmailConnected && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Connect your Gmail account to start syncing emails
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => onEmailClick(email)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 ${
                    !email.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Star Indicator */}
                    <button
                      className={`mt-1 p-1 rounded transition-colors ${
                        email.isStarred
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle star toggle
                      }}
                    >
                      <Star className={`w-4 h-4 ${email.isStarred ? 'fill-current' : ''}`} />
                    </button>

                    {/* Email Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${
                            !email.isRead
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {email.from.name || email.from.email}
                          </span>
                          {email.isImportant && (
                            <AlertCircle className="w-3 h-3 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {email.hasAttachments && (
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(email.date)}
                          </span>
                        </div>
                      </div>

                      <div className={`mb-1 ${
                        !email.isRead
                          ? 'font-semibold text-gray-900 dark:text-white'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {email.subject || '(No subject)'}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {email.snippet}
                      </div>

                      {/* Labels */}
                      {email.labels.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {email.labels.slice(0, 3).map((label) => (
                            <span
                              key={label}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded"
                            >
                              {label}
                            </span>
                          ))}
                          {email.labels.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded">
                              +{email.labels.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Count */}
        {emails.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {emails.length} email{emails.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    </div>
  );
};