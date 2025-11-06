import React from 'react';
import { CheckCircle, Clock, AlertTriangle, Calendar, TrendingUp, Target, Activity } from 'lucide-react';
import type { TaskStats as TaskStatsType } from '../../types/tasks';

interface TaskStatsProps {
  stats: TaskStatsType;
}

const TaskStatsComponent: React.FC<TaskStatsProps> = ({ stats }) => {
  const completionRateColor = stats.completionRate >= 80 ? 'text-green-600 dark:text-green-400' :
                              stats.completionRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Tasks */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tasks</h3>
          <Target className="w-5 h-5 text-sage-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {stats.completed} completed
        </div>
      </div>

      {/* Overdue Tasks */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Overdue</h3>
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Need immediate attention
        </div>
      </div>

      {/* Due Today */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Due Today</h3>
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.dueToday}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Today's tasks
        </div>
      </div>

      {/* Completion Rate */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Completion Rate</h3>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className={`text-2xl font-bold ${completionRateColor}`}>
          {Math.round(stats.completionRate)}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Average completion
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="glass-card p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Priority Breakdown</h3>
          <Activity className="w-5 h-5 text-purple-500" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.byPriority.urgent}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{stats.byPriority.high}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{stats.byPriority.medium}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.byPriority.low}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Low</div>
          </div>
        </div>
      </div>

      {/* Time Tracking */}
      <div className="glass-card p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Time Tracking</h3>
          <Clock className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.totalEstimatedTime.toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Estimated</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.totalActualTime.toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Actual</div>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Avg. completion time: {stats.averageCompletionTime.toFixed(1)} hours
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${stats.totalEstimatedTime > 0
                  ? Math.min((stats.totalActualTime / stats.totalEstimatedTime) * 100, 100)
                  : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">This Week</h3>
          <Calendar className="w-5 h-5 text-teal-500" />
        </div>
        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.dueThisWeek}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Due in 7 days
        </div>
      </div>

      {/* Backlog */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Backlog</h3>
          <Clock className="w-5 h-5 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.noDueDate}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          No due date set
        </div>
      </div>
    </div>
  );
};

export default TaskStatsComponent;