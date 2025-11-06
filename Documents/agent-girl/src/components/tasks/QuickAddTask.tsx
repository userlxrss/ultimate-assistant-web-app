import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Flag, Clock, Hash } from 'lucide-react';
import { Task, Subtask } from '../../types/tasks';
import { motionAPI } from '../../utils/motionApi';
import { generateTasks } from '../../utils/dataGenerator';

interface QuickAddTaskProps {
  onTaskAdded: (task: Task) => void;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onTaskAdded }) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['Work', 'Personal', 'Health', 'Learning', 'Finance', 'Shopping', 'Home', 'Creative', 'Social', 'Admin'];

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const parseTaskInput = (input: string): Partial<Task> => {
    const task: Partial<Task> = {
      title: input,
      priority: 'medium',
      category: 'Work',
      tags: []
    };

    // Parse priority (#urgent, #high, #medium, #low)
    const priorityMatch = input.match(/#(urgent|high|medium|low)/i);
    if (priorityMatch) {
      task.priority = priorityMatch[1].toLowerCase() as Task['priority'];
      task.title = input.replace(/#(urgent|high|medium|low)/i, '').trim();
    }

    // Parse category (@category)
    const categoryMatch = input.match(/@(\w+)/);
    if (categoryMatch) {
      const category = categoryMatch[1];
      if (categories.some(cat => cat.toLowerCase() === category.toLowerCase())) {
        task.category = categories.find(cat => cat.toLowerCase() === category.toLowerCase()) || 'Work';
        task.title = input.replace(/@\w+/, '').trim();
      }
    }

    // Parse due date (today, tomorrow, next week, etc.)
    const dueDateMatch = input.match(/(today|tomorrow|next week|next month)/i);
    if (dueDateMatch) {
      const now = new Date();
      const match = dueDateMatch[1].toLowerCase();

      if (match === 'today') {
        task.dueDate = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 AM tomorrow
      } else if (match === 'tomorrow') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        task.dueDate = tomorrow;
      } else if (match === 'next week') {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        task.dueDate = nextWeek;
      } else if (match === 'next month') {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        task.dueDate = nextMonth;
      }

      task.title = input.replace(/(today|tomorrow|next week|next month)/i, '').trim();
    }

    // Parse duration (1h, 30m, etc.)
    const durationMatch = input.match(/(\d+)\s*([hm])/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      task.duration = unit === 'h' ? value * 60 : value;
      task.title = input.replace(/\d+\s*[hm]/i, '').trim();
    }

    // Parse tags (#tag)
    const tagMatches = input.match(/#(\w+)/g);
    if (tagMatches) {
      task.tags = tagMatches.map(tag => tag.substring(1));
      task.title = input.replace(/#\w+/g, '').trim();
    }

    return task;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSyncStatus('Creating task...');

    try {
      const taskData = parseTaskInput(input);

      const response = await motionAPI.createTask(taskData);
      if (response.success && response.data) {
        const newTask = response.data as Task;
        setSyncStatus('Task created successfully!');
        onTaskAdded(newTask);
        setInput('');
        setIsExpanded(false);
      } else {
        throw new Error(response.error || 'Failed to create task');
      }
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
  };

  const handleInputBlur = () => {
    // Don't collapse immediately to allow button clicks
    setTimeout(() => {
      if (!input.trim()) {
        setIsExpanded(false);
      }
    }, 200);
  };

  const addDemoTasks = async () => {
    setIsSubmitting(true);
    setSyncStatus('Generating demo tasks...');

    try {
      // Generate a few demo tasks
      const demoTasks = generateTasks(7).slice(0, 5);

      for (const task of demoTasks) {
        const response = await motionAPI.createTask(task);
        if (response.success && response.data) {
          onTaskAdded(response.data as Task);
        }
      }

      setSyncStatus('Demo tasks added successfully!');
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-3">
          <Plus className="w-5 h-5 text-sage-500 flex-shrink-0" />
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Quick add task... (e.g., 'Review proposal #high @work today 2h')"
              className="w-full px-4 py-3 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>

        {/* Expanded Input Options */}
        {isExpanded && (
          <div className="animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Priority:</strong> #urgent, #high, #medium, #low
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Category:</strong> @work, @personal, @health, etc.
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Due:</strong> today, tomorrow, next week
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Duration:</strong> 1h, 30m, 2h
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Quick examples:</span>
              {[
                'Meeting with client #high @work today 1h',
                'Review documentation #medium @work tomorrow 30m',
                'Gym session #low @health today 1h',
                'Project proposal #urgent @work this week 2h'
              ].map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(example)}
                  className="px-2 py-1 text-xs rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            syncStatus.includes('Error')
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : syncStatus.includes('Creating') || syncStatus.includes('Generating')
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          }`}>
            {syncStatus.includes('Creating') || syncStatus.includes('Generating') ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>✓</span>
            )}
            <span>{syncStatus}</span>
          </div>
        )}
      </form>

      {/* Demo Tasks Button */}
      {!isExpanded && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={addDemoTasks}
            disabled={isSubmitting}
            className="text-xs text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add demo tasks
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Press Enter to add task • Use # @ for quick formatting
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAddTask;