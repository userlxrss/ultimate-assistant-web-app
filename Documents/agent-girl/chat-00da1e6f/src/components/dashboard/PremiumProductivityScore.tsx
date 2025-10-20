'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Brain,
  Calendar,
  Mail,
  TrendingUp,
  Zap,
  Award,
  Activity,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/store/useAppStore'
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '@/components/ui/PremiumCard'

interface PremiumProductivityScoreProps {
  className?: string
}

export function PremiumProductivityScore({ className }: PremiumProductivityScoreProps) {
  const dashboardData = useDashboardData()

  if (!dashboardData) {
    return (
      <PremiumCard className={className}>
        <PremiumCardContent className="p-6">
          <div className="loading-shimmer h-48 rounded-2xl" />
        </PremiumCardContent>
      </PremiumCard>
    )
  }

  const { productivityScore } = dashboardData
  const score = productivityScore.overall

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500'
    if (score >= 60) return 'from-blue-500 to-cyan-500'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional'
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Great'
    if (score >= 60) return 'Good'
    if (score >= 50) return 'Average'
    if (score >= 40) return 'Below Average'
    return 'Needs Improvement'
  }

  const metrics = [
    {
      name: 'Task Completion',
      value: productivityScore.taskCompletion,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Journal Consistency',
      value: productivityScore.journalConsistency,
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      name: 'Calendar Adherence',
      value: productivityScore.calendarAdherence,
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      name: 'Email Response',
      value: productivityScore.emailResponsiveness,
      icon: Mail,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ]

  // Calculate circumference for circle progress
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <PremiumCard
        variant="glass"
        hover
        animated
        className="relative overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(score)}`} />
        </div>

        <PremiumCardContent className="p-8 relative z-10">
          {/* Header */}
          <PremiumCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500"
                >
                  <Activity className="w-6 h-6 text-white" />
                </motion.div>
                <PremiumCardTitle>
                  Productivity Score
                </PremiumCardTitle>
              </div>

              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold text-white",
                  `bg-gradient-to-r ${getScoreGradient(score)}`
                )}
              >
                {getScoreLabel(score)}
              </motion.div>
            </div>
          </PremiumCardHeader>

          {/* Main Score Visualization */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              {/* Background circle */}
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />

                {/* Progress circle */}
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                  className="drop-shadow-lg"
                />

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={getScoreColor(score).replace('text-', 'stop-color-')} />
                    <stop offset="100%" className={getScoreColor(score).replace('text-', 'stop-color-')} opacity="0.6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="text-center"
                >
                  <div className={cn("text-6xl font-black", getScoreColor(score))}>
                    {score}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                    Overall Score
                  </div>
                </motion.div>

                {/* Floating indicators */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="mt-4"
                >
                  {productivityScore.trend === 'up' && (
                    <div className="flex items-center space-x-1 text-green-500">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Improving</span>
                    </div>
                  )}
                  {productivityScore.trend === 'down' && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <TrendingUp className="w-4 h-4 rotate-180" />
                      <span className="text-xs font-medium">Declining</span>
                    </div>
                  )}
                  {productivityScore.trend === 'stable' && (
                    <div className="flex items-center space-x-1 text-blue-500">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-medium">Stable</span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Decorative orbit dots */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 45}deg) translateX(140px) translateX(-50%) translateY(-50%)`
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25
                  }}
                />
              ))}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-4 rounded-2xl border border-white/10 dark:border-white/5",
                  "hover:glass-premium transition-all duration-300"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-xl", metric.bgColor)}>
                    <metric.icon className={cn("w-4 h-4", metric.color)} />
                  </div>
                  <span className={cn("text-lg font-bold", metric.color)}>
                    {metric.value}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {metric.name}
                  </div>

                  {/* Mini progress bar */}
                  <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ delay: 1.5 + index * 0.1, duration: 0.8 }}
                      className={cn(
                        "h-full rounded-full",
                        metric.value >= 80 ? "bg-green-500" :
                        metric.value >= 60 ? "bg-blue-500" :
                        metric.value >= 40 ? "bg-yellow-500" : "bg-red-500"
                      )}
                    />
                  </div>
                </div>

                {/* Checkmark indicator */}
                {metric.value >= 80 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.8 + index * 0.1, type: "spring" }}
                    className="mt-2"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Achievement Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-6 p-4 glass-premium rounded-2xl"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Award className="w-5 h-5 text-yellow-500" />
              </motion.div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {score >= 90 ? 'Peak Performance!' :
                   score >= 80 ? 'Excelling in Productivity!' :
                   score >= 70 ? 'Great Progress!' :
                   score >= 60 ? 'On the Right Track!' :
                   score >= 50 ? 'Room for Improvement!' :
                   'Focus on Growth Areas!'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {score >= 80 ? 'You\'re in the top 20% of productive users!' :
                   score >= 60 ? 'Keep building these productive habits!' :
                   'Small improvements lead to big results!'}
                </div>
              </div>
            </div>
          </motion.div>
        </PremiumCardContent>
      </PremiumCard>
    </motion.div>
  )
}