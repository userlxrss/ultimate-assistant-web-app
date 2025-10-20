'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  Zap,
  TrendingUp,
  Target,
  BarChart3
} from 'lucide-react'

const premiumNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-purple-500',
    description: 'Overview & Insights'
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: BookOpen,
    gradient: 'from-green-500 to-teal-500',
    description: 'Personal Thoughts'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    gradient: 'from-orange-500 to-red-500',
    description: 'Manage To-Dos'
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    gradient: 'from-purple-500 to-pink-500',
    description: 'Schedule & Events'
  },
  {
    name: 'Email',
    href: '/email',
    icon: Mail,
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Messages'
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
    gradient: 'from-indigo-500 to-purple-500',
    description: 'Network'
  },
]

interface PremiumSidebarProps {
  className?: string
}

export function PremiumSidebar({ className }: PremiumSidebarProps) {
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
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        'relative glass-premium border-r border-white/10 dark:border-white/5 transition-all duration-500 group',
        sidebarCollapsed ? 'w-20' : 'w-80',
        className
      )}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-pattern-dots opacity-5" />

      {/* Premium Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-4 top-8 w-8 h-8 glass-premium rounded-full border border-white/20 shadow-lg z-50 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </motion.div>
      </motion.button>

      {/* Premium Logo */}
      <div className="relative flex items-center justify-center h-24 border-b border-white/10">
        <AnimatePresence mode="wait">
          {sidebarCollapsed ? (
            <motion.div
              key="collapsed"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-2xl gradient-primary animate-float"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-3 rounded-2xl gradient-primary"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black text-gradient-primary">
                  Assistant Hub
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Premium Productivity
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
        {premiumNavigation.map((item, index) => {
          const isActive = pathname === item.href
          const badge = getPremiumBadge(item.name, tasksDueToday, upcomingEventsCount, unreadEmailsCount)

          return (
            <motion.div
              key={item.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center px-4 py-4 rounded-2xl transition-all duration-300 overflow-hidden',
                  isActive
                    ? 'gradient-primary text-white shadow-lg scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:glass-premium hover:scale-102',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                {/* Animated Background */}
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${item.gradient.split(' ')[1]}20 0%, ${item.gradient.split(' ')[3]}20 100%)`
                    }}
                  />
                )}

                <motion.div
                  className={cn(
                    'relative z-10 flex items-center',
                    sidebarCollapsed ? 'justify-center w-full' : 'w-full'
                  )}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Icon with gradient background */}
                  <div className={cn(
                    'p-2 rounded-xl transition-all duration-300',
                    isActive
                      ? 'bg-white/20'
                      : `bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:shadow-lg`
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>

                  {/* Text Content */}
                  {!sidebarCollapsed && (
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <motion.h3
                          className={cn(
                            'font-bold text-sm tracking-tight',
                            isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                          )}
                        >
                          {item.name}
                        </motion.h3>
                        {badge && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-bold',
                              badge.variant === 'primary'
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-500 text-white'
                            )}
                          >
                            {badge.count}
                          </motion.div>
                        )}
                      </div>
                      <motion.p
                        className={cn(
                          'text-xs mt-0.5',
                          isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {item.description}
                      </motion.p>
                    </div>
                  )}
                </motion.div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Premium Stats Section */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-6 border-t border-white/10"
          >
            <div className="glass-premium rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Quick Stats
                </h3>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black text-gradient-primary">
                    {tasksDueToday}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tasks
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black text-gradient-secondary">
                    {upcomingEventsCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Events
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black text-gradient-success">
                    {unreadEmailsCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Emails
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Settings */}
      <div className="px-4 py-4 border-t border-white/10">
        <Link
          href="/settings"
          className={cn(
            'group flex items-center px-4 py-3 rounded-2xl transition-all duration-300',
            pathname === '/settings'
              ? 'gradient-primary text-white shadow-lg'
              : 'text-gray-700 dark:text-gray-300 hover:glass-premium',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && (
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="ml-3 font-bold"
            >
              Settings
            </motion.span>
          )}
        </Link>
      </div>
    </motion.div>
  )
}

// Helper function to get premium badge counts
function getPremiumBadge(
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