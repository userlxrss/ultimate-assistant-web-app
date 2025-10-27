import React from 'react';

const OAuthSimpleConnect: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">OAuth Connections</h2>

      <div className="space-y-4">
        <div className="glass-card rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Google</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Calendar, Gmail, Drive</p>
            </div>
            <button className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Connect
            </button>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">GitHub</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Repositories, Issues</p>
            </div>
            <button className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Connect
            </button>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Slack</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages, Channels</p>
            </div>
            <button className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { OAuthSimpleConnect };