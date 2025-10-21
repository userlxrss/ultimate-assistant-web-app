import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, BarChart3, Calendar, Filter, List, Grid, Bell, Settings, Download, Upload, RotateCcw } from 'lucide-react';
import { Task, TaskFilter, TaskStats as TaskStatsType } from '../../types/tasks';
import { filterTasks, calculateTaskStats } from '../../utils/taskUtils';
import { generateTasks } from '../../utils/dataGenerator';
import { motionAPI } from '../../utils/motionApi';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import TaskStatsComponent from './TaskStats';
import TaskFilters from './TaskFilters';
import QuickAddTask from './QuickAddTask';
import TimeBlockingView from './TimeBlockingView';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [stats, setStats] = useState<TaskStatsType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('list');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'title'>('priority');
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Load initial tasks
  useEffect(() => {
    const initialTasks = generateTasks(30);
    setTasks(initialTasks);
  }, []);

  // Update filtered tasks and stats when tasks or filter change
  useEffect(() => {
    const filtered = filterTasks(tasks, filter);
    const sorted = sortTasks(filtered, sortBy);
    setFilteredTasks(sorted);
    setStats(calculateTaskStats(tasks));
  }, [tasks, filter, sortBy]);

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

  const handleTaskAdded = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleBulkComplete = async () => {
    if (!confirm('Mark all filtered tasks as complete?')) return;

    setIsProcessing(true);
    setSyncStatus('Completing tasks...');

    const incompleteTasks = filteredTasks.filter(task => !task.completed);
    const taskIds = incompleteTasks.map(task => task.id);

    try {
      const response = await motionAPI.bulkCompleteTasks(taskIds);
      if (response.success) {
        const updatedTasks = tasks.map(task => {
          if (taskIds.includes(task.id)) {
            return {
              ...task,
              completed: true,
              completedAt: new Date(),
              status: 'completed' as Task['status']
            };
          }
          return task;
        });
        setTasks(updatedTasks);
        setSyncStatus(`Completed ${response.data?.successful || 0} tasks successfully!`);
      } else {
        throw new Error(response.error || 'Failed to complete tasks');
      }
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all tasks? This action cannot be undone.')) return;

    setIsProcessing(true);
    setSyncStatus('Deleting all tasks...');

    try {
      // Simulate bulk delete
      const deletePromises = tasks.map(task => motionAPI.deleteTask(task.id));
      await Promise.all(deletePromises);

      setTasks([]);
      setSyncStatus('All tasks deleted successfully!');
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleSyncWithMotion = async () => {
    setIsProcessing(true);
    setSyncStatus('Syncing with Motion...');

    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update sync status for all tasks
      const updatedTasks = tasks.map(task => ({
        ...task,
        syncStatus: 'synced' as const,
        lastSyncAt: new Date()
      }));

      setTasks(updatedTasks);
      setSyncStatus('Sync completed successfully!');
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const activeTasksCount = tasks.filter(task => !task.completed).length;

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📋 You have {activeTasksCount} task{activeTasksCount !== 1 ? 's' : ''}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your tasks efficiently with Motion API integration
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-white/10 dark:bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white/20 dark:bg-white/10' : ''
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white/20 dark:bg-white/10' : ''
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'timeline' ? 'bg-white/20 dark:bg-white/10' : ''
                }`}
                title="Timeline view"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="createdAt">Sort by Created</option>
              <option value="title">Sort by Title</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Daily Reminder */}
        <div className="p-4 rounded-lg bg-soft-lavender-100 dark:bg-soft-lavender-900/20 border border-soft-lavender-200 dark:border-soft-lavender-800">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-soft-lavender-600 dark:text-soft-lavender-400" />
            <div className="flex-1">
              <div className="font-medium text-soft-lavender-700 dark:text-soft-lavender-300">
                Daily Reminder
              </div>
              <div className="text-sm text-soft-lavender-600 dark:text-soft-lavender-400">
                You receive task updates daily at 7:00 AM
              </div>
            </div>
            <button className="text-sm text-soft-lavender-600 dark:text-soft-lavender-400 hover:text-soft-lavender-700 dark:hover:text-soft-lavender-300">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          syncStatus.includes('Error')
            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : syncStatus.includes('Syncing') || syncStatus.includes('Completing') || syncStatus.includes('Deleting')
            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        }`}>
          {syncStatus.includes('Syncing') || syncStatus.includes('Completing') || syncStatus.includes('Deleting') ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Stats */}
      {stats && <TaskStatsComponent stats={stats} />}

      {/* Quick Add */}
      <QuickAddTask onTaskAdded={handleTaskAdded} />

      {/* Filters */}
      <TaskFilters filter={filter} onFilterChange={setFilter} tasks={tasks} />

      {/* Bulk Actions */}
      {filteredTasks.length > 0 && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkComplete}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Complete All
              </button>
              <button
                onClick={handleSyncWithMotion}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Sync
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'timeline' ? (
        <TimeBlockingView tasks={tasks} onTaskSelect={handleEditTask} />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredTasks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {Object.keys(filter).some(key => filter[key as keyof TaskFilter])
                  ? 'Try adjusting your filters or create a new task'
                  : 'Get started by creating your first task'}
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-6 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-medium transition-colors"
              >
                Create Task
              </button>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdated}
                onDelete={handleTaskDeleted}
                onEdit={handleEditTask}
              />
            ))
          )}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </div>
  );
};

export default TasksPage;