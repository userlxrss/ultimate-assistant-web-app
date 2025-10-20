'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PremiumDashboardStats, PremiumStreakCard } from '@/components/dashboard/PremiumDashboardStats'
import { PremiumProductivityScore } from '@/components/dashboard/PremiumProductivityScore'
import { MoodAnalytics } from '@/components/dashboard/MoodAnalytics'
import { ProductivityMetrics } from '@/components/dashboard/ProductivityMetrics'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '@/components/ui/PremiumCard'
import { PremiumButton, PremiumButtonGroup } from '@/components/ui/PremiumButton'
import {
  Calendar,
  CheckSquare,
  BookOpen,
  Mail,
  Users,
  TrendingUp,
  Clock,
  Target,
  Activity,
  Heart,
  Zap,
  Sparkles,
  BarChart3,
  Brain,
  Award,
  Star
} from 'lucide-react'
import {
  useJournalEntries,
  useTasks,
  useEvents,
  useEmails,
  useContacts,
  useTodayTasks,
  useOverdueTasks,
  useUpcomingEvents,
  useAppActions
} from '@/store/useAppStore'
import type { JournalEntry, Task, CalendarEvent, Email, Contact } from '@/types'
import { format, startOfWeek, endOfWeek, isToday, isThisWeek } from 'date-fns'
import { cn } from '@/lib/utils'

