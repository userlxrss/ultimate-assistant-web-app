import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Coffee, Pause, Play, Download, Calendar, Filter, Settings, AlertCircle } from 'lucide-react';
import { TimeEntry, TimeTrackingSettings } from '../types';
import { TimeTrackingManager } from '../utils/timeTrackingManager';
import { TimeTrackingStorage } from '../utils/timeTrackingStorage';
import { TimeTrackingCalculations } from '../utils/timeTrackingCalculations';
import TimesheetView from './timesheet/TimesheetView';
import TimeTrackingSettingsComponent from './timesheet/TimeTrackingSettings';

const TimeTrackingApp: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState(TimeTrackingManager.getCurrentStatus());
  const [settings, setSettings] = useState<TimeTrackingSettings>(TimeTrackingStorage.getSettings());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timesheet' | 'settings'>('dashboard');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [breakReason, setBreakReason] = useState('');
  const [showBreakReasonModal, setShowBreakReasonModal] = useState(false);

  // Initialize time tracking
  useEffect(() => {
    TimeTrackingManager.initialize();

    const unsubscribeStatus = TimeTrackingManager.onStatusChange((status) => {
      setCurrentStatus(TimeTrackingManager.getCurrentStatus());
    });

    const unsubscribeUpdate = TimeTrackingManager.onUpdate((entry) => {
      setCurrentStatus(TimeTrackingManager.getCurrentStatus());
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUpdate();
    };
  }, []);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStatus.status === 'clocked_in' || currentStatus.status === 'on_break') {
        setElapsedTime(TimeTrackingCalculations.calculateElapsedTime(currentStatus.entry!));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStatus]);

  const handleClockIn = () => {
    try {
      TimeTrackingManager.clockIn(notes);
      setNotes('');
      setShowNotesModal(false);
    } catch (error) {
      console.error('Clock in failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to clock in');
    }
  };

  const handleClockOut = () => {
    try {
      TimeTrackingManager.clockOut();
    } catch (error) {
      console.error('Clock out failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to clock out');
    }
  };

  const handleStartLunchBreak = () => {
    try {
      TimeTrackingManager.startLunchBreak();
    } catch (error) {
      console.error('Start lunch break failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to start lunch break');
    }
  };

  const handleEndLunchBreak = () => {
    try {
      TimeTrackingManager.endLunchBreak();
    } catch (error) {
      console.error('End lunch break failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to end lunch break');
    }
  };

  const handleStartShortBreak = () => {
    try {
      TimeTrackingManager.startShortBreak(breakReason);
      setBreakReason('');
      setShowBreakReasonModal(false);
    } catch (error) {
      console.error('Start short break failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to start short break');
    }
  };

  const handleEndShortBreak = () => {
    if (currentStatus.entry) {
      const activeBreak = currentStatus.entry.shortBreaks.find(b => !b.endTime);
      if (activeBreak) {
        try {
          TimeTrackingManager.endShortBreak(activeBreak.id);
        } catch (error) {
          console.error('End short break failed:', error);
          alert(error instanceof Error ? error.message : 'Failed to end short break');
        }
      }
    }
  };

  const formatElapsedTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (currentStatus.status) {
      case 'clocked_in': return 'text-green-600 bg-green-100';
      case 'on_break': return 'text-yellow-600 bg-yellow-100';
      case 'clocked_out': return 'text-gray-600 bg-gray-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getStatusText = () => {
    switch (currentStatus.status) {
      case 'clocked_in': return 'Clocked In';
      case 'on_break': return currentStatus.activeBreakType === 'lunch' ? 'Lunch Break' : 'Short Break';
      case 'clocked_out': return 'Clocked Out';
      default: return 'Not Started';
    }
  };

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className={`p-6 ${isDark ? 'glass-noir-bg-primary' : 'theme-bg-primary'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
          Time Tracking
        </h1>
        <p className={isDark ? 'glass-noir-text-secondary' : 'theme-text-secondary'}>
          Track your work hours, breaks, and manage your timesheet
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('timesheet')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'timesheet'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Timesheet
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Current Status Card */}
          <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                Current Status
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>

            {/* Time Display */}
            <div className="text-center py-8">
              <div className={`text-6xl font-mono font-bold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                {formatElapsedTime(elapsedTime)}
              </div>
              {currentStatus.isLateArrival && currentStatus.status === 'clocked_in' && (
                <div className="flex items-center justify-center text-yellow-600 mb-4">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">Late arrival detected</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentStatus.status === 'not_started' && (
                <>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Clock In
                  </button>
                </>
              )}

              {currentStatus.status === 'clocked_in' && (
                <>
                  <button
                    onClick={handleClockOut}
                    className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Clock Out
                  </button>
                  <button
                    onClick={handleStartLunchBreak}
                    className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Coffee className="w-5 h-5 mr-2" />
                    Lunch Break
                  </button>
                  <button
                    onClick={() => setShowBreakReasonModal(true)}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Short Break
                  </button>
                </>
              )}

              {currentStatus.status === 'on_break' && currentStatus.activeBreakType === 'lunch' && (
                <>
                  <button
                    onClick={handleEndLunchBreak}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    End Lunch
                  </button>
                </>
              )}

              {currentStatus.status === 'on_break' && currentStatus.activeBreakType === 'short' && (
                <>
                  <button
                    onClick={handleEndShortBreak}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    End Break
                  </button>
                </>
              )}
            </div>

            {/* Today's Details */}
            {currentStatus.entry && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className={`text-lg font-medium mb-3 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                  Today's Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className={isDark ? 'glass-noir-text-muted' : 'text-gray-500'}>Clock In:</span>
                    <p className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                      {currentStatus.entry.clockIn ?
                        currentStatus.entry.clockIn.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) :
                        '--:--'
                      }
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'glass-noir-text-muted' : 'text-gray-500'}>Clock Out:</span>
                    <p className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                      {currentStatus.entry.clockOut ?
                        currentStatus.entry.clockOut.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) :
                        '--:--'
                      }
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'glass-noir-text-muted' : 'text-gray-500'}>Lunch Break:</span>
                    <p className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                      {currentStatus.entry.lunchBreak?.duration ?
                        `${currentStatus.entry.lunchBreak.duration}m` :
                        '--'
                      }
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'glass-noir-text-muted' : 'text-gray-500'}>Short Breaks:</span>
                    <p className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                      {currentStatus.entry.shortBreaks.length}
                    </p>
                  </div>
                </div>
                {currentStatus.entry.notes && (
                  <div className="mt-3">
                    <span className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>Notes:</span>
                    <p className={`text-sm mt-1 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                      {currentStatus.entry.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                This Week
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}>Total Hours:</span>
                  <span className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                    {/* Calculate this week's hours */}
                    {(() => {
                      const entries = TimeTrackingStorage.getTimeEntries();
                      const weekStart = new Date();
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      const weekEntries = entries.filter(entry => new Date(entry.date) >= weekStart);
                      const summary = TimeTrackingCalculations.getTimesheetSummary(weekEntries);
                      return summary.totalHours.toFixed(1) + 'h';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}>Days Worked:</span>
                  <span className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                    {/* Calculate this week's days */}
                    {(() => {
                      const entries = TimeTrackingStorage.getTimeEntries();
                      const weekStart = new Date();
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      const weekEntries = entries.filter(entry => new Date(entry.date) >= weekStart);
                      return weekEntries.filter(entry => entry.status === 'clocked_out').length;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                This Month
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}>Total Hours:</span>
                  <span className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                    {/* Calculate this month's hours */}
                    {(() => {
                      const entries = TimeTrackingStorage.getTimeEntries();
                      const now = new Date();
                      const monthEntries = entries.filter(entry => {
                        const entryDate = new Date(entry.date);
                        return entryDate.getMonth() === now.getMonth() &&
                               entryDate.getFullYear() === now.getFullYear();
                      });
                      const summary = TimeTrackingCalculations.getTimesheetSummary(monthEntries);
                      return summary.totalHours.toFixed(1) + 'h';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}>Average/Day:</span>
                  <span className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                    {/* Calculate this month's average */}
                    {(() => {
                      const entries = TimeTrackingStorage.getTimeEntries();
                      const now = new Date();
                      const monthEntries = entries.filter(entry => {
                        const entryDate = new Date(entry.date);
                        return entryDate.getMonth() === now.getMonth() &&
                               entryDate.getFullYear() === now.getFullYear();
                      });
                      const summary = TimeTrackingCalculations.getTimesheetSummary(monthEntries);
                      return summary.averageHoursPerDay.toFixed(1) + 'h';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                Schedule
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}>Work Day:</span>
                  <span className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                    {settings.workdayStart} - {settings.workdayEnd}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'glass-noir-text-secondary' : 'text-gray-600'}>Lunch Duration:</span>
                  <span className={`font-medium ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
                    {settings.lunchBreakDuration}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timesheet Tab */}
      {activeTab === 'timesheet' && (
        <TimesheetView />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <TimeTrackingSettingsComponent
          settings={settings}
          onSettingsChange={(newSettings) => {
            TimeTrackingManager.updateSettings(newSettings);
            setSettings({ ...settings, ...newSettings });
          }}
        />
      )}

      {/* Clock In Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
              Clock In Notes (Optional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your workday..."
              className={`w-full p-3 border rounded-lg resize-none h-24 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNotes('');
                }}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleClockIn}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Clock In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Short Break Reason Modal */}
      {showBreakReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
              Short Break Reason (Optional)
            </h3>
            <input
              type="text"
              value={breakReason}
              onChange={(e) => setBreakReason(e.target.value)}
              placeholder="e.g., Coffee break, Quick walk, etc."
              className={`w-full p-3 border rounded-lg ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowBreakReasonModal(false);
                  setBreakReason('');
                }}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleStartShortBreak}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingApp;