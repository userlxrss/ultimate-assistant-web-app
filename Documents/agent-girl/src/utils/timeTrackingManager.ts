import { TimeEntry, LunchBreak, ShortBreak, TimeTrackingSettings } from '../types';
import { TimeTrackingStorage } from './timeTrackingStorage';
import { TimeTrackingCalculations } from './timeTrackingCalculations';

export class TimeTrackingManager {
  private static instance: TimeTrackingManager;
  private updateListeners: Array<(entry: TimeEntry) => void> = [];
  private statusListeners: Array<(status: TimeEntry['status']) => void> = [];
  private elapsedTimeInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TimeTrackingManager {
    if (!this.instance) {
      this.instance = new TimeTrackingManager();
    }
    return this.instance;
  }

  // Event listeners
  static onUpdate(callback: (entry: TimeEntry) => void): void {
    getInstance().updateListeners.push(callback);
  }

  static onStatusChange(callback: (status: TimeEntry['status']) => void): void {
    getInstance().statusListeners.push(callback);
  }

  private notifyUpdate(entry: TimeEntry): void {
    this.updateListeners.forEach(listener => listener(entry));
  }

  private notifyStatusChange(status: TimeEntry['status']): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  // Clock in functionality
  static clockIn(notes?: string): TimeEntry {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get or create today's entry
    let entry = TimeTrackingStorage.getTimeEntry(today);
    if (!entry) {
      entry = TimeTrackingStorage.createTodayEntry();
    }

    // Check if already clocked in
    if (entry.clockIn && !entry.clockOut) {
      throw new Error('Already clocked in for today');
    }

    // Update entry with clock in time
    entry.clockIn = now;
    entry.status = 'clocked_in';
    entry.notes = notes || entry.notes;

    // Check for late arrival
    const settings = TimeTrackingStorage.getSettings();
    entry.isLateArrival = TimeTrackingCalculations.isLateArrival(
      now,
      settings.workdayStart,
      settings.lateArrivalThreshold
    );

    // Save and update current session
    TimeTrackingStorage.saveTimeEntry(entry);
    TimeTrackingStorage.saveCurrentSession(entry);

    getInstance().notifyUpdate(entry);
    getInstance().notifyStatusChange('clocked_in');
    getInstance().startElapsedTimer();

    return entry;
  }

  // Clock out functionality
  static clockOut(): TimeEntry {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let entry = TimeTrackingStorage.getTimeEntry(today);
    if (!entry || !entry.clockIn) {
      throw new Error('No active clock in found for today');
    }

    // End any active breaks
    if (entry.lunchBreak && !entry.lunchBreak.endTime) {
      entry = getInstance().endLunchBreak(entry, now);
    }

    const activeShortBreak = entry.shortBreaks.find(break_ => !break_.endTime);
    if (activeShortBreak) {
      entry = getInstance().endShortBreak(entry, activeShortBreak.id, now);
    }

    // Update entry with clock out time
    entry.clockOut = now;
    entry.status = 'clocked_out';

    // Calculate total hours
    const settings = TimeTrackingStorage.getSettings();
    entry.totalHours = TimeTrackingCalculations.calculateWorkedHours(entry, settings);

    // Save and clear current session
    TimeTrackingStorage.saveTimeEntry(entry);
    TimeTrackingStorage.clearCurrentSession();

    getInstance().notifyUpdate(entry);
    getInstance().notifyStatusChange('clocked_out');
    getInstance().stopElapsedTimer();

    return entry;
  }

  // Lunch break functionality
  static startLunchBreak(): TimeEntry {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let entry = TimeTrackingStorage.getTimeEntry(today);
    if (!entry || !entry.clockIn || entry.clockOut) {
      throw new Error('Must be clocked in to start lunch break');
    }

    // Check if already on lunch break
    if (entry.lunchBreak && !entry.lunchBreak.endTime) {
      throw new Error('Already on lunch break');
    }

    // End any active short break
    const activeShortBreak = entry.shortBreaks.find(break_ => !break_.endTime);
    if (activeShortBreak) {
      entry = getInstance().endShortBreak(entry, activeShortBreak.id, now);
    }

    // Start lunch break
    entry.lunchBreak = {
      id: `lunch-${Date.now()}`,
      startTime: now,
      endTime: null
    };
    entry.status = 'on_break';

    TimeTrackingStorage.saveTimeEntry(entry);
    TimeTrackingStorage.saveCurrentSession(entry);

    getInstance().notifyUpdate(entry);
    getInstance().notifyStatusChange('on_break');

    return entry;
  }

