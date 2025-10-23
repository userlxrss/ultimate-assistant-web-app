import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Play, Pause, Settings } from 'lucide-react';
import { Task, TimeBlock } from '../../types/tasks';
import { generateTimeBlocks, formatDueDate } from '../../utils/taskUtils';
import { motionAPI } from '../../utils/motionApi';

interface TimeBlockingViewProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}

const TimeBlockingView: React.FC<TimeBlockingViewProps> = ({ tasks, onTaskSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    const blocks = generateTimeBlocks(tasks);
    setTimeBlocks(blocks);
  }, [tasks]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const optimizeSchedule = async () => {
    setIsOptimizing(true);
    setSyncStatus('Optimizing schedule...');

    try {
      const response = await motionAPI.optimizeTimeBlocks(tasks);
      if (response.success && response.data) {
        const optimizedBlocks = response.data.optimizedBlocks.map((block: any) => ({
          ...block,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime)
        }));
        setTimeBlocks(optimizedBlocks);
        setSyncStatus('Schedule optimized!');
      } else {
        throw new Error(response.error || 'Failed to optimize schedule');
      }
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getBlockColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300';
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300';
      case 'low': return 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-700 dark:text-gray-300';
    }
  };

  const isCurrentTime = (hour: number): boolean => {
    if (!isPlaying) return false;
    const currentHour = currentTime.getHours();
    return hour === currentHour;
  };

  const isTimeBlockActive = (block: TimeBlock): boolean => {
    if (!isPlaying) return false;
    const now = currentTime;
    return now >= block.startTime && now < block.endTime;
  };

  // Filter blocks for current date
  const todayBlocks = timeBlocks.filter(block => {
    const blockDate = new Date(block.startTime.getFullYear(), block.startTime.getMonth(), block.startTime.getDate());
    const currentDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    return blockDate.getTime() === currentDateObj.getTime();
  });

  const isToday = () => {
    const today = new Date();
    const current = currentDate;
    return today.getDate() === current.getDate() &&
           today.getMonth() === current.getMonth() &&
           today.getFullYear() === current.getFullYear();
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Time Blocking</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                isToday()
                  ? 'bg-sage-500 text-white'
                  : 'hover:bg-white/10 dark:hover:bg-white/5'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
              isPlaying
                ? 'bg-red-500 text-white'
                : 'glass-button hover:bg-white/30 dark:hover:bg-white/20'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={optimizeSchedule}
            disabled={isOptimizing}
            className="px-4 py-2 rounded-xl glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">{isOptimizing ? 'Optimizing...' : 'Optimize'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          syncStatus.includes('Error')
            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : syncStatus.includes('Optimizing')
            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        }`}>
          {syncStatus.includes('Optimizing') ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>✓</span>
          )}
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Time Grid */}
      <div className="relative">
        {/* Current Time Indicator */}
        {isPlaying && isToday() && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
            style={{
              top: `${((currentTime.getHours() - 6) / 12) * 100}%`
            }}
          >
            <div className="absolute -left-2 -top-1 w-4 h-4 bg-red-500 rounded-full" />
          </div>
        )}

        {/* Hours and Blocks */}
        <div className="space-y-0">
          {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => {
            const hourBlocks = todayBlocks.filter(block => {
              const blockStartHour = block.startTime.getHours();
              const blockEndHour = block.endTime.getHours();
              return blockStartHour <= hour && blockEndHour > hour;
            });

            return (
              <div
                key={hour}
                className={`flex border-b border-gray-200 dark:border-gray-700 ${
                  isCurrentTime(hour) ? 'bg-red-50/20 dark:bg-red-900/10' : ''
                }`}
                style={{ minHeight: '60px' }}
              >
                {/* Time Label */}
                <div className="w-20 p-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {formatHour(hour)}
                </div>

                {/* Time Blocks Container */}
                <div className="flex-1 relative p-2">
                  {hourBlocks.map(block => {
                    const task = tasks.find(t => t.id === block.taskId);
                    if (!task) return null;

                    const startOffset = Math.max(0, (block.startTime.getHours() - hour) * 60);
                    const duration = Math.min(60, (block.endTime.getHours() - block.startTime.getHours() + 1) * 60);

                    return (
                      <div
                        key={block.id}
                        className={`absolute left-0 right-2 rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                          getBlockColor(task.priority)
                        } ${isTimeBlockActive(block) ? 'ring-2 ring-red-500 animate-pulse' : ''} ${
                          block.title.length > 30 ? 'text-xs' : 'text-sm'
                        } hover:shadow-lg`}
                        style={{
                          top: `${startOffset}px`,
                          height: `${duration}px`,
                          border: '1px solid',
                          minHeight: '40px'
                        }}
                        onClick={() => onTaskSelect(task)}
                      >
                        <div className="font-medium truncate">{block.title}</div>
                        <div className="text-xs opacity-75">
                          {block.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {block.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {isTimeBlockActive(block) && (
                          <div className="text-xs font-medium mt-1">
                            ⏱️ Active now
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty slot indicator */}
                  {hourBlocks.length === 0 && (
                    <div className="h-full flex items-center">
                      <div className="text-xs text-gray-400 dark:text-gray-600 italic">
                        Free time
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/20 border border-red-500/50 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500/20 border border-orange-500/50 rounded" />
          <span className="text-gray-600 dark:text-gray-400">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/50 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Low</span>
        </div>
      </div>

      {/* Daily Reminder */}
      <div className="mt-6 p-4 rounded-lg bg-sage-100 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-sage-600 dark:text-sage-400" />
          <div>
            <div className="font-medium text-sage-700 dark:text-sage-300">
              Daily Reminder
            </div>
            <div className="text-sm text-sage-600 dark:text-sage-400">
              You receive task updates daily at 7:00 AM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeBlockingView;