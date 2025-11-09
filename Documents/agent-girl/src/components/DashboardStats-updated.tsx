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

const PremiumStatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  gradientClass: string;
}> = ({ title, value, change, icon, color, subtitle, gradientClass }) => {
  const trend = change !== undefined && change !== 0 ? calculateTrend(change, Math.abs(change) - (change > 0 ? change : -change)) : 'stable';
  const changeColor = change !== undefined && change !== 0 ? (change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400') : '';

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800/40 dark:backdrop-blur-xl dark:border dark:border-white/10 p-6 rounded-2xl shadow-md">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 ${gradientClass} dark:opacity-50`}></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center"
               style={{
                 background: color
               }}>
            {icon}
          </div>
        </div>
        <h3 className="text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <p className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">
            {subtitle}
          </p>
        )}
        {change !== undefined && change !== 0 && (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${changeColor} flex items-center gap-1 transition-colors duration-300`}>
              {getTrendIcon(trend)}
              <span className="font-mono">{Math.abs(change)}%</span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const DashboardStatsComponent: React.FC<DashboardStatsProps> = ({ stats, previousStats, periodComparisons, dateRange }) => {
  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <PremiumStatCard
        title="Task Completion Rate"
        value={`${taskCompletionRate}%`}
        change={periodComparisons?.taskCompletion.value && periodComparisons.taskCompletion.value !== 0
          ? (periodComparisons.taskCompletion.trend === 'up' ? periodComparisons.taskCompletion.value : -periodComparisons.taskCompletion.value)
          : undefined}
        subtitle={stats.totalTasks === 0 ? "Create tasks to track completion" : `${stats.completedTasks}/${stats.totalTasks} completed`}
        icon={<CheckCircle className="text-white" size={24} />}
        color="linear-gradient(to bottom right, #10b981, #059669)"
        gradientClass="bg-gradient-to-br from-green-500/10 to-emerald-600/10"
      />
      <PremiumStatCard
        title="Total Journal Entries"
        value={stats.totalJournalEntries}
        change={periodComparisons?.journalEntries.value && periodComparisons.journalEntries.value !== 0
          ? (periodComparisons.journalEntries.trend === 'up' ? periodComparisons.journalEntries.value : -periodComparisons.journalEntries.value)
          : undefined}
        subtitle={stats.totalJournalEntries === 0 ? "Start journaling to see insights" : `Last ${dateRange} days`}
        icon={<BookOpen className="text-white" size={24} />}
        color="linear-gradient(to bottom right, #3b82f6, #0891b2)"
        gradientClass="bg-gradient-to-br from-blue-500/10 to-cyan-600/10"
      />
      <PremiumStatCard
        title="Email Activity"
        value={stats.totalEmails}
        change={periodComparisons?.emailActivity.value && periodComparisons.emailActivity.value !== 0
          ? (periodComparisons.emailActivity.trend === 'up' ? periodComparisons.emailActivity.value : -periodComparisons.emailActivity.value)
          : undefined}
        subtitle={stats.totalEmails === 0 ? "No email activity yet" : `Last ${dateRange} days`}
        icon={<Mail className="text-white" size={24} />}
        color="linear-gradient(to bottom right, #a855f7, #ec4899)"
        gradientClass="bg-gradient-to-br from-purple-500/10 to-pink-600/10"
      />
      <PremiumStatCard
        title="Total Contacts"
        value="N/A"
        change={undefined}
        subtitle="Contacts temporarily unavailable"
        icon={<Users className="text-white" size={24} />}
        color="linear-gradient(to bottom right, #f97316, #ef4444)"
        gradientClass="bg-gradient-to-br from-orange-500/10 to-red-600/10"
      />
    </div>
  );
};

// Legacy StatCard for backward compatibility
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
    <div className="premium-card group cursor-pointer hover:premium-glass-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              {subtitle}
            </p>
          )}
          {change !== undefined && change !== 0 && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${changeColor} flex items-center gap-1 transition-colors duration-300`}>
                {getTrendIcon(trend)}
                <span className="font-mono">{Math.abs(change)}%</span>
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} transition-all duration-300 shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};