  static endLunchBreak(): TimeEntry {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let entry = TimeTrackingStorage.getTimeEntry(today);
    if (!entry || !entry.lunchBreak || entry.lunchBreak.endTime) {
      throw new Error('No active lunch break found');
    }

    entry = getInstance().endLunchBreak(entry, now);

    TimeTrackingStorage.saveTimeEntry(entry);
    TimeTrackingStorage.saveCurrentSession(entry);

    getInstance().notifyUpdate(entry);
    getInstance().notifyStatusChange('clocked_in');

    return entry;
  }

  private endLunchBreak(entry: TimeEntry, endTime: Date): TimeEntry {
    if (!entry.lunchBreak || entry.lunchBreak.endTime) {
      return entry;
    }

    entry.lunchBreak.endTime = endTime;
    entry.lunchBreak.duration = TimeTrackingCalculations.calculateLunchBreakDuration(entry.lunchBreak);
    entry.status = 'clocked_in';

    return entry;
  }

  // Short break functionality
  static startShortBreak(reason?: string): TimeEntry {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let entry = TimeTrackingStorage.getTimeEntry(today);
    if (!entry || !entry.clockIn || entry.clockOut) {
      throw new Error('Must be clocked in to start a break');
    }

    // Check if already on any break
    if ((entry.lunchBreak && !entry.lunchBreak.endTime) ||
        entry.shortBreaks.some(break_ => !break_.endTime)) {
      throw new Error('Already on a break');
    }

    // Start short break
    const shortBreak: ShortBreak = {
      id: `break-${Date.now()}`,
      startTime: now,
      endTime: null,
      reason
    };

    entry.shortBreaks.push(shortBreak);
    entry.status = 'on_break';

    TimeTrackingStorage.saveTimeEntry(entry);
    TimeTrackingStorage.saveCurrentSession(entry);

    getInstance().notifyUpdate(entry);
    getInstance().notifyStatusChange('on_break');

    return entry;
  }

  static endShortBreak(breakId: string): TimeEntry {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let entry = TimeTrackingStorage.getTimeEntry(today);
    if (!entry) {
      throw new Error('No time entry found for today');
    }

    entry = getInstance().endShortBreak(entry, breakId, now);

    TimeTrackingStorage.saveTimeEntry(entry);
    TimeTrackingStorage.saveCurrentSession(entry);

    getInstance().notifyUpdate(entry);
    getInstance().notifyStatusChange('clocked_in');

    return entry;
  }

  private endShortBreak(entry: TimeEntry, breakId: string, endTime: Date): TimeEntry {
    const breakIndex = entry.shortBreaks.findIndex(break_ => break_.id === breakId);
    if (breakIndex === -1) {
      throw new Error('Break not found');
    }

    const shortBreak = entry.shortBreaks[breakIndex];
    if (shortBreak.endTime) {
      return entry; // Already ended
    }

    shortBreak.endTime = endTime;
    shortBreak.duration = TimeTrackingCalculations.calculateShortBreakDuration(shortBreak);
    entry.status = 'clocked_in';

    return entry;
  }

  // Get current status
  static getCurrentStatus(): {
    entry: TimeEntry | null;
    status: TimeEntry['status'];
    elapsedTime: number;
    isOnBreak: boolean;
    activeBreakType: 'lunch' | 'short' | null;
  } {
    const currentSession = TimeTrackingStorage.getCurrentSession();
    const todayEntry = TimeTrackingStorage.getOrCreateTodayEntry();

    const entry = currentSession || todayEntry;
    const status = entry.status;
    const elapsedTime = entry.clockIn ? TimeTrackingCalculations.calculateElapsedTime(entry) : 0;
    const isOnBreak = status === 'on_break';

    let activeBreakType: 'lunch' | 'short' | null = null;
    if (isOnBreak) {
      if (entry.lunchBreak && !entry.lunchBreak.endTime) {
        activeBreakType = 'lunch';
      } else {
        const activeShortBreak = entry.shortBreaks.find(break_ => !break_.endTime);
        if (activeShortBreak) {
          activeBreakType = 'short';
        }
      }
    }

    return {
      entry,
      status,
      elapsedTime,
      isOnBreak,
      activeBreakType
    };
  }

