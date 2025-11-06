import { useTimer } from '../contexts/TimerContext';

// Safe timer hook that provides fallback values when not wrapped in TimerProvider
export const useSafeTimer = () => {
  try {
    return useTimer();
  } catch (error) {
    console.warn('useSafeTimer: Timer context not available, providing fallback values');
    // Provide fallback values when TimerProvider is not available
    return {
      timerState: {
        taskId: null,
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedTime: 0,
        elapsedTime: 0,
        estimatedDuration: 0,
        hasReachedZero: false,
        overtimeTime: 0
      },
      startTimer: () => {},
      pauseTimer: () => {},
      resumeTimer: () => {},
      stopTimer: () => {},
      resetTimer: () => {},
      getActiveTaskId: () => null,
      addTimeToTimer: () => {},
      markTaskComplete: () => {}
    };
  }
};