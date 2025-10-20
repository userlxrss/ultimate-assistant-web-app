'use client'

import React from 'react'
import { BookOpen, CheckSquare, Calendar, Mail, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const { setCurrentModule } = useAppStore()

  const quickActions = [
    {
      title: 'Write Journal Entry',
      description: 'Record your thoughts and mood',
      icon: BookOpen,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => setCurrentModule('journal'),
    },
    {
      title: 'Create Task',
      description: 'Add a new task to your list',
      icon: CheckSquare,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => setCurrentModule('tasks'),
    },
    {
      title: 'Schedule Event',
      description: 'Add an event to your calendar',
      icon: Calendar,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => setCurrentModule('calendar'),
    },
    {
      title: 'Compose Email',
      description: 'Write and send an email',
      icon: Mail,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => setCurrentModule('email'),
    },
    {
      title: 'Add Contact',
      description: 'Create a new contact',
      icon: Users,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => setCurrentModule('contacts'),
    },
  ]

  return (
    <div className={cn("glass-card p-6 rounded-xl", className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={action.action}
            className="h-auto p-4 glass-card hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${action.color} text-white`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // This could open a universal quick-add modal
            console.log('Open universal quick-add')
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Quick Add Anything
        </Button>
      </div>
    </div>
  )
}