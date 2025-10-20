'use client'

import React from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Brain, TrendingUp, Calendar } from 'lucide-react'
import { cn, generateHeatmapData, generateMoodChartData, getMoodEmoji, getMoodColor } from '@/lib/utils'
import { useJournalEntries, useDashboardData } from '@/store/useAppStore'
import type { JournalEntry } from '@/types'

interface MoodAnalyticsProps {
  className?: string
}

export function MoodAnalytics({ className }: MoodAnalyticsProps) {
  const journalEntries = useJournalEntries()
  const dashboardData = useDashboardData()

  if (!dashboardData) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="loading-skeleton h-80 rounded-xl" />
          <div className="loading-skeleton h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const { moodAnalytics } = dashboardData

  // Generate chart data
  const moodChartData = generateMoodChartData(journalEntries)
  const heatmapData = generateHeatmapData(
    journalEntries.map((entry: JournalEntry) => ({ date: entry.date, value: entry.mood }))
  )

  // Prepare pie chart data for mood distribution
  const moodDistribution = [
    { name: 'Excellent (8-10)', value: journalEntries.filter((e: JournalEntry) => e.mood >= 8).length, color: '#10b981' },
    { name: 'Good (6-7)', value: journalEntries.filter((e: JournalEntry) => e.mood >= 6 && e.mood < 8).length, color: '#3b82f6' },
    { name: 'Neutral (4-5)', value: journalEntries.filter((e: JournalEntry) => e.mood >= 4 && e.mood < 6).length, color: '#eab308' },
    { name: 'Low (2-3)', value: journalEntries.filter((e: JournalEntry) => e.mood >= 2 && e.mood < 4).length, color: '#f97316' },
    { name: 'Poor (0-1)', value: journalEntries.filter((e: JournalEntry) => e.mood < 2).length, color: '#ef4444' }
  ].filter(item => item.value > 0)

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Mood Analytics
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Brain className="w-4 h-4" />
          <span>Track your emotional patterns</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trend Chart */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Mood Trend
          </h3>
          <div className="h-64">
            {moodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No mood data yet</p>
                  <p className="text-sm">Start journaling to see your mood trends</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Mood Distribution
          </h3>
          <div className="h-64">
            {moodDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No mood distribution yet</p>
                  <p className="text-sm">Journal entries will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Average Mood</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {moodAnalytics.averageMood.toFixed(1)}
            </span>
            <span className="text-lg">{getMoodEmoji(Math.round(moodAnalytics.averageMood))}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Current Streak</span>
            <Brain className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {moodAnalytics.currentStreak}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">days</span>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Total Entries</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {journalEntries.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}