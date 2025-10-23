import React, { useState } from 'react';
import { Check, X, Calendar, Flag, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Briefcase, Target, Code, Palette, Users, Zap, Star, Clock, Play, Pause, Timer, CheckCircle, Circle } from 'lucide-react';
import { Task } from '../../types/tasks';
import { motionAPI } from '../../utils/motionApi';
import { formatDueDate } from '../../utils/taskUtils';
import { useSafeTimer } from '../../hooks/useSafeTimer';
import { formatTimerDisplay } from '../../utils/timerUtils';
import { TaskTimer } from '../timers/TaskTimer';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onViewDetails: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete, onEdit, onToggleComplete, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showActions, setShowActions] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, getActiveTaskId } = useSafeTimer();

  const isTaskActive = timerState.taskId === task.id;
  const isActiveTask = getActiveTaskId() === task.id;
  const taskDuration = task.estimatedTime || task.duration;
  const estimatedDurationMs = taskDuration ? taskDuration * 60 * 1000 : 0;
  const remainingTimeMs = estimatedDurationMs - timerState.elapsedTime;
  const isOvertime = timerState.hasReachedZero || remainingTimeMs < 0;

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

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return {
          bgLight: 'bg-green-50 dark:bg-green-950/30',
          text: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Completed'
        };
      case 'in-progress':
        return {
          bgLight: 'bg-blue-50 dark:bg-blue-950/30',
          text: 'text-blue-600 dark:text-blue-400',
          icon: <Clock className="w-3 h-3" />,
          label: 'In Progress'
        };
      case 'cancelled':
        return {
          bgLight: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-600 dark:text-red-400',
          icon: <X className="w-3 h-3" />,
          label: 'Cancelled'
        };
      case 'pending':
      default:
        return {
          bgLight: 'bg-gray-50 dark:bg-gray-950/30',
          text: 'text-gray-600 dark:text-gray-400',
          icon: <Circle className="w-3 h-3" />,
          label: 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);

  const handleToggleComplete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isCompleting) return;

    setIsCompleting(true);
    setSyncStatus('Syncing...');

    try {
      const updatedTask = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined,
        status: (!task.completed ? 'completed' : 'pending') as Task['status']
      };

      onToggleComplete(updatedTask);
      onUpdate(updatedTask);

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
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCompleting(false);
      setTimeout(() => setSyncStatus(''), 2000);
    }
  };

  const handleStatusChange = async (newStatus: Task['status'], e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdatingStatus || newStatus === task.status) return;

    setIsUpdatingStatus(true);
    setSyncStatus('Updating status...');

    try {
      const updatedTask = {
        ...task,
        status: newStatus,
        completed: newStatus === 'completed',
        completedAt: newStatus === 'completed' ? new Date() : undefined
      };

      onUpdate(updatedTask);

      // Only sync with Motion if connected
      if (motionAPI.hasApiKey()) {
        const response = await motionAPI.updateTask(task.id, { status: newStatus });
        if (!response.success) {
          throw new Error(response.error || 'Failed to sync status with Motion');
        }
        setSyncStatus('Status synced with Motion!');
      } else {
        setSyncStatus('Status updated locally');
      }
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
      setTimeout(() => setSyncStatus(''), 2000);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onViewDetails(task);
  };

  const handleTimerControl = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!task.estimatedTime && !task.duration) {
      // If no duration set, open edit modal
      onEdit(task);
      return;
    }

    if (!isTaskActive) {
      // Start timer for this task
      startTimer(task);

      // If another task is active, this will automatically switch
      if (task.status !== 'in-progress') {
        const updatedTask = { ...task, status: 'in-progress' as const };
        onUpdate(updatedTask);
      }
    } else if (timerState.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const getTimerDisplay = () => {
    const displayDuration = task.estimatedTime || task.duration;

    if (!displayDuration) {
      return {
        text: '⚠️ Set duration',
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700'
      };
    }

    if (!isTaskActive) {
      return {
        text: `⏱️ ${displayDuration}m`,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700'
      };
    }

    if (timerState.isPaused) {
      const displayTime = formatTimerDisplay(estimatedDurationMs - timerState.elapsedTime);
      return {
        text: `⏸️ PAUSED ${displayTime}`,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30'
      };
    }

    if (isOvertime) {
      const overtimeDisplay = formatTimerDisplay(timerState.overtimeTime, true);
      return {
        text: `⏱️ ${overtimeDisplay}`,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30'
      };
    }

    const remainingDisplay = formatTimerDisplay(remainingTimeMs);
    return {
      text: `⏱️ ${remainingDisplay}`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    };
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
    <div
      onClick={handleCardClick}
      className={`group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 mb-2 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80 border ${priorityConfig.border} cursor-pointer ${
        task.completed ? 'opacity-60 scale-[0.98]' : ''
      }`}
    >
      {/* Compact Task Content */}
      <div className="flex items-start gap-2">
        {/* Compact Checkbox */}
        <button
          onClick={(e) => handleToggleComplete(e)}
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
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium text-gray-900 dark:text-white truncate ${
            task.completed ? 'line-through opacity-60' : ''
          }`}>
            {typeof task.title === 'string' ? task.title : String(task.title || 'Untitled Task')}
          </h3>

          {/* Timer Display */}
          <div className="mt-1">
            <button
              onClick={handleTimerControl}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${getTimerDisplay().bgColor} ${getTimerDisplay().color} hover:opacity-80`}
            >
              {isTaskActive ? (
                timerState.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />
              ) : (
                <Timer className="w-3 h-3" />
              )}
              <span className="font-mono">
                {getTimerDisplay().text}
              </span>
              {isTaskActive && !timerState.isPaused && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Compact Information Bar */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Due Date - Smaller */}
          {task.dueDate && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700/50">
              <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {formatDueDate(task.dueDate)}
              </span>
            </div>
          )}

          {/* Priority and Progress Row */}
          <div className="flex items-center gap-1">
            {/* Compact Priority Badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${priorityConfig.bgLight} ${priorityConfig.text}`}>
              {priorityConfig.icon}
              <span className="text-xs font-medium">
                {priorityConfig.label}
              </span>
            </div>

            {/* Status Badge */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${statusConfig.bgLight} ${statusConfig.text}`}
              title="Task status"
            >
              {statusConfig.icon}
              <span className="font-medium">
                {statusConfig.label}
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

            {/* Task Timer */}
            <TaskTimer task={task} />
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
              title="Edit task"
            >
              <Edit2 className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
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