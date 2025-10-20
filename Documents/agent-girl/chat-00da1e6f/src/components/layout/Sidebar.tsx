'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore, useTodayTasks, useUpcomingEvents, useEmails } from '@/store/useAppStore'
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  Mail,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  Search,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: BookOpen,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'Email',
    href: '/email',
    icon: Mail,
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const todayTasks = useTodayTasks()
  const upcomingEvents = useUpcomingEvents()
  const emails = useEmails()

  // Calculate stats
  const tasksDueToday = todayTasks.length
  const upcomingEventsCount = upcomingEvents.length
  const unreadEmailsCount = emails.filter(email => !email.isRead).length

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
        {sidebarCollapsed ? (
          <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        ) : (
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Assistant Hub
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const badge = getBadge(item.name, tasksDueToday, upcomingEventsCount, unreadEmailsCount)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <item.icon
                className={cn(
                  'flex-shrink-0 w-5 h-5',
                  isActive
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                  !sidebarCollapsed && 'mr-3'
                )}
              />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {badge && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        badge.variant === 'primary'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      )}
                    >
                      {badge.count}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats - Only show when not collapsed */}
      {!sidebarCollapsed && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Tasks Today</span>
              <span className="font-medium text-gray-900 dark:text-white">{tasksDueToday}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Upcoming</span>
              <span className="font-medium text-gray-900 dark:text-white">{upcomingEventsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Unread</span>
              <span className="font-medium text-gray-900 dark:text-white">{unreadEmailsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <Link
          href="/settings"
          className={cn(
            'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            pathname === '/settings'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Settings
            className={cn(
              'flex-shrink-0 w-5 h-5',
              pathname === '/settings'
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
              !sidebarCollapsed && 'mr-3'
            )}
          />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )
}

// Helper function to get badge counts
function getBadge(
  itemName: string,
  tasksDueToday: number,
  upcomingEventsCount: number,
  unreadEmailsCount: number
): { count: number; variant: 'primary' | 'secondary' } | null {
  switch (itemName) {
    case 'Tasks':
      return tasksDueToday > 0 ? { count: tasksDueToday, variant: 'primary' as const } : null
    case 'Calendar':
      return upcomingEventsCount > 0 ? { count: upcomingEventsCount, variant: 'secondary' as const } : null
    case 'Email':
      return unreadEmailsCount > 0 ? { count: unreadEmailsCount, variant: 'primary' as const } : null
    default:
      return null
  }
}