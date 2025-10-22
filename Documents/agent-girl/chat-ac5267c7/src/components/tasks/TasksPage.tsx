import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, List, Grid, RotateCcw } from 'lucide-react';
import { Task, TaskFilter } from '../../types/tasks';
import { filterTasks } from '../../utils/taskUtils';
import { generateTasks } from '../../utils/dataGenerator';
import { motionAPI } from '../../utils/motionApi';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import TaskFilters from './TaskFilters';

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

  // Load initial tasks and sync with Motion if connected
  useEffect(() => {
    const loadTasks = async () => {
      if (motionAPI.hasApiKey()) {
        // Try to load tasks from Motion first
        try {
          const motionTasks = await motionAPI.getTasks();
          if (motionTasks.success && motionTasks.data?.tasks) {
            setTasks(motionTasks.data.tasks);
            return;
          }
        } catch (error) {
          console.warn('Failed to load tasks from Motion, using demo data:', error);
        }
      }
      // Fallback to demo tasks
      const initialTasks = generateTasks(30);
      setTasks(initialTasks);
    };

    loadTasks();
  }, []);

  // Update filtered tasks when tasks or filter change
  useEffect(() => {
    const filtered = filterTasks(tasks, filter);
    const sorted = sortTasks(filtered, sortBy);
    setFilteredTasks(sorted);
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

  const activeTasksCount = tasks.filter(task => !task.completed).length;

  return (
    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
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
              {activeTasksCount} active
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
            No tasks found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {Object.keys(filter).some(key => filter[key as keyof TaskFilter])
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
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
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
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
    </div>
  );
};

export default TasksPage;