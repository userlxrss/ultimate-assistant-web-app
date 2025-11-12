import { TimeEntry, LunchBreak, ShortBreak, TimeTrackingSettings } from '../types';

export class TimeTrackingCalculations {

  // Rounding utility
  static roundToNearest(minutes: number, nearest: number): number {
    return Math.round(minutes / nearest) * nearest;
  }

  // Format time utilities
  static formatMinutesToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  static formatMinutesToDecimalHours(minutes: number): number {
    return Math.round((minutes / 60) * 100) / 100;
  }

  static formatDecimalHoursToTime(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Calculate duration between two dates
  static calculateDuration(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
  }

  // Calculate lunch break duration
  static calculateLunchBreakDuration(lunchBreak: LunchBreak | null): number {
    if (!lunchBreak || !lunchBreak.endTime) return 0;
    return this.calculateDuration(lunchBreak.startTime, lunchBreak.endTime);
  }

  // Calculate short break duration
  static calculateShortBreakDuration(shortBreak: ShortBreak): number {
    if (!shortBreak.endTime) return 0;
    return this.calculateDuration(shortBreak.startTime, shortBreak.endTime);
  }

  // Calculate total break time for a day
  static calculateTotalBreakTime(entry: TimeEntry): number {
    let totalBreakTime = 0;

    // Add lunch break
    totalBreakTime += this.calculateLunchBreakDuration(entry.lunchBreak);

    // Add all short breaks
    entry.shortBreaks.forEach(break_ => {
      totalBreakTime += this.calculateShortBreakDuration(break_);
    });

    return totalBreakTime;
  }

  // Calculate total worked hours (excluding breaks)
  static calculateWorkedHours(entry: TimeEntry, settings?: TimeTrackingSettings): number {
    if (!entry.clockIn || !entry.clockOut) return 0;

    // Calculate total time from clock in to clock out
    const totalTime = this.calculateDuration(entry.clockIn, entry.clockOut);

    // Calculate total break time
    const totalBreakTime = this.calculateTotalBreakTime(entry);

    // Worked time = total time - break time
    let workedTime = totalTime - totalBreakTime;

    // Apply rounding if enabled
    if (settings?.roundTime && settings.roundToMinutes) {
      workedTime = this.roundToNearest(workedTime, settings.roundToMinutes);
    }

    // Convert to hours and round to 2 decimal places
    return this.formatMinutesToDecimalHours(workedTime);
  }

  // Check if arrival is late
  static isLateArrival(clockIn: Date, scheduledStart: string, thresholdMinutes: number = 5): boolean {
    const [hours, minutes] = scheduledStart.split(':').map(Number);
    const scheduledTime = new Date(clockIn);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const arrivalTime = new Date(clockIn);
    const differenceMinutes = (arrivalTime.getTime() - scheduledTime.getTime()) / (1000 * 60);

    return differenceMinutes > thresholdMinutes;
  }

  // Calculate elapsed time since clock in (for current session)
  static calculateElapsedTime(entry: TimeEntry): number {
    if (!entry.clockIn) return 0;

    const currentTime = entry.clockOut || new Date();
    const elapsedTime = this.calculateDuration(entry.clockIn, currentTime);

    // Subtract any ongoing break times
    if (entry.lunchBreak && !entry.lunchBreak.endTime) {
      return Math.max(0, elapsedTime - this.calculateDuration(entry.lunchBreak.startTime, currentTime));
    }

    const activeShortBreak = entry.shortBreaks.find(break_ => !break_.endTime);
    if (activeShortBreak) {
      return Math.max(0, elapsedTime - this.calculateDuration(activeShortBreak.startTime, currentTime));
    }

    // Subtract completed breaks
    const totalBreakTime = entry.shortBreaks.reduce((total, break_) => {
      if (break_.endTime) {
        return total + this.calculateShortBreakDuration(break_);
      }
      return total;
    }, 0);

    return Math.max(0, elapsedTime - totalBreakTime);
  }

  // Calculate overtime
  static calculateOvertime(hours: number, standardHours: number = 8): number {
    return Math.max(0, hours - standardHours);
  }

  // Get timesheet summary
  static getTimesheetSummary(entries: TimeEntry[]): {
    totalDays: number;
    totalHours: number;
    averageHoursPerDay: number;
    totalBreakTime: number;
    lateArrivals: number;
    onTimeArrivals: number;
    overtimeHours: number;
    regularHours: number;
  } {
    const completedEntries = entries.filter(entry => entry.status === 'clocked_out');

    const totalDays = completedEntries.length;
    const totalHours = completedEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalBreakTime = completedEntries.reduce((sum, entry) => sum + this.calculateTotalBreakTime(entry), 0);
    const lateArrivals = completedEntries.filter(entry => entry.isLateArrival).length;
    const onTimeArrivals = totalDays - lateArrivals;
    const overtimeHours = completedEntries.reduce((sum, entry) => sum + this.calculateOvertime(entry.totalHours), 0);
    const regularHours = totalHours - overtimeHours;

    return {
      totalDays,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
      totalBreakTime,
      lateArrivals,
      onTimeArrivals,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      regularHours: Math.round(regularHours * 100) / 100
    };
  }

  // Filter time entries
  static filterTimeEntries(
    entries: TimeEntry[],
    filters: {
      dateRange: { start: Date; end: Date };
      status?: TimeEntry['status'];
      showLateArrivalsOnly?: boolean;
      minHours?: number;
      maxHours?: number;
    }
  ): TimeEntry[] {
    return entries.filter(entry => {
      // Date range filter
      const entryDate = new Date(entry.date);
      if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
        return false;
      }

      // Status filter
      if (filters.status && entry.status !== filters.status) {
        return false;
      }

      // Late arrivals filter
      if (filters.showLateArrivalsOnly && !entry.isLateArrival) {
        return false;
      }

      // Hours range filter
      if (filters.minHours && entry.totalHours < filters.minHours) {
        return false;
      }

      if (filters.maxHours && entry.totalHours > filters.maxHours) {
        return false;
      }

      return true;
    });
  }