  // Elapsed timer management
  private startElapsedTimer(): void {
    if (this.elapsedTimeInterval) {
      clearInterval(this.elapsedTimeInterval);
    }

    this.elapsedTimeInterval = setInterval(() => {
      const currentStatus = TimeTrackingManager.getCurrentStatus();
      if (currentStatus.entry && currentStatus.status !== 'clocked_out') {
        this.notifyUpdate(currentStatus.entry);
      }
    }, 60000); // Update every minute
  }

  private stopElapsedTimer(): void {
    if (this.elapsedTimeInterval) {
      clearInterval(this.elapsedTimeInterval);
      this.elapsedTimeInterval = null;
    }
  }

  // Auto clock out check
  static checkAutoClockOut(): void {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const settings = TimeTrackingStorage.getSettings();

    if (settings.autoClockOut && currentTime >= settings.autoClockOutTime) {
      const currentStatus = TimeTrackingManager.getCurrentStatus();
      if (currentStatus.status === 'clocked_in' || currentStatus.status === 'on_break') {
        try {
          TimeTrackingManager.clockOut();
          console.log('Auto clock out completed');
        } catch (error) {
          console.error('Auto clock out failed:', error);
        }
      }
    }
  }

  // Settings management
  static updateSettings(newSettings: Partial<TimeTrackingSettings>): void {
    TimeTrackingStorage.saveSettings(newSettings);
  }

  static getSettings(): TimeTrackingSettings {
    return TimeTrackingStorage.getSettings();
  }

  // Initialize on app start
  static initialize(): void {
    // Check for incomplete sessions from previous sessions
    const currentSession = TimeTrackingStorage.getCurrentSession();
    if (currentSession) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // If session is from a different day, clear it
      if (currentSession.date !== today) {
        TimeTrackingStorage.clearCurrentSession();
      } else {
        // Resume tracking for today's session
        getInstance().startElapsedTimer();
      }
    }

    // Set up auto clock out checker
    setInterval(() => {
      TimeTrackingManager.checkAutoClockOut();
    }, 60000); // Check every minute

    console.log('Time tracking initialized');
  }

  // Export and data management
  static exportToCSV(): string {
    return TimeTrackingStorage.exportToCSV();
  }

  static exportTimeEntry(entry: TimeEntry): any {
    return {
      ...entry,
      clockIn: entry.clockIn?.toISOString(),
      clockOut: entry.clockOut?.toISOString(),
      lunchBreak: entry.lunchBreak ? {
        ...entry.lunchBreak,
        startTime: entry.lunchBreak.startTime.toISOString(),
        endTime: entry.lunchBreak.endTime?.toISOString()
      } : null,
      shortBreaks: entry.shortBreaks.map(break_ => ({
        ...break_,
        startTime: break_.startTime.toISOString(),
        endTime: break_.endTime?.toISOString()
      }))
    };
  }

  static importTimeEntry(data: any): TimeEntry {
    return {
      ...data,
      clockIn: data.clockIn ? new Date(data.clockIn) : null,
      clockOut: data.clockOut ? new Date(data.clockOut) : null,
      lunchBreak: data.lunchBreak ? {
        ...data.lunchBreak,
        startTime: new Date(data.lunchBreak.startTime),
        endTime: data.lunchBreak.endTime ? new Date(data.lunchBreak.endTime) : null
      } : null,
      shortBreaks: data.shortBreaks.map((break_: any) => ({
        ...break_,
        startTime: new Date(break_.startTime),
        endTime: break_.endTime ? new Date(break_.endTime) : null
      }))
    };
  }
}

// Helper function to get instance
function getInstance(): TimeTrackingManager {
  return TimeTrackingManager.getInstance();
}