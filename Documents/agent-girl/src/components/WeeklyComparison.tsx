import React from 'react';
import { WeeklyComparison } from '../types';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { getTrendIcon, getTrendColor, calculateTrend } from '../utils/helpers';

interface WeeklyComparisonProps {
  comparison: WeeklyComparison;
}

const ComparisonMetric: React.FC<{
  label: string;
  current: number;
  previous: number;
  unit?: string;
  color: string;
}> = ({ label, current, previous, unit = '', color }) => {
  const change = current - previous;
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
  const trend = calculateTrend(current, previous);

  return (
    <div className="p-4 glass rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
        <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(trend)}`}>
          {getTrendIcon(trend)}
          <span>{change > 0 ? '+' : ''}{changePercent}%</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${color}`}>{current}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sage-500 to-sage-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((current / Math.max(current, previous)) * 100, 100)}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {previous}
        </span>
      </div>
    </div>
  );
};

export const WeeklyComparisonComponent: React.FC<WeeklyComparisonProps> = ({ comparison }) => {
  const { currentWeek, previousWeek } = comparison;

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-sage-600 dark:text-sage-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Comparison</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonMetric
          label="Tasks Completed"
          current={currentWeek.tasksCompleted}
          previous={previousWeek.tasksCompleted}
          color="text-sage-600 dark:text-sage-400"
        />

        <ComparisonMetric
          label="Journal Entries"
          current={currentWeek.journalEntries}
          previous={previousWeek.journalEntries}
          color="text-soft-lavender-600 dark:text-soft-lavender-400"
        />

        <ComparisonMetric
          label="Average Mood"
          current={currentWeek.averageMood}
          previous={previousWeek.averageMood}
          unit="/10"
          color="text-dusty-blue-600 dark:text-dusty-blue-400"
        />

        <ComparisonMetric
          label="Meeting Hours"
          current={currentWeek.meetingHours}
          previous={previousWeek.meetingHours}
          unit="h"
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-sage-500/10 to-soft-lavender-500/10 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
          {currentWeek.tasksCompleted > previousWeek.tasksCompleted ? (
            <>
              🎉 <span className="font-medium">Great progress!</span> You're more productive than last week.
            </>
          ) : currentWeek.tasksCompleted < previousWeek.tasksCompleted ? (
            <>
              💪 <span className="font-medium">Keep pushing!</span> Focus on completing more tasks this week.
            </>
          ) : (
            <>
              ⚖️ <span className="font-medium">Steady pace!</span> Maintain your current productivity level.
            </>
          )}
        </p>
      </div>
    </div>
  );
};