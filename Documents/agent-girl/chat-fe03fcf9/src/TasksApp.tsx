import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Plus, Calendar, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: 'completed' | 'in-progress' | 'pending';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  labels?: string[];
  estimatedDuration?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

const TasksApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'medium' as const });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = useCallback(async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Check if Motion API key exists
      const motionApiKey = localStorage.getItem('motion_api_key');
      if (!motionApiKey) {
        console.log('Motion API key not found, using dummy data');
        // Use dummy data if no API key
        setTasks(getDummyTasks());
        return;
      }

      // Try to fetch from Motion API
      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${motionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If API fails, fallback to dummy data
        console.log('Motion API not available, using dummy data');
        setTasks(getDummyTasks());
        return;
      }

      const data: TasksResponse = await response.json();
      setTasks(data.tasks || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      console.log('Error fetching tasks:', errorMessage);

      // Always fallback to dummy data on error
      setTasks(getDummyTasks());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const motionApiKey = localStorage.getItem('motion_api_key');
      if (!motionApiKey) {
        // Just update local state if no API key
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString()
              }
            : task
        ));
        return;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${motionApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // Just update local state if API fails
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString()
              }
            : task
        ));
        return;
      }

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString()
            }
          : task
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      console.error('Error updating task:', errorMessage);

      // Still update local state even on error
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString()
            }
          : task
      ));
    }
  };

  const handleAddTask = async () => {
    if (!newTask.name.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const motionApiKey = localStorage.getItem('motion_api_key');

      const newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newTask.name.trim(),
        description: newTask.description.trim() || undefined,
        priority: newTask.priority,
        status: 'pending',
        labels: [],
        phones: [],
        emails: []
      };

      if (motionApiKey) {
        // Try to create via API
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${motionApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newTaskData)
        });

        if (response.ok) {
          const createdTask: Task = await response.json();
          setTasks(prev => [createdTask, ...prev]);
        } else {
          // Create locally if API fails
          const localTask: Task = {
            ...newTaskData,
            id: `local_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setTasks(prev => [localTask, ...prev]);
        }
      } else {
        // Create locally if no API key
        const localTask: Task = {
          ...newTaskData,
          id: `local_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTasks(prev => [localTask, ...prev]);
      }

      // Reset form
      setNewTask({ name: '', description: '', priority: 'medium' });
      setShowAddForm(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDummyTasks = (): Task[] => [
    {
      id: '1',
      name: 'Review project documentation',
      description: 'Go through the project docs and update requirements',
      status: 'completed',
      priority: 'medium',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      completedAt: '2024-01-15T14:30:00Z',
      labels: [],
      phones: [],
      emails: []
    },
    {
      id: '2',
      name: 'Fix WebSocket connection issues',
      description: 'Resolve connection problems in the real-time sync',
      status: 'completed',
      priority: 'high',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T16:45:00Z',
      completedAt: '2024-01-15T16:45:00Z',
      labels: [],
      phones: [],
      emails: []
    },
    {
      id: '3',
      name: 'Update dashboard components',
      description: 'Refresh the UI components with new design system',
      status: 'completed',
      priority: 'medium',
      createdAt: '2024-01-14T15:00:00Z',
      updatedAt: '2024-01-15T11:20:00Z',
      completedAt: '2024-01-15T11:20:00Z',
      labels: [],
      phones: [],
      emails: []
    },
    {
      id: '4',
      name: 'Deploy analytics dashboard',
      description: 'Deploy the updated dashboard to production',
      status: 'in-progress',
      priority: 'high',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T17:00:00Z',
      dueDate: '2024-01-16T18:00:00Z',
      labels: [],
      phones: [],
      emails: []
    },
    {
      id: '5',
      name: 'Test all functionality',
      description: 'Comprehensive testing of all features',
      status: 'pending',
      priority: 'medium',
      createdAt: '2024-01-15T07:30:00Z',
      updatedAt: '2024-01-15T07:30:00Z',
      labels: [],
      phones: [],
      emails: []
    }
  ];

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const tasksStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your tasks and projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTasks(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasksStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{tasksStats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{tasksStats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{tasksStats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['all', 'pending', 'in-progress', 'completed'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              filter === filterType
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {filterType === 'all' && 'All Tasks'}
            {filterType === 'pending' && 'Pending'}
            {filterType === 'in-progress' && 'In Progress'}
            {filterType === 'completed' && 'Completed'}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Task</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Name
              </label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter task name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                disabled={isSubmitting || !newTask.name.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Task
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTask({ name: '', description: '', priority: 'medium' });
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filter === 'all'
              ? 'Create your first task to get started'
              : `No tasks matching the ${filter} filter`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="glass-card rounded-lg p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => {
                    const newStatus = task.status === 'completed' ? 'pending' :
                                    task.status === 'pending' ? 'in-progress' : 'completed';
                    handleTaskStatusChange(task.id, newStatus);
                  }}
                  className="mt-1 flex-shrink-0"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-medium text-gray-900 dark:text-white ${
                        task.status === 'completed' ? 'line-through opacity-60' : ''
                      }`}>
                        {task.name}
                      </h4>
                      {task.description && (
                        <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${
                          task.status === 'completed' ? 'line-through opacity-60' : ''
                        }`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Created {formatDate(task.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksApp;