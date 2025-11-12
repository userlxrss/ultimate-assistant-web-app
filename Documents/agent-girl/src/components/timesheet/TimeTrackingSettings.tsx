import React from 'react';
import { Clock, Coffee, Settings, Bell, AlertTriangle } from 'lucide-react';
import { TimeTrackingSettings as ITimeTrackingSettings } from '../../types';

interface TimeTrackingSettingsProps {
  settings: ITimeTrackingSettings;
  onSettingsChange: (settings: Partial<ITimeTrackingSettings>) => void;
}

const TimeTrackingSettings: React.FC<TimeTrackingSettingsProps> = ({ settings, onSettingsChange }) => {
  const isDark = document.documentElement.classList.contains('dark');

  const handleSettingChange = (key: keyof ITimeTrackingSettings, value: any) => {
    onSettingsChange({ [key]: value });
  };

  const resetToDefaults = () => {
    const defaultSettings: ITimeTrackingSettings = {
      workdayStart: '09:00',
      workdayEnd: '17:00',
      lunchBreakDuration: 60,
      lateArrivalThreshold: 5,
      autoClockOut: false,
      autoClockOutTime: '18:00',
      roundTime: true,
      roundToMinutes: 5,
      enableNotifications: true,
      breakReminderInterval: 120
    };
    onSettingsChange(defaultSettings);
  };

  return (
    <div className="space-y-6">
      {/* Work Schedule Settings */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="flex items-center mb-6">
          <Clock className="w-6 h-6 mr-3 text-blue-600" />
          <h2 className={`text-xl font-semibold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            Work Schedule
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Workday Start */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
              Workday Start Time
            </label>
            <input
              type="time"
              value={settings.workdayStart}
              onChange={(e) => handleSettingChange('workdayStart', e.target.value)}
              className={`w-full p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
              Default start time for late arrival calculations
            </p>
          </div>

          {/* Workday End */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
              Workday End Time
            </label>
            <input
              type="time"
              value={settings.workdayEnd}
              onChange={(e) => handleSettingChange('workdayEnd', e.target.value)}
              className={`w-full p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
              Standard workday end time
            </p>
          </div>

          {/* Auto Clock Out */}
          <div className="md:col-span-2">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="autoClockOut"
                checked={settings.autoClockOut}
                onChange={(e) => handleSettingChange('autoClockOut', e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="autoClockOut" className={`text-sm font-medium ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                  Enable Auto Clock Out
                </label>
                <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
                  Automatically clock out at a specified time
                </p>
                {settings.autoClockOut && (
                  <div className="mt-3">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                      Auto Clock Out Time
                    </label>
                    <input
                      type="time"
                      value={settings.autoClockOutTime}
                      onChange={(e) => handleSettingChange('autoClockOutTime', e.target.value)}
                      className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Break Settings */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="flex items-center mb-6">
          <Coffee className="w-6 h-6 mr-3 text-orange-600" />
          <h2 className={`text-xl font-semibold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            Break Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Lunch Break Duration */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
              Default Lunch Break Duration
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="240"
                value={settings.lunchBreakDuration}
                onChange={(e) => handleSettingChange('lunchBreakDuration', parseInt(e.target.value) || 0)}
                className={`flex-1 p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              />
              <span className={`text-sm ${isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}`}>minutes</span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
              Typical lunch break length
            </p>
          </div>

          {/* Break Reminder Interval */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
              Break Reminder Interval
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="15"
                max="480"
                step="15"
                value={settings.breakReminderInterval}
                onChange={(e) => handleSettingChange('breakReminderInterval', parseInt(e.target.value) || 120)}
                className={`flex-1 p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              />
              <span className={`text-sm ${isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}`}>minutes</span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
              Remind to take breaks every N minutes
            </p>
          </div>
        </div>
      </div>

      {/* Late Arrival Settings */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="flex items-center mb-6">
          <AlertTriangle className="w-6 h-6 mr-3 text-yellow-600" />
          <h2 className={`text-xl font-semibold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            Late Arrival Detection
          </h2>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
            Late Arrival Threshold
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="60"
              value={settings.lateArrivalThreshold}
              onChange={(e) => handleSettingChange('lateArrivalThreshold', parseInt(e.target.value) || 0)}
              className={`flex-1 p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <span className={`text-sm ${isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}`}>minutes</span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
            Mark as late if clocked in more than this many minutes after workday start
          </p>
        </div>
      </div>

      {/* Time Rounding Settings */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="flex items-center mb-6">
          <Settings className="w-6 h-6 mr-3 text-purple-600" />
          <h2 className={`text-xl font-semibold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            Time Rounding
          </h2>
        </div>

        <div className="space-y-4">
          {/* Enable Time Rounding */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="roundTime"
              checked={settings.roundTime}
              onChange={(e) => handleSettingChange('roundTime', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="roundTime" className={`text-sm font-medium ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                Enable Time Rounding
              </label>
              <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
                Round worked time to the nearest specified interval
              </p>
            </div>
          </div>

          {/* Round To Minutes */}
          {settings.roundTime && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                Round To
              </label>
              <select
                value={settings.roundToMinutes}
                onChange={(e) => handleSettingChange('roundToMinutes', parseInt(e.target.value))}
                className={`w-full p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              >
                <option value={1}>1 minute (no rounding)</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
                Round total worked hours to the nearest interval
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="flex items-center mb-6">
          <Bell className="w-6 h-6 mr-3 text-green-600" />
          <h2 className={`text-xl font-semibold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            Notifications
          </h2>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="enableNotifications"
            checked={settings.enableNotifications}
            onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="enableNotifications" className={`text-sm font-medium ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
              Enable Notifications
            </label>
            <p className={`text-xs mt-1 ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
              Show browser notifications for breaks, auto clock out, and other reminders
            </p>
            <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                <strong>Note:</strong> You'll need to allow browser notifications when prompted for this feature to work.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Settings */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
          Reset Settings
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}`}>
          Reset all time tracking settings to their default values
        </p>
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default TimeTrackingSettings;