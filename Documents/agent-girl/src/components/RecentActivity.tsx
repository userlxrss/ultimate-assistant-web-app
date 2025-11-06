import React from 'react';
import { Activity } from '../types';
import { getTimeAgo, formatDateTime } from '../utils/helpers';
import { CheckSquare, BookOpen, Mail, Calendar, Users } from 'lucide-react';

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'task': return <CheckSquare className="w-5 h-5 text-sage-500" />;
    case 'journal': return <BookOpen className="w-5 h-5 text-soft-lavender-500" />;
    case 'email': return <Mail className="w-5 h-5 text-dusty-blue-500" />;
    case 'event': return <Calendar className="w-5 h-5 text-purple-500" />;
    case 'contact': return <Users className="w-5 h-5 text-pink-500" />;
    default: return <CheckSquare className="w-5 h-5 text-gray-500" />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'task': return 'border-sage-500/30 bg-sage-500/5';
    case 'journal': return 'border-soft-lavender-500/30 bg-soft-lavender-500/5';
    case 'email': return 'border-dusty-blue-500/30 bg-dusty-blue-500/5';
    case 'event': return 'border-purple-500/30 bg-purple-500/5';
    case 'contact': return 'border-pink-500/30 bg-pink-500/5';
    default: return 'border-gray-500/30 bg-gray-500/5';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const displayActivities = activities.slice(0, 15);

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Last {displayActivities.length} activities</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={`activity-item border-l-4 ${getActivityColor(activity.type)} animate-fade-in`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {activity.type}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getTimeAgo(activity.date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {displayActivities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent activities to display</p>
          </div>
        )}
      </div>

      {activities.length > 15 && (
        <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
          <button className="w-full text-center text-sm text-sage-600 dark:text-sage-400 hover:text-sage-500 dark:hover:text-sage-300 transition-colors duration-200">
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
};