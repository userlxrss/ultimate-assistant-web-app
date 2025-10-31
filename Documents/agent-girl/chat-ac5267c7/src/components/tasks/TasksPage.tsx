import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, List, Grid, RotateCcw, Timer, Play, Pause, X, Edit2, Trash2 } from 'lucide-react';
import { Task, TaskFilter } from '../../types/tasks';
import { filterTasks } from '../../utils/taskUtils';
import { generateRealTasks, getTodayTasks } from '../../utils/realTaskData';
import { motionAPI } from '../../utils/motionApi';
import { useTimer } from '../../contexts/TimerContext';
import { formatMinutesDisplay, calculateDailyFocusTime, formatTimerDisplay } from '../../utils/timerUtils';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import TaskFilters from './TaskFilters';
import TaskDetailModal from './TaskDetailModal';
import TimeUpNotification from './TimeUpNotification';
import NotificationToast from './NotificationToast';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'title'>('priority');
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showTimeUpNotification, setShowTimeUpNotification] = useState(false);
const [hasShownTimeUpNotification, setHasShownTimeUpNotification] = useState(false);
  const [isMotionConnected, setIsMotionConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Notification and confirmation states
  const [notification, setNotification] = useState<{
    type: 'completion' | 'success' | 'error';
    taskName?: string;
    message?: string;
    timestamp: number;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskName: string;
    taskId: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    taskName: '',
    taskId: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active task timer state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const { timerState, addTimeToTimer, markTaskComplete, stopTimer, pauseTimer, resumeTimer } = useTimer();

  // Helper functions for storage with localStorage fallback
  const getStorageItem = async (key: string) => {
    try {
      // Try window.storage first (if available)
      if (typeof window !== 'undefined' && window.storage) {
        return await window.storage.get(key);
      }
    } catch (error) {
      console.log('window.storage not available, using localStorage');
    }

    // Fallback to localStorage
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.error('localStorage not available:', error);
      return null;
    }
  };

  const setStorageItem = async (key: string, value: string) => {
    try {
      // Try window.storage first (if available)
      if (typeof window !== 'undefined' && window.storage) {
        await window.storage.set(key, value, false);
        return;
      }
    } catch (error) {
      console.log('window.storage not available, using localStorage');
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage not available:', error);
    }
  };

  const deleteStorageItem = async (key: string) => {
    try {
      // Try window.storage first (if available)
      if (typeof window !== 'undefined' && window.storage) {
        await window.storage.delete(key);
        return;
      }
    } catch (error) {
      console.log('window.storage not available, using localStorage');
    }

    // Fallback to localStorage
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage not available:', error);
    }
  };

  // Check Motion connection and load tasks
  const checkMotionConnectionAndLoadTasks = async () => {
    setSyncStatus('Checking Motion connection...');
    setIsMotionConnected(false);

    try {
      console.log('=== CHECKING MOTION CONNECTION PERSISTENCE ===');

      // Check localStorage directly first (most reliable)
      let localStorageConnected = false;
      let localStorageApiKey = '';

      try {
        localStorageConnected = localStorage.getItem('motion-connected') === 'true';
        localStorageApiKey = localStorage.getItem('motion-api-key') || '';
        console.log('Direct localStorage check:', {
          connected: localStorageConnected,
          hasApiKey: !!localStorageApiKey,
          apiKeyLength: localStorageApiKey.length
        });
      } catch (error) {
        console.log('Direct localStorage check failed:', error);
      }

      // Check persistent storage functions (backup)
      const connected = await getStorageItem('motion-connected');
      const apiKey = await getStorageItem('motion-api-key');
      const lastSync = await getStorageItem('motion-last-sync');

      console.log('Storage function check:', {
        connected: connected?.value,
        hasApiKey: !!apiKey?.value,
        lastSync: lastSync?.value
      });

      // Use whichever method worked
      const hasConnection = localStorageConnected || connected?.value === 'true';
      const hasApiKey = localStorageApiKey || apiKey?.value;

      if (hasConnection && hasApiKey) {
        // Found saved connection!
        console.log('✅ FOUND SAVED MOTION CONNECTION!');
        console.log('🔑 API Key length:', hasApiKey.length);
        console.log('📅 Last Sync:', lastSync?.value || 'Never');

        setIsMotionConnected(true);
        motionAPI.setApiKey(hasApiKey);

        // Set last sync time if available
        if (lastSync?.value) {
          setLastSync(new Date(lastSync.value));
        }

        // Automatically fetch tasks
        console.log('🔄 Auto-syncing tasks...');
        await syncMotionTasks();
        console.log('✅ Auto-sync completed!');
        return;
      } else {
        // No saved connection - use test data to demonstrate description feature
        console.log('❌ NO SAVED MOTION CONNECTION FOUND');
        console.log('Connection status:', hasConnection);
        console.log('API Key present:', !!hasApiKey);
        console.log('🎯 Using test data to demonstrate task descriptions');

        setIsMotionConnected(false);
        setSyncStatus('⚠️ Not connected to Motion (using test data)');
        // Use test data with descriptions to demonstrate the feature
        const testTasks = generateRealTasks();
        setTasks(testTasks);
        console.log('✅ Loaded test tasks with descriptions:', testTasks.length);
      }
    } catch (error) {
      console.error('❌ ERROR CHECKING CONNECTION:', error);
      setIsMotionConnected(false);
      setSyncStatus('⚠️ Error checking connection (using test data)');
      // Use test data as fallback
      const testTasks = generateRealTasks();
      setTasks(testTasks);
      console.log('✅ Loaded test tasks as fallback:', testTasks.length);
    }

    // Fallback: Check if motionAPI already has the key (from Settings)
    if (motionAPI.hasApiKey()) {
      console.log('🔄 Found API key in motionAPI, connecting...');
      setIsMotionConnected(true);
      await syncMotionTasks();
    }

    console.log('=== CONNECTION CHECK COMPLETE ===');
  };

  useEffect(() => {
    checkMotionConnectionAndLoadTasks();
  }, []);

  // Sync tasks with Motion
  const syncMotionTasks = async () => {
    if (!motionAPI.hasApiKey()) {
      setSyncStatus('Please connect to Motion first');
      return;
    }

    setIsProcessing(true);
    setSyncStatus('Syncing with Motion...');

    try {
      // Save connection state to localStorage directly (most reliable)
      try {
        const apiKey = motionAPI.getApiKey();
        if (apiKey) {
          localStorage.setItem('motion-connected', 'true');
          localStorage.setItem('motion-api-key', apiKey);
          console.log('💾 Saved connection state to localStorage');
        }
      } catch (error) {
        console.log('Failed to save to localStorage:', error);
      }

      const motionTasks = await motionAPI.getTasks();
      if (motionTasks.success && motionTasks.data?.tasks) {
        setTasks(motionTasks.data.tasks);
        const syncTime = new Date();
        setLastSync(syncTime);

        // Save last sync time to both storage methods
        try {
          // Direct localStorage
          localStorage.setItem('motion-last-sync', syncTime.toISOString());

          // Storage functions as backup
          await setStorageItem('motion-last-sync', syncTime.toISOString());
          await setStorageItem('motion-task-count', motionTasks.data.tasks.length.toString());

          console.log('💾 Saved sync state successfully');
        } catch (error) {
          console.log('Could not save sync state:', error);
        }

        setSyncStatus(`✅ Synced ${motionTasks.data.tasks.length} tasks from Motion`);
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        throw new Error(motionTasks.error || 'Failed to sync tasks');
      }
    } catch (error) {
      console.error('Motion sync error:', error);
      setSyncStatus(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'} (using test data)`);
      // Use test data as fallback when Motion sync fails
      const testTasks = generateRealTasks();
      setTasks(testTasks);
      console.log('✅ Loaded test tasks due to sync failure:', testTasks.length);
    } finally {
      setIsProcessing(false);
    }
  };

  // Test storage persistence - can be called to verify connection storage
  const testStoragePersistence = async () => {
    try {
      console.log('=== TESTING STORAGE PERSISTENCE ===');

      // Test write
      await setStorageItem('test-key', 'test-value');
      console.log('✓ Write test passed');

      // Test read
      const result = await getStorageItem('test-key');
      console.log('✓ Read test passed:', result?.value);

      // Test Motion keys
      const motionConnected = await getStorageItem('motion-connected');
      const motionApiKey = await getStorageItem('motion-api-key');
      const motionLastSync = await getStorageItem('motion-last-sync');

      console.log('Motion storage state:');
      console.log('  - Connected:', motionConnected?.value);
      console.log('  - API Key:', motionApiKey?.value ? 'Present' : 'Missing');
      console.log('  - Last Sync:', motionLastSync?.value || 'Never');

      console.log('===================================');

      return {
        testWrite: !!result?.value,
        motionConnected: motionConnected?.value === 'true',
        hasApiKey: !!motionApiKey?.value,
        hasLastSync: !!motionLastSync?.value
      };
    } catch (error) {
      console.error('Storage test failed:', error);
      return null;
    }
  };

  // Notification functions
  const showCompletionNotification = (taskName: string) => {
    setNotification({
      type: 'completion',
      taskName: taskName,
      timestamp: Date.now()
    });
  };

  const showSuccessNotification = (message: string) => {
    setNotification({
      type: 'success',
      message: message,
      timestamp: Date.now()
    });
  };

  const showErrorNotification = (message: string) => {
    setNotification({
      type: 'error',
      message: message,
      timestamp: Date.now()
    });
  };

  // Task management functions
  const handleMarkComplete = async (taskId: string) => {
    try {
      setIsUpdating(true);

      // Get API key from storage
      const apiKeyResult = await getStorageItem('motion-api-key');

      if (!apiKeyResult?.value) {
        showErrorNotification('Please reconnect to Motion');
        return;
      }

      // Find the task to get its name
      const task = tasks.find(t => t.id === taskId);
      const taskName = task?.name || task?.title || 'Unknown task';

      // Update task status to completed in Motion API
      const response = await fetch(`https://api.usemotion.com/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': apiKeyResult.value,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Completed'
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();

        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, status: 'Completed', completed: true } : task
          )
        );

        // Close the modal
        closeTaskModal();

        // Show sophisticated completion notification
        showCompletionNotification(taskName);

        // Refresh task list to sync with Motion
        setTimeout(() => {
          syncMotionTasks();
        }, 1500);

      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error marking task complete:', error);
      showErrorNotification('Failed to mark task as complete. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
    closeTaskModal();
  };

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    // Show sophisticated confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      taskName: taskName,
      taskId: taskId,
      onConfirm: () => confirmDeleteTask(taskId),
      onCancel: () => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))
    });
  };

  const confirmDeleteTask = async (taskId: string) => {
    try {
      setIsDeleting(true);

      const apiKeyResult = await getStorageItem('motion-api-key');

      if (!apiKeyResult?.value) {
        showErrorNotification('Please reconnect to Motion');
        return;
      }

      const response = await fetch(`https://api.usemotion.com/v1/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKeyResult.value,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

        // Close modal
        closeTaskModal();
        setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));

        // Show success notification
        showSuccessNotification('Task deleted successfully');

      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showErrorNotification('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskCheckboxToggle = async (task: Task, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening modal

    const newStatus = task.status === 'Completed' ? 'Todo' : 'Completed';

    try {
      const apiKeyResult = await getStorageItem('motion-api-key');

      if (!apiKeyResult?.value) {
        showErrorNotification('Please reconnect to Motion');
        return;
      }

      const response = await fetch(`https://api.usemotion.com/v1/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': apiKeyResult.value,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === task.id ? { ...t, status: newStatus, completed: newStatus === 'Completed' } : t
          )
        );

        // Show completion notification if marking as complete
        if (newStatus === 'Completed') {
          const taskName = task.name || task.title || 'Unknown task';
          showCompletionNotification(taskName);
        }
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      showErrorNotification('Failed to update task. Please try again.');
    }
  };

  const openTaskModal = (task: Task) => {
    setSelectedTaskForDetail(task);
    setIsDetailModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTaskForDetail(null);
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Handle refresh tasks
  const handleRefresh = () => {
    syncMotionTasks();
  };

  // Handle disconnect from Motion
  const handleDisconnect = async () => {
    try {
      await deleteStorageItem('motion-connected');
      await deleteStorageItem('motion-api-key');
      await deleteStorageItem('motion-last-sync');
      setIsMotionConnected(false);
      setTasks([]);
      setLastSync(null);
      showSuccessNotification('Disconnected from Motion');
    } catch (error) {
      showErrorNotification('Failed to disconnect');
    }
  };

  // Active Task Timer Functions
  const formatTimerDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const formatTaskDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return 'Overdue';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const startTimer = () => {
    if (timerInterval) return; // Already running

    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);

    // Save timer state
    if (activeTask) {
      localStorage.setItem(`timer-${activeTask.id}`, JSON.stringify({
        startTime: Date.now(),
        seconds: timerSeconds
      }));
    }
  };

  const handlePauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
      setIsTimerRunning(false);

      // Save current state
      if (activeTask) {
        localStorage.setItem(`timer-${activeTask.id}`, JSON.stringify({
          startTime: Date.now(),
          seconds: timerSeconds
        }));
      }
    }
  };

  const handleStopTimer = () => {
    if (confirm('Stop tracking this task?')) {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setIsTimerRunning(false);
      setTimerSeconds(0);

      // Clear saved state
      if (activeTask) {
        localStorage.removeItem(`timer-${activeTask.id}`);

        // Update task status back to pending
        handleTaskCheckboxToggle(activeTask, { stopPropagation: () => {} } as any);
      }

      setActiveTask(null);
    }
  };

  const handleStartTaskTimer = async (task: Task) => {
    try {
      // Update task status to In Progress
      const apiKeyResult = await getStorageItem('motion-api-key');

      if (!apiKeyResult?.value) {
        showErrorNotification('Please reconnect to Motion');
        return;
      }

      const response = await fetch(`https://api.usemotion.com/v1/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': apiKeyResult.value,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'In Progress'
        })
      });

      if (response.ok) {
        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === task.id ? { ...t, status: 'In Progress' } : t
          )
        );

        setActiveTask({ ...task, status: 'In Progress' });
        setTimerSeconds(0);
        startTimer();
        showSuccessNotification(`Started timer for "${task.name || task.title}"`);
      } else {
        showErrorNotification('Failed to start timer');
      }
    } catch (error) {
      console.error('Error starting task timer:', error);
      showErrorNotification('Failed to start timer');
    }
  };

  const handleCompleteTaskFromTimer = async (taskId: string) => {
    if (!activeTask) return;

    try {
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setIsTimerRunning(false);

      // Mark task as complete
      await handleMarkComplete(taskId);

      // Show completion notification
      showCompletionNotification(activeTask.name || activeTask.title);

      // Clear active task
      setActiveTask(null);
      setTimerSeconds(0);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Find and set active task on component mount
  useEffect(() => {
    const findActiveTask = () => {
      const inProgressTask = tasks.find(task =>
        task.status === 'In Progress' || task.status === 'IN_PROGRESS' || task.status === 'in-progress'
      );

      if (inProgressTask) {
        setActiveTask(inProgressTask);

        // Check if timer should be running
        try {
          const savedTimerState = localStorage.getItem(`timer-${inProgressTask.id}`);
          if (savedTimerState) {
            const { startTime, seconds } = JSON.parse(savedTimerState);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setTimerSeconds(seconds + elapsed);
            startTimer();
          }
        } catch (error) {
          console.log('No saved timer state found');
        }
      }
    };

    if (tasks.length > 0) {
      findActiveTask();
    }
  }, [tasks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Connect to Motion
  const handleConnectToMotion = async () => {
    setIsProcessing(true);
    setSyncStatus('Connecting to Motion...');

    try {
      // Use the built-in connectToMotion function from motionAPI
      const connected = await motionAPI.connectToMotion();
      if (connected) {
        setIsMotionConnected(true);
        setSyncStatus('✅ Connected to Motion!');
        await syncMotionTasks();
      } else {
        setSyncStatus('❌ Failed to connect to Motion');
        setTimeout(() => setSyncStatus(''), 3000);
      }
    } catch (error) {
      console.error('Motion connection error:', error);
      setSyncStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSyncStatus(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disconnect from Motion
  const handleDisconnectMotion = async () => {
    try {
      await motionAPI.disconnectMotion();
      setIsMotionConnected(false);
      setTasks([]);
      setLastSync(null);
      setSyncStatus('Disconnected from Motion');
    } catch (error) {
      console.error('Motion disconnect error:', error);
      setSyncStatus('Failed to disconnect from Motion');
    }
  };

  // Helper functions for month management
  const getMonthTasks = (tasks: Task[], month: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.getMonth() === month.getMonth() &&
             taskDate.getFullYear() === month.getFullYear();
    });
  };

  const getMonthTaskCount = (tasks: Task[], month: Date): number => {
    return getMonthTasks(tasks, month).length;
  };

  const getMonthTabs = (): Date[] => {
    const tabs = [];
    const currentDate = new Date();

    // Previous month
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    tabs.push(prevMonth);

    // Current month
    tabs.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

    // Next 2 months
    for (let i = 1; i <= 2; i++) {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      tabs.push(nextMonth);
    }

    return tabs;
  };

  const formatMonthTab = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Update filtered tasks when tasks, filter, or selected month change
  useEffect(() => {
    // Temporarily show all tasks - will implement proper user filtering later
    let filtered = filterTasks(tasks, filter);

    // Apply month filtering
    filtered = getMonthTasks(filtered, selectedMonth);

    const sorted = sortTasks(filtered, sortBy);
    setFilteredTasks(sorted);
  }, [tasks, filter, sortBy, selectedMonth]);

  // Show time-up notification when timer reaches zero - EMERGENCY DISABLED
  useEffect(() => {
    // 🚨 EMERGENCY: DISABLED to stop infinite popup loop
    // Only show modal if timer has reached zero, we have a task, modal isn't already showing, AND we haven't shown it before
    if (false && timerState.hasReachedZero && timerState.taskId && !showTimeUpNotification && !hasShownTimeUpNotification) {
      const activeTask = tasks.find(t => t.id === timerState.taskId);
      if (activeTask) {
        console.log('🕐 Timer reached zero, showing notification for task:', activeTask.title);
        // CRITICAL: Set flag IMMEDIATELY to prevent re-triggering
        setHasShownTimeUpNotification(true);
        setShowTimeUpNotification(true);
      }
    }
  }, [timerState.hasReachedZero, timerState.taskId, tasks, showTimeUpNotification, hasShownTimeUpNotification]);

  const sortTasks = (tasksToSort: Task[], criteria: string): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      switch (criteria) {
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const handleTaskAdded = async (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);

    // Sync with Motion if connected
    if (isMotionConnected) {
      try {
        await motionAPI.createTask(newTask);
        setSyncStatus(`✅ Task created and synced to Motion`);
        setTimeout(() => setSyncStatus(''), 3000);
      } catch (error) {
        console.error('Failed to sync new task to Motion:', error);
        setSyncStatus(`⚠️ Task saved locally, sync to Motion failed`);
        setTimeout(() => setSyncStatus(''), 3000);
      }
    }
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));

    // Set active task if status is pending or in-progress
    if (updatedTask.status === 'pending' || updatedTask.status === 'in-progress' || updatedTask.status === 'In Progress') {
      setActiveTask(updatedTask);
      // Start timer if not already running
      if (!isTimerRunning && timerSeconds === 0) {
        startTimer();
      }
    } else if (updatedTask.status === 'completed') {
      // Clear active task if completed
      setActiveTask(null);
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setIsTimerRunning(false);
      setTimerSeconds(0);
    }

    // Sync with Motion if connected
    if (isMotionConnected) {
      try {
        await motionAPI.updateTask(updatedTask.id, updatedTask);
        setSyncStatus(`✅ Task updated and synced to Motion`);
        setTimeout(() => setSyncStatus(''), 3000);
      } catch (error) {
        console.error('Failed to sync task update to Motion:', error);
        setSyncStatus(`⚠️ Task updated locally, sync to Motion failed`);
        setTimeout(() => setSyncStatus(''), 3000);
      }
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));

    // Sync with Motion if connected
    if (isMotionConnected) {
      try {
        await motionAPI.deleteTask(taskId);
        setSyncStatus(`✅ Task deleted and synced to Motion`);
        setTimeout(() => setSyncStatus(''), 3000);
      } catch (error) {
        console.error('Failed to sync task deletion to Motion:', error);
        setSyncStatus(`⚠️ Task deleted locally, sync to Motion failed`);
        setTimeout(() => setSyncStatus(''), 3000);
      }
    }
  };


  // No longer needed - replaced with syncMotionTasks
  const handleSyncWithMotion = () => {
    syncMotionTasks();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const handleFormSave = (task: Task) => {
    if (editingTask) {
      handleTaskUpdated(task);
    } else {
      handleTaskAdded(task);
    }
    handleFormClose();
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTaskForDetail(task);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTaskForDetail(null);
  };

  const handleToggleCompleteInModal = (task: Task) => {
    handleTaskUpdated(task);
  };

  const handleMarkCompleteFromNotification = () => {
    if (timerState.taskId) {
      const task = tasks.find(t => t.id === timerState.taskId);
      if (task) {
        // Calculate actual time spent
        const actualMinutes = Math.floor(timerState.elapsedTime / 60000);
        const updatedTask = {
          ...task,
          status: 'completed' as const,
          completed: true,
          completedAt: new Date(),
          actualTime: actualMinutes
        };
        handleTaskUpdated(updatedTask);
        markTaskComplete();
      }
    }
  };

  const handleAddTimeFromNotification = () => {
    addTimeToTimer(15);
    // Close modal and reset flag
    setShowTimeUpNotification(false);
    setTimeout(() => {
      setHasShownTimeUpNotification(false);
    }, 1000);
  };

  const handleCloseTimeUpNotification = () => {
    setShowTimeUpNotification(false);
    // Reset the flag after a short delay so notifications can work for different tasks
    setTimeout(() => {
      setHasShownTimeUpNotification(false);
    }, 1000);

    // Clear timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
    // Clear timer state
    if (activeTask) {
      localStorage.removeItem(`timer-${activeTask.id}`);
    }
    setActiveTask(null);
  };

  const getTimerDisplay = () => {
    if (!timerState.isRunning) {
      return {
        text: '⏱️ Start a task timer',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700'
      };
    }

    if (timerState.isPaused) {
      return {
        text: `⏸️ PAUSED ${formatTimerDisplay((timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime)}`,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30'
      };
    }

    const remainingTime = (timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime;
    const isOvertime = timerState.hasReachedZero || remainingTime < 0;

    if (isOvertime) {
      return {
        text: `⏱️ +${formatTimerDisplay(timerState.overtimeTime, true)}`,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30'
      };
    }

    return {
      text: `⏱️ ${formatTimerDisplay(remainingTime)}`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    };
  };

  const activeTasksCount = tasks.filter(task => !task.completed).length;
  const selectedMonthActiveTasksCount = getMonthTasks(tasks.filter(task => !task.completed), selectedMonth).length;

  // Calculate daily focus time
  const dailyFocusTime = calculateDailyFocusTime(tasks);
  const currentSessionTime = timerState.elapsedTime;
  const totalFocusTime = dailyFocusTime + currentSessionTime;

  return (
    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
      {/* PREMIUM "Currently Working On" Timer Card */}
      <div className="mb-6">
        {activeTask ? (
          /* PREMIUM Active Task Timer Card */
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-2.5">
            {/* Removed fancy backgrounds */}

            <div className="relative z-10">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                {/* Status Badge with Animation */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase">
                      Working
                    </span>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={isTimerRunning ? handlePauseTimer : () => { if (activeTask) startTimer(); }}
                    className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 shadow-sm"
                    title={isTimerRunning ? "Pause" : "Start"}
                  >
                    {isTimerRunning ? (
                      <Pause className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                  <button
                    onClick={handleStopTimer}
                    className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105 shadow-sm"
                    title="Stop"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex items-start gap-6">
                {/* Premium Timer Display */}
                <div className="flex-shrink-0">
                  <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-inner border border-gray-100 dark:border-gray-700">
                    {/* Decorative Corner */}
                    <div className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl" />
                    <div className="absolute bottom-2 right-2 w-12 h-12 bg-gradient-to-tr from-violet-400/15 to-purple-400/15 rounded-full blur-xl" />

                    <div className="relative z-10">
                      <div className="text-xl font-bold text-gray-900 dark:text-white font-mono tracking-tight tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                        {formatTimerDisplay(timerSeconds)}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-2 text-center">
                        {isTimerRunning ? 'running' : 'paused'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Information Section */}
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                      {activeTask.name || activeTask.title}
                    </h3>

                    {/* Description Snippet */}
                    {(activeTask.description || activeTask.notes) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {activeTask.description || activeTask.notes}
                      </p>
                    )}

                    {/* Compact Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {/* Priority Badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        activeTask.priority === 'High' || activeTask.priority === 'Urgent'
                          ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 border border-red-200/50 dark:border-red-700/50'
                          : activeTask.priority === 'Medium'
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-700/50'
                          : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 dark:from-gray-800/50 dark:to-slate-800/50 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50'
                      }`}>
                        {activeTask.priority || 'Medium'} Priority
                      </span>

                      {/* Due Date */}
                      {activeTask.dueDate && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                          <Clock className="w-3.5 h-3.5" />
                          Due {formatTaskDate(activeTask.dueDate)}
                        </span>
                      )}

                      {/* Estimated Time */}
                      {activeTask.duration && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                          <Timer className="w-3.5 h-3.5" />
                          {activeTask.duration}m estimated
                        </span>
                      )}
                    </div>

                    {/* Premium Progress Bar */}
                    {activeTask.duration && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          <span>Progress</span>
                          <span>
                            {Math.min(Math.round((timerSeconds / 60 / activeTask.duration) * 100), 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100/80 dark:bg-gray-700/80 rounded-full overflow-hidden backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              (timerSeconds / 60) > activeTask.duration
                                ? 'bg-gradient-to-r from-orange-400 via-red-500 to-rose-600 shadow-lg shadow-orange-500/50'
                                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/30'
                            }`}
                            style={{
                              width: `${Math.min((timerSeconds / 60 / activeTask.duration) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCompleteTaskFromTimer(activeTask.id)}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 group"
                      >
                        <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Complete Task
                      </button>
                      <button
                        onClick={() => openTaskModal(activeTask)}
                        className="px-5 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200/50 dark:border-gray-600/50 flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <Edit2 className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Description Preview */}
              {activeTask.description && (
                <div className="mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {stripHtml(activeTask.description)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Removed "No Active Timer" message - timer shows only when task is active */
          null
        )}
      </div>

      {/* Motion connection banners removed */}

      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Tasks
          </h1>
          <p className="text-sm text-gray-600">
            {tasks.length} active tasks in Oct 2025
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created</option>
            <option value="title">Title</option>
          </select>

          {/* Add Task Button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Month Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          {getMonthTabs().map((monthDate) => {
            const taskCount = getMonthTaskCount(tasks, monthDate);
            const isSelected = monthDate.getMonth() === selectedMonth.getMonth() &&
                              monthDate.getFullYear() === selectedMonth.getFullYear();
            const isCurrentMonth = monthDate.getMonth() === new Date().getMonth() &&
                                  monthDate.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                onClick={() => setSelectedMonth(monthDate)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-white dark:bg-gray-900 text-sage-600 dark:text-sage-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className={isCurrentMonth && !isSelected ? 'text-sage-500 font-semibold' : ''}>
                  {formatMonthTab(monthDate)}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  isSelected
                    ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400'
                    : isCurrentMonth
                    ? 'bg-sage-50 dark:bg-sage-900/20 text-sage-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {taskCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Motion connection status and sync status removed */}


      {/* Compact Filters */}
      <div className="mb-4">
        <TaskFilters filter={filter} onFilterChange={setFilter} tasks={tasks} />
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
          <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            No tasks found for {formatMonthTab(selectedMonth)}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {Object.keys(filter).some(key => filter[key as keyof TaskFilter])
              ? 'Try adjusting your filters or selecting a different month'
              : `Create your first task for ${formatMonthTab(selectedMonth)} to get started`}
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium transition-colors"
          >
            Create Task
          </button>
        </div>
      ) : (
        <>
          {/* Compact Task Count and Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} for {formatMonthTab(selectedMonth)}
              </span>

              {/* Compact Stats */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs">
                    {tasks.filter(t => t.completed).length}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-xs">
                    {tasks.filter(t => !t.completed && t.priority === 'urgent').length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSyncWithMotion}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 disabled:opacity-50"
              title="Sync with Motion"
            >
              <RotateCcw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>

          {/* Compact Task Items */}
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'
            : 'space-y-2'
          }>
            {filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdated}
                onDelete={handleTaskDeleted}
                onEdit={handleEditTask}
                onToggleComplete={(task, event) => handleTaskCheckboxToggle(task, event!)}
                onViewDetails={openTaskModal}
                // Active task widget integration props
                isTimerRunning={isTimerRunning}
                activeTask={activeTask}
                timerSeconds={timerSeconds}
                onStartTaskTimer={handleStartTaskTimer}
              />
            ))}
          </div>
        </>
      )}

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={isDetailModalOpen}
        onClose={closeTaskModal}
        onEdit={handleEditTask}
        onDelete={(taskId) => handleDeleteTask(taskId, selectedTaskForDetail?.name || selectedTaskForDetail?.title || 'Unknown task')}
        onToggleComplete={(task) => handleMarkComplete(task.id)}
        onUpdate={handleTaskUpdated}
      />

      {/* Time Up Notification - EMERGENCY DISABLED */}
      {false && timerState.taskId && (
        <TimeUpNotification
          task={tasks.find(t => t.id === timerState.taskId)!}
          isVisible={showTimeUpNotification}
          onClose={handleCloseTimeUpNotification}
          onMarkComplete={handleMarkCompleteFromNotification}
          onAddTime={handleAddTimeFromNotification}
          onContinueWorking={handleCloseTimeUpNotification}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        taskName={deleteConfirmation.taskName}
        onConfirm={deleteConfirmation.onConfirm}
        onCancel={deleteConfirmation.onCancel}
        isDeleting={isDeleting}
      />

      {/* 🚨 EMERGENCY KILL SWITCH */}
      <button
        onClick={() => {
          console.log('🚨 EMERGENCY RESET - Force closing all timer notifications');

          // Force close notification
          setShowTimeUpNotification(false);
          setTimeUpTask(null);
          setHasShownTimeUpNotification(false);

          // Stop all timers
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
          setIsTimerRunning(false);
          setTimerSeconds(0);
          setActiveTask(null);

          // Clear all timer localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('timer-')) {
              localStorage.removeItem(key);
            }
          });

          alert('🚨 Emergency reset complete! Timer notifications have been stopped.');
        }}
        className="fixed bottom-4 right-4 z-[999999] px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-2xl transition-all hover:scale-105"
        style={{ zIndex: 999999 }}
        title="Emergency stop - Force close all timer notifications"
      >
        🚨 STOP TIMER
      </button>
    </div>
  );
};

export default TasksPage;