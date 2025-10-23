import { Task } from '../types/tasks';

export interface TimerState {
  taskId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  startTime: Date | null;
  pausedTime: number; // total time paused in milliseconds
  pauseStartTime: Date | null;
  estimatedDuration: number; // in minutes
  elapsedTime: number; // in milliseconds
  hasReachedZero: boolean;
  overtimeTime: number; // in milliseconds
}

export interface TimerStats {
  todayFocusTime: number; // in milliseconds
  sessionFocusTime: number; // in milliseconds
}

export const formatTimerDisplay = (milliseconds: number, isOvertime: boolean = false): string => {
  const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const prefix = isOvertime ? '+ ' : '';
  return `${prefix}${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatMinutesDisplay = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

export const calculateDailyFocusTime = (tasks: Task[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.reduce((total, task) => {
    if (task.actualTime && task.status === 'completed') {
      // Check if task was completed today
      if (task.completedAt && task.completedAt >= today) {
        return total + (task.actualTime * 60 * 1000); // convert minutes to milliseconds
      }
    }
    return total;
  }, 0);
};

export const getDefaultDurations = (): Array<{ label: string; value: number }> => {
  return [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: 'Custom', value: -1 }
  ];
};

export const saveTimerState = (state: TimerState): void => {
  try {
    localStorage.setItem('taskTimerState', JSON.stringify({
      ...state,
      startTime: state.startTime?.toISOString(),
      pauseStartTime: state.pauseStartTime?.toISOString()
    }));
  } catch (error) {
    console.warn('Failed to save timer state:', error);
  }
};

export const loadTimerState = (): TimerState | null => {
  try {
    const saved = localStorage.getItem('taskTimerState');
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      startTime: parsed.startTime ? new Date(parsed.startTime) : null,
      pauseStartTime: parsed.pauseStartTime ? new Date(parsed.pauseStartTime) : null
    };
  } catch (error) {
    console.warn('Failed to load timer state:', error);
    return null;
  }
};

export const clearTimerState = (): void => {
  try {
    localStorage.removeItem('taskTimerState');
  } catch (error) {
    console.warn('Failed to clear timer state:', error);
  }
};

export const playTimerSound = (): void => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 800 Hz - gentle beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Start at 30% volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Fade out over 0.5s

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Failed to play timer sound:', error);
  }
};