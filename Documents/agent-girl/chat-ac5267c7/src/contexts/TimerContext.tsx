import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Task } from '../types/tasks';
import { TimerState, TimerStats, formatTimerDisplay, saveTimerState, clearTimerState, loadTimerState, playTimerSound } from '../utils/timerUtils';

interface TimerContextType {
  timerState: TimerState;
  timerStats: TimerStats;
  startTimer: (task: Task) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  addTimeToTimer: (minutes: number) => void;
  markTaskComplete: () => void;
  isTimerActive: () => boolean;
  getActiveTaskId: () => string | null;
}

const initialTimerState: TimerState = {
  taskId: null,
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedTime: 0,
  pauseStartTime: null,
  estimatedDuration: 0,
  elapsedTime: 0,
  hasReachedZero: false,
  overtimeTime: 0
};

const initialTimerStats: TimerStats = {
  todayFocusTime: 0,
  sessionFocusTime: 0
};

type TimerAction =
  | { type: 'START_TIMER'; payload: { taskId: string; estimatedDuration: number } }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'ADD_TIME'; payload: number }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'MARK_REACHED_ZERO' }
  | { type: 'UPDATE_STATS'; payload: Partial<TimerStats> }
  | { type: 'LOAD_SAVED_STATE'; payload: TimerState };

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        taskId: action.payload.taskId,
        isRunning: true,
        isPaused: false,
        startTime: new Date(),
        pausedTime: 0,
        pauseStartTime: null,
        estimatedDuration: action.payload.estimatedDuration,
        elapsedTime: 0,
        hasReachedZero: false,
        overtimeTime: 0
      };

    case 'PAUSE_TIMER':
      return {
        ...state,
        isPaused: true,
        pauseStartTime: new Date()
      };

    case 'RESUME_TIMER':
      const pauseDuration = state.pauseStartTime
        ? new Date().getTime() - state.pauseStartTime.getTime()
        : 0;
      return {
        ...state,
        isPaused: false,
        pauseStartTime: null,
        pausedTime: state.pausedTime + pauseDuration
      };

    case 'STOP_TIMER':
      return initialTimerState;

    case 'ADD_TIME':
      return {
        ...state,
        estimatedDuration: state.estimatedDuration + action.payload
      };

    case 'UPDATE_ELAPSED_TIME':
      const newElapsedTime = action.payload;
      const estimatedMs = state.estimatedDuration * 60 * 1000;
      const isNowOverZero = newElapsedTime >= estimatedMs && !state.hasReachedZero;

      return {
        ...state,
        elapsedTime: newElapsedTime,
        hasReachedZero: newElapsedTime >= estimatedMs,
        overtimeTime: newElapsedTime > estimatedMs ? newElapsedTime - estimatedMs : 0
      };

    case 'MARK_REACHED_ZERO':
      return {
        ...state,
        hasReachedZero: true
      };

    case 'LOAD_SAVED_STATE':
      return action.payload;

    default:
      return state;
  }
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timerState, dispatch] = useReducer(timerReducer, initialTimerState);
  const [timerStats, setTimerStats] = React.useState<TimerStats>(initialTimerStats);

  // Load saved timer state on mount
  useEffect(() => {
    const savedState = loadTimerState();
    if (savedState && savedState.taskId) {
      dispatch({ type: 'LOAD_SAVED_STATE', payload: savedState });
    }
  }, []);

  // Save timer state whenever it changes
  useEffect(() => {
    if (timerState.taskId) {
      saveTimerState(timerState);
    } else {
      clearTimerState();
    }
  }, [timerState]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!timerState.isRunning || timerState.isPaused || !timerState.startTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = now - timerState.startTime!.getTime() - timerState.pausedTime;
      dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: elapsed });

      // Check if timer just reached zero
      const estimatedMs = timerState.estimatedDuration * 60 * 1000;
      if (elapsed >= estimatedMs && !timerState.hasReachedZero) {
        dispatch({ type: 'MARK_REACHED_ZERO' });
        playTimerSound();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.isPaused, timerState.startTime, timerState.pausedTime, timerState.estimatedDuration, timerState.hasReachedZero]);

  const startTimer = useCallback((task: Task) => {
    const taskDuration = task.estimatedTime || task.duration;
    if (!taskDuration) {
      console.warn('Cannot start timer: task has no estimated duration');
      return;
    }
    dispatch({
      type: 'START_TIMER',
      payload: {
        taskId: task.id,
        estimatedDuration: taskDuration
      }
    });
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      dispatch({ type: 'PAUSE_TIMER' });
    }
  }, [timerState.isRunning, timerState.isPaused]);

  const resumeTimer = useCallback(() => {
    if (timerState.isRunning && timerState.isPaused) {
      dispatch({ type: 'RESUME_TIMER' });
    }
  }, [timerState.isRunning, timerState.isPaused]);

  const stopTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
  }, []);

  const addTimeToTimer = useCallback((minutes: number) => {
    dispatch({ type: 'ADD_TIME', payload: minutes });
  }, []);

  const markTaskComplete = useCallback(() => {
    // This would update the task's actual time
    stopTimer();
  }, [stopTimer]);

  const isTimerActive = useCallback(() => {
    return timerState.isRunning && !timerState.isPaused;
  }, [timerState.isRunning, timerState.isPaused]);

  const getActiveTaskId = useCallback(() => {
    return timerState.taskId;
  }, [timerState.taskId]);

  const value: TimerContextType = {
    timerState,
    timerStats,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addTimeToTimer,
    markTaskComplete,
    isTimerActive,
    getActiveTaskId
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};