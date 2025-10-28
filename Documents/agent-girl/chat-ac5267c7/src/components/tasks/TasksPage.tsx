import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, List, Grid, RotateCcw, Timer, Play, Pause } from 'lucide-react';
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

  const { timerState, addTimeToTimer, markTaskComplete, stopTimer, pauseTimer, resumeTimer } = useTimer();

  // Load initial tasks with smart data source selection
  useEffect(() => {
    const loadTasks = async () => {
      setSyncStatus('Loading tasks...');

      if (motionAPI.hasApiKey()) {
        // Try to load tasks from Motion first
        try {
          setSyncStatus('Connecting to Motion...');
          const motionTasks = await motionAPI.getTasks();
          if (motionTasks.success && motionTasks.data?.tasks) {
            setTasks(motionTasks.data.tasks);
            setSyncStatus(`✅ Synced ${motionTasks.data.tasks.length} tasks from Motion`);
            return;
          }
        } catch (error) {
          console.warn('Failed to load tasks from Motion, using realistic data:', error);
          setSyncStatus('Motion connection failed, using realistic task data');
        }
      }

      // Use realistic task data instead of dummy data
      const realTasks = generateRealTasks();
      setTasks(realTasks);
      setSyncStatus(`✅ Loaded ${realTasks.length} realistic tasks (connect Motion for live data)`);
    };

    loadTasks();
  }, []);

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
    let filtered = filterTasks(tasks, filter);

    // Apply month filtering
    filtered = getMonthTasks(filtered, selectedMonth);

    const sorted = sortTasks(filtered, sortBy);
    setFilteredTasks(sorted);
  }, [tasks, filter, sortBy, selectedMonth]);

  // Show time-up notification when timer reaches zero
  useEffect(() => {
    if (timerState.hasReachedZero && timerState.taskId && !showTimeUpNotification) {
      const activeTask = tasks.find(t => t.id === timerState.taskId);
      if (activeTask) {
        setShowTimeUpNotification(true);
      }
    }
  }, [timerState.hasReachedZero, timerState.taskId, tasks, showTimeUpNotification]);

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
    if (motionAPI.hasApiKey()) {
      try {
        await motionAPI.createTask(newTask);
      } catch (error) {
        console.error('Failed to sync new task to Motion:', error);
      }
    }
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));

    // Sync with Motion if connected
    if (motionAPI.hasApiKey()) {
      try {
        await motionAPI.updateTask(updatedTask.id, updatedTask);
      } catch (error) {
        console.error('Failed to sync task update to Motion:', error);
      }
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));

    // Sync with Motion if connected
    if (motionAPI.hasApiKey()) {
      try {
        await motionAPI.deleteTask(taskId);
      } catch (error) {
        console.error('Failed to sync task deletion to Motion:', error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  
  const handleSyncWithMotion = async () => {
    if (!motionAPI.hasApiKey()) {
      setSyncStatus('Please connect your Motion account in Settings first');
      setTimeout(() => setSyncStatus(''), 3000);
      return;
    }

    setIsProcessing(true);
    setSyncStatus('Syncing with Motion...');

    try {
      // Real sync operation with Motion API
      const motionTasks = await motionAPI.getTasks();

      if (motionTasks.success && motionTasks.data?.tasks) {
        setTasks(motionTasks.data.tasks);
        setSyncStatus(`Synced ${motionTasks.data.tasks.length} tasks from Motion!`);
      } else {
        throw new Error(motionTasks.error || 'Failed to sync tasks');
      }
    } catch (error) {
      setSyncStatus(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
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
  };

  const handleCloseTimeUpNotification = () => {
    setShowTimeUpNotification(false);
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
      {/* Clean Timer Widget */}
      <div className="mb-6">
        {timerState.isRunning ? (
          // Active Timer Display
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${getTimerDisplay().bgColor} backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg`}>
              {/* Main Timer Display */}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${timerState.isPaused ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'} transition-all duration-200`}>
                  {timerState.isPaused ? (
                    <Pause className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getTimerDisplay().color} font-mono`}>
                    {getTimerDisplay().text}
                  </div>
                  <div className={`text-xs ${getTimerDisplay().color} opacity-75`}>
                    {timerState.isPaused ? 'Timer Paused' : 'Timer Running'}
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={timerState.isPaused ? resumeTimer : pauseTimer}
                  className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 shadow-sm"
                >
                  {timerState.isPaused ? <Play className="w-5 h-5 text-green-500" /> : <Pause className="w-5 h-5 text-yellow-500" />}
                </button>
                <button
                  onClick={() => addTimeToTimer(15)}
                  className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all duration-200 shadow-sm"
                  title="Add 15 minutes"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={stopTimer}
                  className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm"
                  title="Stop timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Inactive Timer State
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-700">
                  <Timer className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 font-mono">
                    ⏱️ --:--
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    No Active Timer
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <CheckCircle className="w-4 h-4 text-sage-500" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tasks
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedMonthActiveTasksCount} active in {formatMonthTab(selectedMonth)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-100 dark:bg-gray-700 text-sage-600 dark:text-sage-400'
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
                  ? 'bg-gray-100 dark:bg-gray-700 text-sage-600 dark:text-sage-400'
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
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-sage-500 focus:border-sage-500"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created</option>
            <option value="title">Title</option>
          </select>

          {/* New Task Button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
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

      {/* Compact Sync Status */}
      {syncStatus && (
        <div className={`mb-4 p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${
          syncStatus.includes('Error')
            ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
            : syncStatus.includes('Syncing')
            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
            : 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50'
        }`}>
          {syncStatus.includes('Syncing') && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
          <span>{syncStatus}</span>
        </div>
      )}

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
                onToggleComplete={handleToggleCompleteInModal}
                onViewDetails={handleViewTaskDetails}
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
        onClose={handleCloseDetailModal}
        onEdit={handleEditTask}
        onDelete={handleTaskDeleted}
        onToggleComplete={handleToggleCompleteInModal}
      />

      {/* Time Up Notification */}
      {timerState.taskId && (
        <TimeUpNotification
          task={tasks.find(t => t.id === timerState.taskId)!}
          isVisible={showTimeUpNotification}
          onClose={handleCloseTimeUpNotification}
          onMarkComplete={handleMarkCompleteFromNotification}
          onAddTime={handleAddTimeFromNotification}
          onContinueWorking={handleCloseTimeUpNotification}
        />
      )}
    </div>
  );
};

export default TasksPage;