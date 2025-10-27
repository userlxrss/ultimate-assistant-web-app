import React from 'react';

const DashboardSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Tasks</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">+3 from yesterday</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">18</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">75% completion rate</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Journal Entries</h3>
          <p className="text-3xl font-bold text-purple-600">12</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This week</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Focus Time</h3>
          <p className="text-3xl font-bold text-orange-600">5.2h</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Completed project review</span>
              <span className="text-xs text-gray-500 ml-auto">2h ago</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Added 3 new tasks</span>
              <span className="text-xs text-gray-500 ml-auto">3h ago</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Journal entry created</span>
              <span className="text-xs text-gray-500 ml-auto">5h ago</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Productivity Trends</h3>
          <div className="h-32 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">↑ 15%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">vs. last week</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;