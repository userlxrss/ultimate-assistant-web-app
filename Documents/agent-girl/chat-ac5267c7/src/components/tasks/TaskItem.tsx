import React, { useState } from 'react';
import { Check, X, Calendar, Flag, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Briefcase, Target, Code, Palette, Users, Zap, Star, Clock } from 'lucide-react';
import { Task } from '../../types/tasks';
import { motionAPI } from '../../utils/motionApi';
import { formatDueDate } from '../../utils/taskUtils';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showActions, setShowActions] = useState(false);

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          bgLight: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-900/50',
          text: 'text-red-600 dark:text-red-400',
          icon: <Zap className="w-3 h-3" />,
          label: 'Urgent'
        };
      case 'high':
        return {
          bgLight: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-900/50',
          text: 'text-orange-600 dark:text-orange-400',
          icon: <Flag className="w-3 h-3" />,
          label: 'High'
        };
      case 'medium':
        return {
          bgLight: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-900/50',
          text: 'text-blue-600 dark:text-blue-400',
          icon: <Target className="w-3 h-3" />,
          label: 'Medium'
        };
      case 'low':
        return {
          bgLight: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-900/50',
          text: 'text-green-600 dark:text-green-400',
          icon: <Star className="w-3 h-3" />,
          label: 'Low'
        };
      default:
        return {
          bgLight: 'bg-gray-50 dark:bg-gray-900/50',
          border: 'border-gray-200 dark:border-gray-700/50',
          text: 'text-gray-600 dark:text-gray-400',
          icon: <Flag className="w-3 h-3" />,
          label: 'Normal'
        };
    }
  };

  const getTaskTypeIcon = (category?: string | any) => {
    const categoryLower = (typeof category === 'string' ? category : String(category || '')).toLowerCase();

    if (categoryLower.includes('work') || categoryLower.includes('project') || categoryLower.includes('business')) {
      return <Briefcase className="w-4 h-4" />;
    } else if (categoryLower.includes('code') || categoryLower.includes('development') || categoryLower.includes('programming')) {
      return <Code className="w-4 h-4" />;
    } else if (categoryLower.includes('design') || categoryLower.includes('creative') || categoryLower.includes('art')) {
      return <Palette className="w-4 h-4" />;
    } else if (categoryLower.includes('team') || categoryLower.includes('meeting') || categoryLower.includes('collaboration')) {
      return <Users className="w-4 h-4" />;
    } else if (categoryLower.includes('personal') || categoryLower.includes('life')) {
      return <Star className="w-4 h-4" />;
    } else {
      return <Target className="w-4 h-4" />;
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  const handleToggleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    setSyncStatus('Syncing...');

    try {
      // Only sync with Motion if connected
      if (motionAPI.hasApiKey()) {
        const response = await motionAPI.completeTask(task.id);
        if (!response.success) {
          throw new Error(response.error || 'Failed to sync with Motion');
        }
        setSyncStatus('Synced with Motion!');
      } else {
        setSyncStatus('Updated locally');
      }

      const updatedTask = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined,
        status: (!task.completed ? 'completed' : 'pending') as Task['status']
      };
      onUpdate(updatedTask);
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCompleting(false);
      setTimeout(() => setSyncStatus(''), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setSyncStatus('Deleting...');
    try {
      // Only sync with Motion if connected
      if (motionAPI.hasApiKey()) {
        const response = await motionAPI.deleteTask(task.id);
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete from Motion');
        }
        setSyncStatus('Deleted from Motion!');
      } else {
        setSyncStatus('Deleted locally');
      }
      setTimeout(() => onDelete(task.id), 500);
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleEdit = () => {
    onEdit(task);
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className={`group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 mb-2 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80 border ${priorityConfig.border} ${
      task.completed ? 'opacity-60 scale-[0.98]' : ''
    }`}>
      {/* Compact Task Content */}
      <div className="flex items-center gap-2">
        {/* Compact Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isCompleting}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 hover:scale-105 ${
            task.completed
              ? `bg-gray-800 dark:bg-white border-gray-800 dark:border-white`
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
          } ${isCompleting ? 'animate-pulse' : ''}`}
        >
          {task.completed && <Check className="w-2.5 h-2.5 text-white dark:text-gray-800" />}
        </button>

        {/* Task Type Icon - Smaller */}
        <div className={`p-1 rounded ${priorityConfig.bgLight} transition-colors duration-150`}>
          <div className={`${priorityConfig.text} opacity-70`}>
            {getTaskTypeIcon(task.category)}
          </div>
        </div>

        {/* Task Title - More Compact */}
        <h3 className={`flex-1 text-sm font-medium text-gray-900 dark:text-white truncate ${
          task.completed ? 'line-through opacity-60' : ''
        }`}>
          {typeof task.title === 'string' ? task.title : String(task.title || 'Untitled Task')}
        </h3>

        {/* Compact Information Bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Due Date - Smaller */}
          {task.dueDate && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700/50">
              <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {formatDueDate(task.dueDate)}
              </span>
            </div>
          )}

          {/* Compact Priority Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${priorityConfig.bgLight} ${priorityConfig.text}`}>
            {priorityConfig.icon}
            <span className="text-xs font-medium">
              {priorityConfig.label}
            </span>
          </div>

          {/* Compact Progress */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700/50">
              <div className="w-12 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 dark:bg-gray-300 transition-all duration-300"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleEdit}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
              title="Edit task"
            >
              <Edit2 className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
              title="More actions"
            >
              <MoreVertical className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Sync Status */}
      {syncStatus && (
        <div className={`absolute -top-1 -right-1 px-2 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
          syncStatus.includes('Error')
            ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
            : syncStatus.includes('Syncing')
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
            : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
        }`}>
          <span className="text-xs">{syncStatus}</span>
        </div>
      )}

      {/* Compact Dropdown Actions */}
      {showActions && (
        <div className="absolute right-2 top-8 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-1">
          <button
            onClick={handleDelete}
            className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-150 flex items-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <button
            onClick={() => setShowActions(false)}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;