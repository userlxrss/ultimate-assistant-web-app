'use client'

import React from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { BookOpen, CheckSquare, Calendar, Mail, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityItem } from '@/types'

interface RecentActivityProps {
  className?: string
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'journal':
      return <BookOpen className="w-4 h-4 text-purple-500" />
    case 'task':
      return <CheckSquare className="w-4 h-4 text-blue-500" />
    case 'calendar':
      return <Calendar className="w-4 h-4 text-green-500" />
    case 'email':
      return <Mail className="w-4 h-4 text-orange-500" />
    case 'contact':
      return <Users className="w-4 h-4 text-pink-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'journal':
      return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
    case 'task':
      return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
    case 'calendar':
      return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
    case 'email':
      return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
    case 'contact':
      return 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20'
    default:
      return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20'
  }
}

export function RecentActivity({ className }: RecentActivityProps) {
  const { dashboardData } = useAppStore()

  if (!dashboardData) {
    return (
      <div className={cn("glass-card p-6 rounded-xl", className)}>
        <div className="loading-skeleton h-64 rounded-xl" />
      </div>
    )
  }

  const { recentActivity } = dashboardData

  return (
    <div className={cn("glass-card p-6 rounded-xl", className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Recent Activity
      </h3>

      <div className="space-y-4">
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No recent activity to show
            </p>
          </div>
        ) : (
          recentActivity.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start space-x-3 p-3 rounded-lg border",
                getActivityColor(activity.type)
              )}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {recentActivity.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            View All Activity
          </button>
        </div>
      )}
    </div>
  )
}