import React, { useState } from 'react';
import { X, Calendar, Flag, Clock, Users, Target, Briefcase, Code, Palette, Star, Zap, CheckCircle, Circle, AlertCircle, FileText, Timer, Link2, Repeat, RefreshCw } from 'lucide-react';
import { Task } from '../../types/tasks';
import { formatDueDate } from '../../utils/taskUtils';
import { safeRender } from '../../utils/safeRender';
import { motionAPI } from '../../utils/motionApi';
import { useSafeTimer } from '../../hooks/useSafeTimer';
import HtmlRenderer from './HtmlRenderer';

// Helper function to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (task: Task) => void;
  onUpdate: (task: Task) => void;
}


const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onUpdate
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { startTimer, pauseTimer, resumeTimer, stopTimer, timerState } = useSafeTimer();

  if (!isOpen || !task) return null;

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          bgLight: 'bg-red-50 dark:bg-red-950/30',
          bgDark: 'bg-red-500',
          text: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-900/50',
          icon: <Zap className="w-4 h-4" />,
          label: 'Urgent'
        };
      case 'high':
        return {
          bgLight: 'bg-orange-50 dark:bg-orange-950/30',
          bgDark: 'bg-orange-500',
          text: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-900/50',
          icon: <Flag className="w-4 h-4" />,
          label: 'High'
        };
      case 'medium':
        return {
          bgLight: 'bg-blue-50 dark:bg-blue-950/30',
          bgDark: 'bg-blue-500',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-900/50',
          icon: <Target className="w-4 h-4" />,
          label: 'Medium'
        };
      case 'low':
        return {
          bgLight: 'bg-green-50 dark:bg-green-950/30',
          bgDark: 'bg-green-500',
          text: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-900/50',
          icon: <Star className="w-4 h-4" />,
          label: 'Low'
        };
      default:
        return {
          bgLight: 'bg-gray-50 dark:bg-gray-900/50',
          bgDark: 'bg-gray-500',
          text: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700/50',
          icon: <Flag className="w-4 h-4" />,
          label: 'Normal'
        };
    }
  };

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return {
          bgLight: 'bg-green-50 dark:bg-green-950/30',
          text: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-900/50',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completed'
        };
      case 'in-progress':
        return {
          bgLight: 'bg-blue-50 dark:bg-blue-950/30',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-900/50',
          icon: <Timer className="w-4 h-4" />,
          label: 'In Progress'
        };
      case 'cancelled':
        return {
          bgLight: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-900/50',
          icon: <X className="w-4 h-4" />,
          label: 'Cancelled'
        };
      default:
        return {
          bgLight: 'bg-gray-50 dark:bg-gray-900/50',
          text: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700/50',
          icon: <Circle className="w-4 h-4" />,
          label: 'Pending'
        };
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (isUpdatingStatus || newStatus === task.status) return;

    setIsUpdatingStatus(true);
    setStatusMessage('Updating status...');

    try {
      const updatedTask = {
        ...task,
        status: newStatus,
        completed: newStatus === 'completed',
        completedAt: newStatus === 'completed' ? new Date() : undefined
      };

      // Update the task locally immediately for instant UI feedback
      onUpdate(updatedTask);

      // Auto-start timer when status changes to "In Progress"
      if (newStatus === 'in-progress' && task.duration && task.duration > 0) {
        startTimer(updatedTask);
        setStatusMessage('Timer started!');
      } else if (newStatus !== 'in-progress' && timerState.taskId === task.id) {
        // Stop timer if status changes away from "In Progress" for this task
        stopTimer();
      }

      // Only sync with Motion if connected
      if (motionAPI.isAuthenticated()) {
        const response = await motionAPI.updateTask(task.id, { status: newStatus });
        if (!response.success) {
          throw new Error(response.error || 'Failed to sync status with Motion');
        }
        if (newStatus === 'in-progress') {
          setStatusMessage('Status synced and timer started!');
        } else {
          setStatusMessage('Status synced with Motion!');
        }
      } else {
        if (newStatus === 'in-progress') {
          setStatusMessage('Timer started locally!');
        } else {
          setStatusMessage('Status updated locally');
        }
      }

      // Clear the message after 2 seconds
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getTaskTypeIcon = (category?: string | any) => {
    const categoryLower = (typeof category === 'string' ? category : String(category || '')).toLowerCase();

    if (categoryLower.includes('work') || categoryLower.includes('project') || categoryLower.includes('business')) {
      return <Briefcase className="w-5 h-5" />;
    } else if (categoryLower.includes('code') || categoryLower.includes('development') || categoryLower.includes('programming')) {
      return <Code className="w-5 h-5" />;
    } else if (categoryLower.includes('design') || categoryLower.includes('creative') || categoryLower.includes('art')) {
      return <Palette className="w-5 h-5" />;
    } else if (categoryLower.includes('team') || categoryLower.includes('meeting') || categoryLower.includes('collaboration')) {
      return <Users className="w-5 h-5" />;
    } else if (categoryLower.includes('personal') || categoryLower.includes('life')) {
      return <Star className="w-5 h-5" />;
    } else {
      return <Target className="w-5 h-5" />;
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  const getRecurrenceText = (recurrence?: Task['recurrence']) => {
    switch (recurrence) {
      case 'daily': return 'Repeats daily';
      case 'weekly': return 'Repeats weekly';
      case 'monthly': return 'Repeats monthly';
      default: return 'No recurrence';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${priorityConfig.bgLight} ${priorityConfig.text}`}>
              {getTaskTypeIcon(task.category)}
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${
                task.completed ? 'line-through opacity-60' : ''
              }`}>
                {safeRender(task.title, 'Untitled Task')}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${priorityConfig.bgLight} ${priorityConfig.text}`}>
                  {priorityConfig.icon}
                  {priorityConfig.label}
                </span>
                <div className="relative">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                    disabled={isUpdatingStatus}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      isUpdatingStatus
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                        : `${statusConfig.bgLight} ${statusConfig.text} border-transparent hover:opacity-80`
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {isUpdatingStatus && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <RefreshCw className="w-3 h-3 animate-spin text-gray-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Created {formatDate(task.createdAt)}
                </span>
                {statusMessage && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    statusMessage.includes('Error')
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                      : statusMessage.includes('Syncing') || statusMessage.includes('Updating')
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                  }`}>
                    {statusMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Description */}
          {task.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <HtmlRenderer
                  html={task.description}
                  className="text-sm text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
          )}

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Due Date */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </h3>
              {task.dueDate ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(task.dueDate)}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No due date set
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Category
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {safeRender(task.category, 'Uncategorized')}
              </div>
            </div>

            {/* Duration */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Duration
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>Estimated: {formatDuration(task.estimatedTime)}</div>
                {task.actualTime && (
                  <div>Actual: {formatDuration(task.actualTime)}</div>
                )}
              </div>
            </div>

            {/* Workspace */}
            {task.workspace && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Workspace
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {safeRender(task.workspace)}
                </div>
              </div>
            )}

            {/* Assignee */}
            {task.assignee && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assignee
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {safeRender(task.assignee)}
                </div>
              </div>
            )}

            {/* Recurrence */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Recurrence
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {getRecurrenceText(task.recurrence)}
              </div>
            </div>

            {/* Reminder */}
            {task.reminder && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Reminder
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(task.reminder)}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    #{safeRender(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                {safeRender(task.description)}
              </div>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                {safeRender(task.notes)}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Subtasks ({completedSubtasks}/{totalSubtasks} completed)
              </h3>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      subtask.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {subtask.completed && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-sm ${
                      subtask.completed
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {safeRender(subtask.title, 'Untitled Subtask')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {totalSubtasks > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Progress</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round((completedSubtasks / totalSubtasks) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sage-500 to-sage-600 transition-all duration-300"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion Info */}
          {task.completed && task.completedAt && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Completion
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Completed on {formatDate(task.completedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleComplete(task)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                task.completed
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(task);
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-sage-500 hover:bg-sage-600 text-white transition-colors"
            >
              Edit Task
            </button>
            <button
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;