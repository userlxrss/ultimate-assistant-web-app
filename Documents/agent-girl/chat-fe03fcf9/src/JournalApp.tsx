import React from 'react';

const JournalApp: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Journal</h2>
      <div className="space-y-4">
        <div className="glass-card rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Thoughts</h3>
            <span className="text-sm text-gray-500">Just now</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Feeling productive today. Made good progress on the analytics dashboard and fixed several bugs.
          </p>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yesterday</h3>
            <span className="text-sm text-gray-500">1 day ago</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Challenging day with debugging WebSocket issues, but learned a lot about process management.
          </p>
        </div>

        <div className="mt-6">
          <button className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
            + New Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalApp;