import { TimeEntry, LunchBreak, ShortBreak, TimeTrackingSettings } from '../types';

export class TimeTrackingStorage {
  private static readonly STORAGE_KEY = 'time-entries';
  private static readonly SETTINGS_KEY = 'time-tracking-settings';
  private static readonly CURRENT_SESSION_KEY = 'current-time-session';

  // Default settings
  private static readonly DEFAULT_SETTINGS: TimeTrackingSettings = {
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

  // Time Entry Management
  static getTimeEntries(): TimeEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const entries = JSON.parse(stored);
      // Convert date strings back to Date objects
      return entries.map((entry: any) => ({
        ...entry,
        clockIn: entry.clockIn ? new Date(entry.clockIn) : null,
        clockOut: entry.clockOut ? new Date(entry.clockOut) : null,
        lunchBreak: entry.lunchBreak ? {
          ...entry.lunchBreak,
          startTime: new Date(entry.lunchBreak.startTime),
          endTime: entry.lunchBreak.endTime ? new Date(entry.lunchBreak.endTime) : null
        } : null,
        shortBreaks: entry.shortBreaks.map((break_: any) => ({
          ...break_,
          startTime: new Date(break_.startTime),
          endTime: break_.endTime ? new Date(break_.endTime) : null
        }))
      }));
    } catch (error) {
      console.error('Error loading time entries:', error);
      return [];
    }
  }

  static saveTimeEntries(entries: TimeEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving time entries:', error);
    }
  }

  static getTimeEntry(date: string): TimeEntry | null {
    const entries = this.getTimeEntries();
    return entries.find(entry => entry.date === date) || null;
  }

  static saveTimeEntry(entry: TimeEntry): void {
    const entries = this.getTimeEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);

    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }

    // Sort by date (newest first)
    entries.sort((a, b) => b.date.localeCompare(a.date));

    this.saveTimeEntries(entries);
  }

  static deleteTimeEntry(date: string): void {
    const entries = this.getTimeEntries();
    const filtered = entries.filter(entry => entry.date !== date);
    this.saveTimeEntries(filtered);
  }

  // Current session management (for active clock in/out)
  static getCurrentSession(): TimeEntry | null {
    try {
      const stored = localStorage.getItem(this.CURRENT_SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      return {
        ...session,
        clockIn: session.clockIn ? new Date(session.clockIn) : null,
        clockOut: session.clockOut ? new Date(session.clockOut) : null,
        lunchBreak: session.lunchBreak ? {
          ...session.lunchBreak,
          startTime: new Date(session.lunchBreak.startTime),
          endTime: session.lunchBreak.endTime ? new Date(session.lunchBreak.endTime) : null
        } : null,
        shortBreaks: session.shortBreaks.map((break_: any) => ({
          ...break_,
          startTime: new Date(break_.startTime),
          endTime: break_.endTime ? new Date(break_.endTime) : null
        }))
      };
    } catch (error) {
      console.error('Error loading current session:', error);
      return null;
    }
  }

  static saveCurrentSession(entry: TimeEntry | null): void {
    try {
      if (entry) {
        localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(entry));
      } else {
        localStorage.removeItem(this.CURRENT_SESSION_KEY);
      }
    } catch (error) {
      console.error('Error saving current session:', error);
    }
  }

  static clearCurrentSession(): void {
    this.saveCurrentSession(null);
  }

  // Settings Management
  static getSettings(): TimeTrackingSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        return { ...this.DEFAULT_SETTINGS, ...settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return this.DEFAULT_SETTINGS;
  }

  static saveSettings(settings: Partial<TimeTrackingSettings>): void {
    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Utility methods
  static createTodayEntry(): TimeEntry {
    const today = new Date().toISOString().split('T')[0];
    const settings = this.getSettings();

    return {
      id: `time-entry-${today}-${Date.now()}`,
      date: today,
      clockIn: null,
      clockOut: null,
      lunchBreak: null,
      shortBreaks: [],
      totalHours: 0,
      status: 'not_started',
      isLateArrival: false,
      scheduledStartTime: settings.workdayStart
    };
  }

  static getOrCreateTodayEntry(): TimeEntry {
    const today = new Date().toISOString().split('T')[0];
    let entry = this.getTimeEntry(today);

    if (!entry) {
      entry = this.createTodayEntry();
      this.saveTimeEntry(entry);
    }

    return entry;
  }

  // Export functionality
  static exportToCSV(): string {
    const entries = this.getTimeEntries();

    // CSV Headers
    const headers = [
      'Date',
      'Clock In',
      'Clock Out',
      'Lunch Start',
      'Lunch End',
      'Lunch Duration',
      'Short Breaks',
      'Total Break Time',
      'Total Hours',
      'Status',
      'Late Arrival',
      'Notes'
    ];

    // Convert entries to CSV rows
    const rows = entries.map(entry => {
      const lunchDuration = entry.lunchBreak?.duration || 0;
      const shortBreaksTotal = entry.shortBreaks.reduce((total, break_) => total + (break_.duration || 0), 0);
      const totalBreakTime = lunchDuration + shortBreaksTotal;

      return [
        entry.date,
        entry.clockIn ? this.formatDateTime(entry.clockIn) : '',
        entry.clockOut ? this.formatDateTime(entry.clockOut) : '',
        entry.lunchBreak?.startTime ? this.formatDateTime(entry.lunchBreak.startTime) : '',
        entry.lunchBreak?.endTime ? this.formatDateTime(entry.lunchBreak.endTime) : '',
        lunchDuration > 0 ? `${lunchDuration}m` : '',
        entry.shortBreaks.length.toString(),
        `${totalBreakTime}m`,
        entry.totalHours.toFixed(2),
        entry.status,
        entry.isLateArrival ? 'Yes' : 'No',
        entry.notes || ''
      ];
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private static formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Data cleanup and maintenance
  static cleanupOldEntries(daysToKeep: number = 365): void {
    const entries = this.getTimeEntries();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    const filteredEntries = entries.filter(entry => entry.date >= cutoffDateString);
    this.saveTimeEntries(filteredEntries);
  }

  // Get statistics
  static getStatistics() {
    const entries = this.getTimeEntries();
    const today = new Date().toISOString().split('T')[0];
    const currentEntry = entries.find(e => e.date === today);

    return {
      totalEntries: entries.length,
      todayEntry: currentEntry || null,
      thisWeekEntries: entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return entryDate >= weekStart;
      }),
      thisMonthEntries: entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      })
    };
  }
}