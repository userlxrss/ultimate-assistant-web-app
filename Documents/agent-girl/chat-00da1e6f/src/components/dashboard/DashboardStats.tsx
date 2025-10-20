'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus, Calendar, CheckSquare, Trophy, Flame } from 'lucide-react'
import { cn, getMoodEmoji, getMoodColor, getMoodBgColor, formatCountdown } from '@/lib/utils'
import { useDashboardData, useAppActions } from '@/store/useAppStore'
import type { Task } from '@/types'
import { Button } from '@/components/ui/Button'

interface DashboardStatsProps {
  className?: string
}

export function DashboardStats({ className }: DashboardStatsProps) {
  const dashboardData = useDashboardData()
  const { setCurrentModule } = useAppActions()

  if (!dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="loading-skeleton h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  const { todayStats } = dashboardData

  const stats = [
    {
      title: "Today's Mood",
      value: todayStats.mood.emoji,
      description: `${todayStats.mood.score}/10`,
      icon: todayStats.mood.trend === 'up' ? TrendingUp : todayStats.mood.trend === 'down' ? TrendingDown : Minus,
      iconColor: todayStats.mood.trend === 'up' ? 'text-green-500' : todayStats.mood.trend === 'down' ? 'text-red-500' : 'text-gray-500',
      bgColor: getMoodBgColor(todayStats.mood.score),
      textColor: getMoodColor(todayStats.mood.score),
      onClick: () => setCurrentModule('journal')
    },
    {
      title: "Tasks Today",
      value: `${todayStats.tasks.completed}/${todayStats.tasks.total}`,
      description: `${todayStats.tasks.percentage}% complete`,
      icon: CheckSquare,
      iconColor: todayStats.tasks.percentage >= 75 ? 'text-green-500' : todayStats.tasks.percentage >= 50 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => setCurrentModule('tasks')
    },
    {
      title: "Journal Streak",
      value: `${todayStats.winsThisWeek}`,
      description: 'entries this week',
      icon: Flame,
      iconColor: todayStats.winsThisWeek >= 5 ? 'text-orange-500' : 'text-gray-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      onClick: () => setCurrentModule('journal')
    },
    {
      title: "Next Event",
      value: todayStats.nextEvent ? formatCountdown(todayStats.nextEvent.startTime) : 'No events',
      description: todayStats.nextEvent?.title || 'Schedule something',
      icon: Calendar,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      onClick: () => setCurrentModule('calendar')
    }
  ]

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {stats.map((stat, index) => (
        <button
          key={index}
          onClick={stat.onClick}
          className={cn(
            "p-6 rounded-xl border transition-all hover:shadow-md hover:scale-105 text-left",
            stat.bgColor,
            "border-gray-200 dark:border-gray-800",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.description}
            </div>
          </div>

          <div className="space-y-1">
            <div className={cn("text-2xl font-bold", stat.textColor)}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {stat.title}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// Streak Card Component
export function StreakCard({ className }: DashboardStatsProps) {
  const dashboardData = useDashboardData()
  const { setCurrentModule } = useAppActions()

  if (!dashboardData) {
    return (
      <div className={cn("p-6 rounded-xl border", className)}>
        <div className="loading-skeleton h-24 rounded-lg" />
      </div>
    )
  }

  const { moodAnalytics } = dashboardData
  const { currentStreak, longestStreak } = moodAnalytics

  return (
    <div className={cn(
      "p-6 rounded-xl border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Journal Streak
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentModule('journal')}
          className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
        >
          View
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Current Streak</span>
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {currentStreak}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Longest Streak</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {longestStreak}
          </span>
        </div>

        {currentStreak > 0 && (
          <div className="mt-3 p-2 bg-white/50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-xs text-center text-gray-600 dark:text-gray-300">
              {currentStreak === 1 ? "Great start! Keep it going!" :
               currentStreak < 7 ? "You're building a great habit!" :
               currentStreak < 30 ? "Amazing consistency!" :
               "You're a journaling master!"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}