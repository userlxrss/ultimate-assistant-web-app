'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CheckSquare,
  Trophy,
  Flame,
  Brain,
  Zap,
  Target,
  Activity
} from 'lucide-react'
import { cn, getMoodEmoji, getMoodColor, getMoodBgColor, formatCountdown } from '@/lib/utils'
import { useDashboardData, useAppActions } from '@/store/useAppStore'
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '@/components/ui/PremiumCard'

interface PremiumDashboardStatsProps {
  className?: string
}

export function PremiumDashboardStats({ className }: PremiumDashboardStatsProps) {
  const dashboardData = useDashboardData()
  const { setCurrentModule } = useAppActions()

  if (!dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="loading-shimmer h-40 rounded-3xl" />
        ))}
      </div>
    )
  }

  const { todayStats } = dashboardData

  const premiumStats = [
    {
      title: "Today's Mood",
      value: todayStats.mood.emoji,
      description: `${todayStats.mood.score}/10 mood score`,
      icon: Brain,
      iconColor: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      trendIcon: todayStats.mood.trend === 'up' ? TrendingUp : todayStats.mood.trend === 'down' ? TrendingDown : Minus,
      trendColor: todayStats.mood.trend === 'up' ? 'text-green-500' : todayStats.mood.trend === 'down' ? 'text-red-500' : 'text-gray-500',
      progress: (todayStats.mood.score / 10) * 100,
      onClick: () => setCurrentModule('journal'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: "Task Completion",
      value: `${todayStats.tasks.percentage}%`,
      description: `${todayStats.tasks.completed}/${todayStats.tasks.total} tasks done`,
      icon: Target,
      iconColor: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      trendIcon: todayStats.tasks.percentage >= 75 ? TrendingUp : todayStats.tasks.percentage >= 50 ? Minus : TrendingDown,
      trendColor: todayStats.tasks.percentage >= 75 ? 'text-green-500' : todayStats.tasks.percentage >= 50 ? 'text-yellow-500' : 'text-red-500',
      progress: todayStats.tasks.percentage,
      onClick: () => setCurrentModule('tasks'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: "Productivity Streak",
      value: `${todayStats.winsThisWeek}`,
      description: 'journal entries this week',
      icon: Flame,
      iconColor: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      trendIcon: todayStats.winsThisWeek >= 5 ? TrendingUp : Minus,
      trendColor: todayStats.winsThisWeek >= 5 ? 'text-green-500' : 'text-gray-500',
      progress: Math.min((todayStats.winsThisWeek / 7) * 100, 100),
      onClick: () => setCurrentModule('journal'),
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: "Next Event",
      value: todayStats.nextEvent ? formatCountdown(todayStats.nextEvent.startTime) : 'Free',
      description: todayStats.nextEvent?.title || 'No upcoming events',
      icon: Calendar,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      trendIcon: todayStats.nextEvent ? Activity : Calendar,
      trendColor: 'text-indigo-500',
      progress: todayStats.nextEvent ? 75 : 0,
      onClick: () => setCurrentModule('calendar'),
      gradient: 'from-indigo-500 to-purple-500'
    }
  ]

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {premiumStats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
          whileHover={{ y: -5 }}
          onClick={stat.onClick}
          className="cursor-pointer"
        >
          <PremiumCard
            variant="glass"
            hover
            glow
            animated
            className="relative overflow-hidden group"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
            </div>

            <PremiumCardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300 group-hover:scale-110",
                    stat.bgColor
                  )}
                >
                  <stat.icon className={cn("w-6 h-6", stat.iconColor)} />
                </motion.div>

                {/* Trend Indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center space-x-1"
                >
                  <stat.trendIcon className={cn("w-4 h-4", stat.trendColor)} />
                  <span className={cn("text-xs font-semibold", stat.trendColor)}>
                    {stat.title === "Today's Mood" ? todayStats.mood.trend :
                     stat.title === "Task Completion" ? (todayStats.tasks.percentage >= 75 ? 'up' : todayStats.tasks.percentage >= 50 ? 'stable' : 'down') :
                     stat.title === "Productivity Streak" ? (todayStats.winsThisWeek >= 5 ? 'up' : 'stable') : 'stable'}
                  </span>
                </motion.div>
              </div>

              {/* Main Content */}
              <div className="space-y-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-baseline space-x-2">
                    <div className={cn("text-3xl font-black", stat.textColor)}>
                      {stat.value}
                    </div>
                    {stat.title === "Today's Mood" && (
                      <div className={cn("text-lg font-semibold", stat.textColor)}>
                        {todayStats.mood.score}/10
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </div>
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.8 }}
                  className="space-y-2"
                >
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full relative overflow-hidden",
                        `bg-gradient-to-r ${stat.gradient}`
                      )}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 animate-shimmer" />
                    </motion.div>
                  </div>

                  {/* Progress percentage */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Progress
                    </span>
                    <span className={cn("text-xs font-bold", stat.textColor)}>
                      {Math.round(stat.progress)}%
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>
      ))}
    </div>
  )
}

// Premium Streak Card Component
export function PremiumStreakCard({ className }: PremiumDashboardStatsProps) {
  const dashboardData = useDashboardData()
  const { setCurrentModule } = useAppActions()

  if (!dashboardData) {
    return (
      <PremiumCard className={className}>
        <PremiumCardContent className="p-6">
          <div className="loading-shimmer h-32 rounded-2xl" />
        </PremiumCardContent>
      </PremiumCard>
    )
  }

  const { moodAnalytics } = dashboardData
  const { currentStreak, longestStreak } = moodAnalytics

  const streakPercentage = longestStreak > 0 ? (currentStreak / longestStreak) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <PremiumCard
        variant="gradient"
        hover
        animated
        className="relative overflow-hidden group"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-10" />

        <PremiumCardContent className="p-8 relative z-10">
          {/* Header */}
          <PremiumCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="p-3 glass-premium rounded-2xl"
                >
                  <Flame className="w-6 h-6 text-orange-500" />
                </motion.div>
                <PremiumCardTitle className="text-white">
                  Journal Streak
                </PremiumCardTitle>
              </div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 glass-premium rounded-full"
              >
                <span className="text-xs font-bold text-white">
                  Active 🔥
                </span>
              </motion.div>
            </div>
          </PremiumCardHeader>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl font-black text-white mb-2"
              >
                {currentStreak}
              </motion.div>
              <div className="text-sm font-medium text-white/80">
                Current Streak
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-white mb-2">
                {longestStreak}
              </div>
              <div className="text-sm font-medium text-white/80">
                Longest Streak
              </div>
            </motion.div>
          </div>

          {/* Progress Visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-white/70">Progress to Record</span>
              <span className="text-xs font-bold text-white">{Math.round(streakPercentage)}%</span>
            </div>

            <div className="relative h-3 glass-premium rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${streakPercentage}%` }}
                transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full relative"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6 p-4 glass-premium rounded-2xl"
          >
            <p className="text-center text-sm font-medium text-white">
              {currentStreak === 1 ? "Great start! Keep it going!" :
               currentStreak < 7 ? "You're building a great habit! 🌟" :
               currentStreak < 30 ? "Amazing consistency! 💪" :
               "You're a journaling master! 🏆"}
            </p>
          </motion.div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 70}%`
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </PremiumCardContent>
      </PremiumCard>
    </motion.div>
  )
}