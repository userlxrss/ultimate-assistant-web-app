'use client'

import React from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Target, TrendingUp, Clock, Mail, Calendar, CheckCircle } from 'lucide-react'
import { cn, calculatePercentage } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface ProductivityMetricsProps {
  className?: string
}

export function ProductivityMetrics({ className }: ProductivityMetricsProps) {
  const { tasks, dashboardData } = useAppStore()

  if (!dashboardData) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="loading-skeleton h-80 rounded-xl" />
      </div>
    )
  }

  const { taskAnalytics } = dashboardData

  // Generate task completion data for the last 30 days
  const generateTaskData = () => {
    const data = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayStart = new Date(date)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const completedTasks = tasks.filter(task =>
        task.status === 'completed' &&
        task.completedAt &&
        task.completedAt >= dayStart &&
        task.completedAt <= dayEnd
      ).length

      const createdTasks = tasks.filter(task =>
        task.createdAt >= dayStart && task.createdAt <= dayEnd
      ).length

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: completedTasks,
        created: createdTasks,
      })
    }

    return data
  }

  const taskData = generateTaskData()

  // Task priority distribution
  const priorityData = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#eab308' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#22c55e' },
  ]

  // Productivity score components
  const scoreComponents = [
    {
      label: 'Task Completion',
      value: taskAnalytics.completionRate,
      icon: CheckCircle,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Journal Consistency',
      value: 85, // This would come from actual journal data
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Calendar Adherence',
      value: 92, // This would come from calendar data
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Email Responsiveness',
      value: 78, // This would come from email data
      icon: Mail,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Task Performance Chart */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              30-Day Task Performance
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={taskData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              interval={4}
            />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="created" fill="#9ca3af" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Priority Distribution */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Task Priority Distribution
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload
                    return (
                      <div className="glass-card p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {data.name}
                        </p>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                          {data.value} tasks
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {priorityData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Score Breakdown */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Productivity Score
            </h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {taskAnalytics.productivityScore}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {scoreComponents.map((component, index) => (
              <div key={component.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <component.icon className={cn("w-4 h-4", component.color)} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {component.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {component.value}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all duration-500", component.color.replace('text-', 'bg-'))}
                    style={{ width: `${component.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Overall Performance
              </span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. completion time: {taskAnalytics.averageCompletionTime.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {taskAnalytics.totalTasks}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</div>
        </div>

        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {taskAnalytics.completedTasks}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
        </div>

        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {taskAnalytics.overdueTasks}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
        </div>

        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {taskAnalytics.completionRate}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</div>
        </div>
      </div>
    </div>
  )
}