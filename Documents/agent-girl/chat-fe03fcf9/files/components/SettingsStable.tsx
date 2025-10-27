import React from 'react';

const SettingsPanelStable: React.FC = ({ dateRange, onDateRangeChange, onExport }: any) => {
  return (
    <div className="glass-card rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Data Range</h3>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="glass-button px-4 py-2 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Export Data</h3>
          <button
            onClick={onExport}
            className="glass-button px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Export All Data
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-gray-700 dark:text-gray-300">Enable notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-gray-700 dark:text-gray-300">Dark mode</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SettingsPanelStable };