export default function PremiumDashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('week')

  const journalEntries = useJournalEntries()
  const tasks = useTasks()
  const events = useEvents()
  const emails = useEmails()
  const contacts = useContacts()

  const todayTasks = useTodayTasks()
  const overdueTasks = useOverdueTasks()
  const upcomingEvents = useUpcomingEvents()
  const { setDashboardData } = useAppActions()

  // Calculate metrics
  const completedTasksToday = todayTasks.filter(task => task.status === 'completed')
  const unreadEmails = emails.filter(email => !email.isRead)
  const journalThisWeek = journalEntries.filter(entry => isThisWeek(entry.date, { weekStartsOn: 1 }))
  const eventsToday = events.filter(event => isToday(event.startTime))
  const favoriteContacts = contacts.filter(contact => contact.isFavorite)

  const completionRateToday = todayTasks.length > 0
    ? Math.round((completedTasksToday.length / todayTasks.length) * 100)
    : 0

  const averageMood = journalEntries.length > 0
    ? (journalEntries.reduce((sum, entry) => sum + entry.mood, 0) / journalEntries.length).toFixed(1)
    : '0'

  // Generate dashboard data on component mount
  useEffect(() => {
    const generateDashboardData = () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayJournal = journalEntries.find(entry =>
        entry.date.toDateString() === today.toDateString()
      )

      const nextEvent = upcomingEvents[0]

      const dashboardData = {
        todayStats: {
          mood: {
            score: todayJournal?.mood || 5,
            emoji: getMoodEmoji(todayJournal?.mood || 5),
            trend: 'same' as const
          },
          tasks: {
            total: todayTasks.length,
            completed: completedTasksToday.length,
            percentage: completionRateToday
          },
          nextEvent: nextEvent ? {
            title: nextEvent.title,
            startTime: nextEvent.startTime,
            countdown: formatCountdown(nextEvent.startTime)
          } : undefined,
          winsThisWeek: journalThisWeek.length
        },
        moodAnalytics: {
          averageMood: parseFloat(averageMood),
          moodTrend: 'stable' as const,
          currentStreak: calculateStreak(journalEntries.map(e => e.date)),
          longestStreak: 0,
          moodDistribution: [],
          weeklyComparison: {
            thisWeek: journalThisWeek.length,
            lastWeek: 0,
            change: 0,
            changePercent: 0
          }
        },
        taskAnalytics: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          completionRate: tasks.length > 0
            ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
            : 0,
          overdueTasks: overdueTasks.length,
          tasksDueToday: todayTasks.length,
          tasksThisWeek: tasks.filter(t => {
            if (!t.dueDate) return false
            return isThisWeek(t.dueDate, { weekStartsOn: 1 })
          }).length,
          averageCompletionTime: 0,
          productivityScore: 0
        },
        upcomingEvents: upcomingEvents,
        recentActivity: generateRecentActivity(),
        productivityScore: {
          overall: calculateProductivityScore(),
          taskCompletion: completionRateToday,
          journalConsistency: calculateJournalConsistency(),
          calendarAdherence: calculateCalendarAdherence(),
          emailResponsiveness: calculateEmailResponsiveness(),
          trend: 'stable' as const
        },
        insights: generateInsights()
      }

      setDashboardData(dashboardData)
    }

    generateDashboardData()
  }, [journalEntries, tasks, events, emails, contacts, setDashboardData])

  const generateRecentActivity = () => {
    const activities = []

    // Recent journal entries
    const recentJournal = journalEntries.slice(0, 3)
    recentJournal.forEach(entry => {
      activities.push({
        id: entry.id,
        type: 'journal' as const,
        title: 'Journal Entry',
        description: `Mood: ${entry.mood}/10 - ${entry.reflections.slice(0, 50)}...`,
        timestamp: entry.date,
        metadata: { mood: entry.mood }
      })
    })

    // Recent completed tasks
    const recentCompleted = tasks.filter(t => t.status === 'completed').slice(0, 3)
    recentCompleted.forEach(task => {
      activities.push({
        id: task.id,
        type: 'task' as const,
        title: 'Task Completed',
        description: task.title,
        timestamp: task.completedAt || task.updatedAt,
        metadata: { priority: task.priority }
      })
    })

    // Recent events
    const recentEvents = events.filter(e => e.startTime < new Date()).slice(0, 2)
    recentEvents.forEach(event => {
      activities.push({
        id: event.id,
        type: 'calendar' as const,
        title: 'Event Attended',
        description: event.title,
        timestamp: event.startTime,
        metadata: { type: event.type }
      })
    })

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
  }

  const calculateProductivityScore = () => {
    const taskScore = completionRateToday * 0.4
    const journalScore = calculateJournalConsistency() * 0.3
    const calendarScore = calculateCalendarAdherence() * 0.2
    const emailScore = calculateEmailResponsiveness() * 0.1

    return Math.round(taskScore + journalScore + calendarScore + emailScore)
  }

  const calculateJournalConsistency = () => {
    const thisWeekEntries = journalEntries.filter(entry => isThisWeek(entry.date, { weekStartsOn: 1 }))
    return Math.min(100, (thisWeekEntries.length / 7) * 100)
  }

  const calculateCalendarAdherence = () => {
    const todayEvents = events.filter(event => isToday(event.startTime))
    if (todayEvents.length === 0) return 100
    return 85
  }

  const calculateEmailResponsiveness = () => {
    if (unreadEmails.length === 0) return 100
    const totalEmails = emails.length
    const responseRate = ((totalEmails - unreadEmails.length) / totalEmails) * 100
    return Math.round(responseRate)
  }

  const generateInsights = () => {
    const insights = []

    if (overdueTasks.length > 0) {
      insights.push({
        id: '1',
        type: 'warning' as const,
        title: 'Tasks Overdue',
        description: `You have ${overdueTasks.length} overdue tasks that need attention.`,
        actionable: true,
        priority: 'high' as const,
        createdAt: new Date()
      })
    }

    if (unreadEmails.length > 10) {
      insights.push({
        id: '2',
        type: 'recommendation' as const,
        title: 'Email Backlog',
        description: `You have ${unreadEmails.length} unread emails. Consider setting aside time to clear your inbox.`,
        actionable: true,
        priority: 'medium' as const,
        createdAt: new Date()
      })
    }

    if (journalThisWeek.length < 3) {
      insights.push({
        id: '3',
        type: 'pattern' as const,
        title: 'Journal Consistency',
        description: 'Your journal entries have been inconsistent this week. Regular journaling can improve self-awareness.',
        actionable: true,
        priority: 'low' as const,
        createdAt: new Date()
      })
    }

    return insights
  }

  // Helper functions
  const getMoodEmoji = (mood: number): string => {
    if (mood >= 9) return "😊"
    if (mood >= 8) return "🙂"
    if (mood >= 7) return "😌"
    if (mood >= 6) return "😐"
    if (mood >= 5) return "😕"
    if (mood >= 4) return "😔"
    if (mood >= 3) return "😟"
    if (mood >= 2) return "😢"
    return "😭"
  }

  const formatCountdown = (date: Date): string => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return "Started"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''}`
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

    return `${minutes}m`
  }

  const calculateStreak = (dates: Date[]): number => {
    if (dates.length === 0) return 0

    const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime())
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const date of sortedDates) {
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)

      if (checkDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (checkDate.getTime() < currentDate.getTime()) {
        break
      }
    }

    return streak
  }

  return (
    <div className="p-8 space-y-8">
      {/* Premium Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black text-gradient-primary mb-2"
          >
            Premium Dashboard
          </motion.h1>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 font-medium"
          >
            Your productivity insights at a glance
          </motion.p>
        </div>

        <div className="flex items-center space-x-6">
          {/* Time Range Selector */}
          <PremiumButtonGroup>
            {(['today', 'week', 'month'] as const).map((range, index) => (
              <motion.div
                key={range}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <PremiumButton
                  variant={selectedTimeRange === range ? 'gradient' : 'glass'}
                  size="md"
                  onClick={() => setSelectedTimeRange(range)}
                  className={cn(
                    "capitalize",
                    selectedTimeRange === range && "shadow-lg"
                  )}
                >
                  {range}
                </PremiumButton>
              </motion.div>
            ))}
          </PremiumButtonGroup>

          {/* Quick Actions */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <QuickActions />
          </motion.div>
        </div>
      </motion.div>

      {/* Premium Stats Grid */}
      <PremiumDashboardStats />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Analytics */}
        <div className="space-y-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <MoodAnalytics />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <PremiumStreakCard />
          </motion.div>
        </div>

        {/* Middle Column - Productivity Score */}
        <div className="space-y-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <PremiumProductivityScore />
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <ProductivityMetrics />
          </motion.div>
        </div>

        {/* Right Column - Activity and Insights */}
        <div className="space-y-8">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <RecentActivity />
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <AIInsights />
          </motion.div>
        </div>
      </div>

      {/* Premium Quick Access Section */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <PremiumCard variant="glass" hover className="overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient" />
          </div>

          <PremiumCardHeader>
            <PremiumCardTitle className="flex items-center space-x-3">
              <div className="p-2 rounded-xl gradient-primary">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span>Quick Access</span>
            </PremiumCardTitle>
          </PremiumCardHeader>

          <PremiumCardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                {
                  icon: BookOpen,
                  label: 'New Journal Entry',
                  gradient: 'from-green-500 to-teal-500'
                },
                {
                  icon: CheckSquare,
                  label: 'Add Task',
                  gradient: 'from-blue-500 to-purple-500'
                },
                {
                  icon: Calendar,
                  label: 'Schedule Event',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: Mail,
                  label: 'Compose Email',
                  gradient: 'from-orange-500 to-red-500'
                },
                {
                  icon: Users,
                  label: 'Add Contact',
                  gradient: 'from-indigo-500 to-blue-500'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PremiumButton
                    variant="glass"
                    size="lg"
                    className="h-24 flex-col group hover:shadow-xl"
                  >
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      className={cn(
                        "p-3 rounded-2xl mb-3 bg-gradient-to-br",
                        item.gradient
                      )}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="text-sm font-medium text-center">
                      {item.label}
                    </span>
                  </PremiumButton>
                </motion.div>
              ))}
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </motion.div>

      {/* Floating Decorative Elements */}
      <AnimatePresence>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`float-${i}`}
            className="fixed w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 pointer-events-none"
            style={{
              left: `${10 + i * 30}%`,
              top: `${20 + (i % 2) * 60}%`
            }}
            initial={{ scale: 0 }}
            animate={{
              scale: [1, 1.5, 1],
              y: [0, -30, 0],
              x: [0, 10, 0]
            }}
            exit={{ scale: 0 }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}