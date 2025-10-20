'use client'

import React from 'react'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Target, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/store/useAppStore'
import type { Insight } from '@/types'

interface AIInsightsProps {
  className?: string
}

const getInsightIcon = (type: Insight['type']) => {
  switch (type) {
    case 'pattern':
      return <Brain className="w-5 h-5 text-purple-500" />
    case 'recommendation':
      return <Lightbulb className="w-5 h-5 text-yellow-500" />
    case 'achievement':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-red-500" />
    default:
      return <Target className="w-5 h-5 text-gray-500" />
  }
}

const getInsightColor = (type: Insight['type']) => {
  switch (type) {
    case 'pattern':
      return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
    case 'recommendation':
      return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
    case 'achievement':
      return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
    case 'warning':
      return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
    default:
      return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20'
  }
}

const getPriorityColor = (priority: Insight['priority']) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
    case 'low':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
  }
}

export function AIInsights({ className }: AIInsightsProps) {
  const dashboardData = useDashboardData()

  if (!dashboardData) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="loading-skeleton h-48 rounded-xl" />
        <div className="loading-skeleton h-48 rounded-xl" />
      </div>
    )
  }

  const { insights } = dashboardData

  // Filter insights by priority
  const highPriorityInsights = insights.filter((insight: Insight) => insight.priority === 'high')
  const otherInsights = insights.filter((insight: Insight) => insight.priority !== 'high')

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Insights
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Brain className="w-4 h-4" />
          <span>Personalized recommendations</span>
        </div>
      </div>

      {/* High Priority Insights */}
      {highPriorityInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Priority Actions
          </h3>
          {highPriorityInsights.map((insight: Insight) => (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-lg border transition-all hover:shadow-md",
                getInsightColor(insight.type)
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {insight.title}
                    </h4>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        getPriorityColor(insight.priority)
                      )}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {insight.description}
                  </p>
                  {insight.actionable && (
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                      Take Action →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other Insights */}
      {otherInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Insights
          </h3>
          <div className="grid gap-3">
            {otherInsights.map((insight: Insight) => (
              <div
                key={insight.id}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md",
                  getInsightColor(insight.type)
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {insights.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No insights available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
            Start using your journal, tasks, and calendar to get personalized AI insights.
          </p>
        </div>
      )}

      {/* AI Status */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">AI Analysis Active</span> — Your data is being analyzed for patterns and opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}