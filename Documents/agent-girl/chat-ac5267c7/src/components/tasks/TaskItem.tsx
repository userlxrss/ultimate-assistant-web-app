import React, { useState } from 'react';
import { Check, X, Calendar, Clock, Flag, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Task } from '../../types/tasks';
import { motionAPI } from '../../utils/motionApi';
import { formatDueDate, getPriorityColor } from '../../utils/taskUtils';

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

  const handleToggleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    setSyncStatus('Syncing...');

    try {
      const response = await motionAPI.completeTask(task.id);
      if (response.success) {
        const updatedTask = {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined,
          status: (!task.completed ? 'completed' : 'pending') as Task['status']
        };
        setSyncStatus('Synced!');
        onUpdate(updatedTask);
      } else {
        throw new Error(response.error || 'Failed to update task');
      }
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
      const response = await motionAPI.deleteTask(task.id);
      if (response.success) {
        setSyncStatus('Deleted!');
        setTimeout(() => onDelete(task.id), 500);
      } else {
        throw new Error(response.error || 'Failed to delete task');
      }
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className={`glass-card p-4 mb-3 transition-all duration-300 ${
      task.completed ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isCompleting}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-sage-500 border-sage-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-sage-500'
          } ${isCompleting ? 'animate-pulse' : ''}`}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className={`font-medium text-gray-900 dark:text-white mb-1 ${
                task.completed ? 'line-through' : ''
              }`}>
                {task.title}
              </h3>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDueDate(task.dueDate)}</span>
                  </div>
                )}

                {/* Duration */}
                {task.duration && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{task.duration}m</span>
                  </div>
                )}

                {/* Priority */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  <Flag className="inline w-3 h-3 mr-1" />
                  {task.priority}
                </div>

                {/* Category */}
                <div className="px-2 py-1 rounded-full bg-dusty-blue-100 dark:bg-dusty-blue-900/30 text-dusty-blue-700 dark:text-dusty-blue-300 text-xs">
                  {task.category}
                </div>

                {/* Workspace */}
                {task.workspace && (
                  <div className="px-2 py-1 rounded-full bg-soft-lavender-100 dark:bg-soft-lavender-900/30 text-soft-lavender-700 dark:text-soft-lavender-300 text-xs">
                    {task.workspace}
                  </div>
                )}

                {/* Subtasks Progress */}
                {totalSubtasks > 0 && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                    <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage-500 transition-all duration-300"
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sync Status */}
                <div className="flex items-center gap-1">
                  {task.syncStatus === 'synced' ? (
                    <RefreshCw className="w-3 h-3 text-green-500" />
                  ) : task.syncStatus === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  ) : (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-white/20 dark:bg-white/10 text-xs text-gray-600 dark:text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Expand/Collapse for Subtasks */}
          {totalSubtasks > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-3 text-xs text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? 'Hide' : 'Show'} subtasks
            </button>
          )}

          {/* Subtasks List */}
          {isExpanded && totalSubtasks > 0 && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    className="rounded border-gray-300 text-sage-500 focus:ring-sage-500"
                    readOnly
                  />
                  <span className={subtask.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sync Status Message */}
          {syncStatus && (
            <div className={`mt-3 text-xs p-2 rounded-lg flex items-center gap-1 ${
              syncStatus.includes('Error')
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : syncStatus.includes('Syncing')
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}>
              {syncStatus.includes('Error') && <AlertCircle className="w-3 h-3" />}
              {syncStatus.includes('Syncing') && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {syncStatus.includes('Synced!') && <Check className="w-3 h-3" />}
              {syncStatus.includes('Deleted!') && <Trash2 className="w-3 h-3" />}
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Actions */}
      {showActions && (
        <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg z-10">
          <div className="p-1">
            <button
              onClick={() => {
                onEdit(task);
                setShowActions(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 rounded transition-colors"
            >
              <Edit2 className="inline w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <Trash2 className="inline w-4 h-4 mr-2" />
              Delete
            </button>
            <button
              onClick={() => setShowActions(false)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;