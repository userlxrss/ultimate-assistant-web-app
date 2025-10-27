import React, { useState } from 'react';

const EmailApp: React.FC = () => {
  const [emails] = useState([
    {
      id: 1,
      from: 'team@company.com',
      subject: 'Weekly Update',
      preview: 'Here are the updates for this week...',
      time: '2h ago',
      unread: true
    },
    {
      id: 2,
      from: 'client@example.com',
      subject: 'Project Requirements',
      preview: 'Can we discuss the new features...',
      time: '5h ago',
      unread: true
    },
    {
      id: 3,
      from: 'noreply@github.com',
      subject: 'Pull Request Merged',
      preview: 'Your PR #123 has been merged...',
      time: '1d ago',
      unread: false
    }
  ]);

  return (
    <div className="glass-card rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Email</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inbox</h3>
          <button className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
            Compose
          </button>
        </div>

        <div className="space-y-2">
          {emails.map(email => (
            <div key={email.id} className="glass-card rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {email.from}
                    </span>
                    {email.unread && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {email.subject}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {email.preview}
                  </div>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {email.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmailApp;