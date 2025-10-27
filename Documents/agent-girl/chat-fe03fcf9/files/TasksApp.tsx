import React from 'react';

const TasksApp: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tasks</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Tasks</h3>
          <span className="text-sm text-gray-500">3 of 5 completed</span>
        </div>

        <div className="space-y-3">
          <div className="glass-card rounded-lg p-4 flex items-center gap-3">
            <input type="checkbox" checked className="w-5 h-5 text-blue-600 rounded" readOnly />
            <span className="text-gray-500 line-through">Review project documentation</span>
          </div>

          <div className="glass-card rounded-lg p-4 flex items-center gap-3">
            <input type="checkbox" checked className="w-5 h-5 text-blue-600 rounded" readOnly />
            <span className="text-gray-500 line-through">Fix WebSocket connection issues</span>
          </div>

          <div className="glass-card rounded-lg p-4 flex items-center gap-3">
            <input type="checkbox" checked className="w-5 h-5 text-blue-600 rounded" readOnly />
            <span className="text-gray-500 line-through">Update dashboard components</span>
          </div>

          <div className="glass-card rounded-lg p-4 flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-gray-900 dark:text-white">Deploy analytics dashboard</span>
          </div>

          <div className="glass-card rounded-lg p-4 flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-gray-900 dark:text-white">Test all functionality</span>
          </div>
        </div>

        <div className="mt-6">
          <button className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
            + Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksApp;