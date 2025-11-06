import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, Folder, Tag, User, AlertCircle, Timer } from 'lucide-react';
import { Task, Subtask } from '../../types/tasks';
import { motionAPI } from '../../utils/motionApi';
import { getDefaultDurations } from '../../utils/timerUtils';
import { safeRender } from '../../utils/safeRender';

interface TaskFormProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, isOpen, onClose, onSave }) => {
  // Function to sanitize task data for form usage
  const sanitizeTaskForForm = (taskData: Task): Partial<Task> => {
    return {
      ...taskData,
      title: safeRender(taskData.title, ''),
      description: safeRender(taskData.description, ''),
      category: safeRender(taskData.category, 'Work'),
      workspace: safeRender(taskData.workspace, ''),
      assignee: safeRender(taskData.assignee, ''),
      tags: Array.isArray(taskData.tags)
        ? taskData.tags.map(tag => safeRender(tag))
        : [],
      subtasks: Array.isArray(taskData.subtasks)
        ? taskData.subtasks.map(subtask => ({
            ...subtask,
            title: safeRender(subtask.title, 'Untitled Subtask')
          }))
        : []
    };
  };

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: undefined,
    priority: 'medium',
    status: 'pending',
    category: 'Work',
    workspace: '',
    duration: 60,
    estimatedTime: 60,
    tags: [],
    subtasks: []
  });
  const [subtaskInput, setSubtaskInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [customDuration, setCustomDuration] = useState('');

  const categories = ['Work', 'Personal', 'Health', 'Learning', 'Finance', 'Shopping', 'Home', 'Creative', 'Social', 'Admin'];
  const workspaces = ['Office', 'Home Office', 'Remote', 'Client Site', 'On the Go'];
  const defaultDurations = getDefaultDurations();

  useEffect(() => {
    if (task) {
      setFormData(sanitizeTaskForForm(task));
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: undefined,
        priority: 'medium',
        status: 'pending',
        category: 'Work',
        workspace: '',
        duration: 60,
        estimatedTime: 60,
        tags: [],
        subtasks: []
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    setIsSubmitting(true);
    setSyncStatus('Syncing with Motion...');

    try {
      const taskData = {
        ...formData,
        // Ensure both duration and estimatedTime are set and synchronized
        duration: formData.estimatedTime || formData.duration || 60,
        estimatedTime: formData.estimatedTime || formData.duration || 60,
        subtasks: formData.subtasks || []
      };

      let savedTask: Task;

      if (task?.id) {
        // Update existing task
        const response = await motionAPI.updateTask(task.id, taskData);
        if (response.success) {
          savedTask = { ...task, ...taskData };
          setSyncStatus('Task updated successfully!');
        } else {
          throw new Error(response.error || 'Failed to update task');
        }
      } else {
        // Create new task
        const response = await motionAPI.createTask(taskData);
        if (response.success && response.data) {
          savedTask = response.data as Task;
          setSyncStatus('Task created successfully!');
        } else {
          throw new Error(response.error || 'Failed to create task');
        }
      }

      onSave(savedTask);
      setTimeout(() => {
        onClose();
        setSyncStatus('');
      }, 1000);
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: subtaskInput.trim(),
        completed: false,
        createdAt: new Date()
      };
      setFormData(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask]
      }));
      setSubtaskInput('');
    }
  };

  const removeSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter(st => st.id !== subtaskId) || []
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
              rows={3}
              placeholder="Add task description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Due Date
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dueDate: e.target.value ? new Date(e.target.value) : undefined
                }))}
                className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="inline w-4 h-4 mr-1" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  priority: e.target.value as Task['priority']
                }))}
                className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Folder className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                {categories.map(cat => (
                  <option key={typeof cat === 'string' ? cat : cat.id || JSON.stringify(cat)} value={typeof cat === 'string' ? cat : cat.id || JSON.stringify(cat)}>{safeRender(cat)}</option>
                ))}
              </select>
            </div>

            {/* Workspace */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Workspace
              </label>
              <select
                value={formData.workspace || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, workspace: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="">Select workspace</option>
                {workspaces.map(ws => (
                  <option key={typeof ws === 'string' ? ws : ws.id || JSON.stringify(ws)} value={typeof ws === 'string' ? ws : ws.id || JSON.stringify(ws)}>{safeRender(ws)}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
                min="15"
                max="480"
                step="15"
              />
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Timer className="inline w-4 h-4 mr-1" />
                Estimated Duration *
              </label>
              <select
                value={formData.estimatedTime || 30}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value === -1) {
                    // Custom duration - show input
                    setFormData(prev => ({ ...prev, estimatedTime: undefined }));
                    setCustomDuration('30');
                  } else {
                    setFormData(prev => ({ ...prev, estimatedTime: value }));
                    setCustomDuration('');
                  }
                }}
                className="w-full px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              >
                <option value="">Select duration...</option>
                {defaultDurations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>

              {/* Custom duration input */}
              {!formData.estimatedTime && customDuration && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    onBlur={() => {
                      const minutes = parseInt(customDuration) || 30;
                      setFormData(prev => ({ ...prev, estimatedTime: Math.min(Math.max(minutes, 5), 480) }));
                    }}
                    className="flex-1 px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
                    min="5"
                    max="480"
                    placeholder="Enter minutes"
                  />
                  <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    minutes
                  </span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Required for timer functionality
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="inline w-4 h-4 mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
                placeholder="Add tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 rounded-xl glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-sage-900 dark:hover:text-sage-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subtasks
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="flex-1 px-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
                placeholder="Add subtask..."
              />
              <button
                type="button"
                onClick={addSubtask}
                className="px-4 py-2 rounded-xl glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.subtasks?.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/10 dark:bg-white/5">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        subtasks: prev.subtasks?.map(st =>
                          st.id === subtask.id ? { ...st, completed: e.target.checked } : st
                        ) || []
                      }));
                    }}
                    className="rounded border-gray-300 text-sage-500 focus:ring-sage-500"
                  />
                  <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                    {safeRender(subtask.title, 'Untitled Subtask')}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(subtask.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              syncStatus.includes('Error')
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{syncStatus}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title?.trim()}
              className="px-6 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;