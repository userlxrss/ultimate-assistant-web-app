import React from 'react';
import { Email } from '../../types/email';
import {
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Star,
  MoreVertical,
  User,
  Clock,
  Paperclip,
  ExternalLink,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

interface EmailViewerProps {
  email: Email;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  onStar: () => void;
  onBack: () => void;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  onReply,
  onForward,
  onDelete,
  onStar,
  onBack,
}) => {
  const formatEmailAddresses = (addresses: any[]) => {
    return addresses.map(addr => addr.name || addr.email).join(', ');
  };

  const downloadAttachment = (attachment: any) => {
    // In a real implementation, this would download the actual file
    console.log('Downloading attachment:', attachment);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {email.subject || '(No subject)'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStar}
            className={`p-2 rounded-lg transition-colors ${
              email.isStarred
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-600 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400'
            }`}
            title={email.isStarred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-5 h-5 ${email.isStarred ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={onReply}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Reply"
          >
            <Reply className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={onForward}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Forward"
          >
            <Forward className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </button>

          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sender Information */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-sage-100 dark:bg-sage-900/30 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {email.from.name || email.from.email}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {email.from.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(email.date, 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {format(email.date, 'h:mm a')}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>To: {formatEmailAddresses(email.to)}</div>
                {email.cc && email.cc.length > 0 && (
                  <div>Cc: {formatEmailAddresses(email.cc)}</div>
                )}
                {email.bcc && email.bcc.length > 0 && (
                  <div>Bcc: {formatEmailAddresses(email.bcc)}</div>
                )}
              </div>

              {/* Labels */}
              {email.labels.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {email.labels.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6">
          <div className="prose dark:prose-invert max-w-none">
            {email.body.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
                {paragraph || <br />}
              </p>
            ))}
          </div>
        </div>

        {/* Attachments */}
        {email.hasAttachments && email.attachments.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Attachments ({email.attachments.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {email.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {attachment.filename}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {attachment.url && (
                      <button
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Open attachment"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadAttachment(attachment)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Download attachment"
                    >
                      <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={onReply}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            <button
              onClick={onForward}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Forward className="w-4 h-4" />
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};