  // Get weekly summary
  static getWeeklySummary(entries: TimeEntry[], weekStart: Date): {
    weekOf: string;
    entries: TimeEntry[];
    summary: ReturnType<typeof TimeTrackingCalculations.getTimesheetSummary>;
  } {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekEntries = this.filterTimeEntries(entries, {
      dateRange: { start: weekStart, end: weekEnd }
    });

    return {
      weekOf: weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      entries: weekEntries,
      summary: this.getTimesheetSummary(weekEntries)
    };
  }

  // Get monthly summary
  static getMonthlySummary(entries: TimeEntry[], year: number, month: number): {
    month: string;
    entries: TimeEntry[];
    summary: ReturnType<typeof TimeTrackingCalculations.getTimesheetSummary>;
    weeklyBreakdown: Array<ReturnType<typeof TimeTrackingCalculations.getWeeklySummary>>;
  } {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthEntries = this.filterTimeEntries(entries, {
      dateRange: { start: monthStart, end: monthEnd }
    });

    // Get weekly breakdown
    const weeklyBreakdown: Array<ReturnType<typeof TimeTrackingCalculations.getWeeklySummary>> = [];
    const currentWeek = new Date(monthStart);

    // Adjust to start of week (Sunday)
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());

    while (currentWeek <= monthEnd) {
      const weekSummary = this.getWeeklySummary(entries, new Date(currentWeek));
      if (weekSummary.entries.length > 0) {
        weeklyBreakdown.push(weekSummary);
      }
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return {
      month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      entries: monthEntries,
      summary: this.getTimesheetSummary(monthEntries),
      weeklyBreakdown
    };
  }

  // Validation utilities
  static validateTimeEntry(entry: TimeEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!entry.id) errors.push('Entry ID is required');
    if (!entry.date) errors.push('Date is required');

    // Clock in/out validation
    if (entry.clockIn && entry.clockOut) {
      if (entry.clockOut <= entry.clockIn) {
        errors.push('Clock out time must be after clock in time');
      }

      // Check for reasonable work hours (max 24 hours)
      const totalHours = this.calculateDuration(entry.clockIn, entry.clockOut);
      if (totalHours > 24 * 60) {
        errors.push('Work duration cannot exceed 24 hours');
      }
    }

    // Lunch break validation
    if (entry.lunchBreak) {
      if (entry.lunchBreak.endTime && entry.lunchBreak.endTime <= entry.lunchBreak.startTime) {
        errors.push('Lunch break end time must be after start time');
      }

      const lunchDuration = this.calculateLunchBreakDuration(entry.lunchBreak);
      if (lunchDuration > 4 * 60) { // max 4 hours
        errors.push('Lunch break cannot exceed 4 hours');
      }
    }

    // Short breaks validation
    entry.shortBreaks.forEach((break_, index) => {
      if (break_.endTime && break_.endTime <= break_.startTime) {
        errors.push(`Short break ${index + 1} end time must be after start time`);
      }

      const breakDuration = this.calculateShortBreakDuration(break_);
      if (breakDuration > 60) { // max 1 hour per short break
        errors.push(`Short break ${index + 1} cannot exceed 1 hour`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}