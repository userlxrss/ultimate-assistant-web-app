import React from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, Calendar, Mail, Users, BookOpen } from 'lucide-react';
import { DashboardStats } from '../types';
import { getTrendIcon, getTrendColor, calculateTrend } from '../utils/helpers';

interface DashboardStatsProps {
  stats: DashboardStats;
  previousStats?: Partial<DashboardStats>;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => {
  const trend = change !== undefined ? calculateTrend(change, Math.abs(change) - (change > 0 ? change : -change)) : 'stable';
  const changeColor = change !== undefined ? (change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500') : '';

  return (
    <div className="stat-card group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {change !== undefined && (
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

export const DashboardStatsComponent: React.FC<DashboardStatsProps> = ({ stats, previousStats }) => {
  const taskCompletionRate = Math.round((stats.completedTasks / stats.totalTasks) * 100);
  const previousCompletionRate = previousStats ? Math.round((previousStats.completedTasks! / previousStats.totalTasks!) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Task Completion Rate"
        value={`${taskCompletionRate}%`}
        change={previousStats ? taskCompletionRate - previousCompletionRate : undefined}
        icon={<CheckCircle className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-sage-500 to-sage-600"
      />
      <StatCard
        title="Total Journal Entries"
        value={stats.totalJournalEntries}
        change={previousStats ? stats.totalJournalEntries - previousStats.totalJournalEntries! : undefined}
        icon={<BookOpen className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-soft-lavender-500 to-soft-lavender-600"
      />
      <StatCard
        title="Email Activity"
        value={stats.totalEmails}
        change={previousStats ? stats.totalEmails - previousStats.totalEmails! : undefined}
        icon={<Mail className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-dusty-blue-500 to-dusty-blue-600"
      />
      <StatCard
        title="Total Contacts"
        value={stats.totalContacts}
        change={previousStats ? stats.totalContacts - previousStats.totalContacts! : undefined}
        icon={<Users className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />
    </div>
  );
};