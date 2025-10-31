import React from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, Calendar, Mail, Users, BookOpen } from 'lucide-react';
import { DashboardStats } from '../types';
import { getTrendIcon, getTrendColor, calculateTrend } from '../utils/helpers';

interface DashboardStatsProps {
  stats: DashboardStats;
  previousStats?: Partial<DashboardStats>;
  periodComparisons?: {
    taskCompletion: { value: number; trend: 'up' | 'down' };
    journalEntries: { value: number; trend: 'up' | 'down' };
    emailActivity: { value: number; trend: 'up' | 'down' };
    events: { value: number; trend: 'up' | 'down' };
    contacts: { value: number; trend: 'up' | 'down' };
  };
  dateRange?: string;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, change, icon, color, subtitle }) => {
  const trend = change !== undefined && change !== 0 ? calculateTrend(change, Math.abs(change) - (change > 0 ? change : -change)) : 'stable';
  const changeColor = change !== undefined && change !== 0 ? (change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500') : '';

  return (
    <div className="stat-card group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{subtitle}</p>
          )}
          {change !== undefined && change !== 0 && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${changeColor}`}>
                {getTrendIcon(trend)} {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const DashboardStatsComponent: React.FC<DashboardStatsProps> = ({ stats, previousStats, periodComparisons, dateRange }) => {
  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Task Completion Rate"
        value={`${taskCompletionRate}%`}
        change={periodComparisons?.taskCompletion.value && periodComparisons.taskCompletion.value !== 0
          ? (periodComparisons.taskCompletion.trend === 'up' ? periodComparisons.taskCompletion.value : -periodComparisons.taskCompletion.value)
          : undefined}
        subtitle={stats.totalTasks === 0 ? "Create tasks to track completion" : `${stats.completedTasks}/${stats.totalTasks} completed`}
        icon={<CheckCircle className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-green-500 to-green-600"
      />
      <StatCard
        title="Total Journal Entries"
        value={stats.totalJournalEntries}
        change={periodComparisons?.journalEntries.value && periodComparisons.journalEntries.value !== 0
          ? (periodComparisons.journalEntries.trend === 'up' ? periodComparisons.journalEntries.value : -periodComparisons.journalEntries.value)
          : undefined}
        subtitle={stats.totalJournalEntries === 0 ? "Start journaling to see insights" : `Last ${dateRange} days`}
        icon={<BookOpen className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-blue-500 to-blue-600"
      />
      <StatCard
        title="Email Activity"
        value={stats.totalEmails}
        change={periodComparisons?.emailActivity.value && periodComparisons.emailActivity.value !== 0
          ? (periodComparisons.emailActivity.trend === 'up' ? periodComparisons.emailActivity.value : -periodComparisons.emailActivity.value)
          : undefined}
        subtitle={stats.totalEmails === 0 ? "No email activity yet" : `Last ${dateRange} days`}
        icon={<Mail className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />
      <StatCard
        title="Total Contacts"
        value="N/A"
        change={undefined}
        subtitle="Contacts temporarily unavailable"
        icon={<Users className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-gray-400 to-gray-500 opacity-50"
      />
    </div>
  );
};