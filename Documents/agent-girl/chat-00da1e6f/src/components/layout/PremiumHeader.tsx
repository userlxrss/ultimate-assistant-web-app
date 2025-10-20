'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Search, Settings, User, LogOut, Menu, Sparkles, Zap } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatRelativeTime } from '@/lib/utils'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { motion, AnimatePresence } from 'framer-motion'

interface PremiumHeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function PremiumHeader({ onMenuClick, className }: PremiumHeaderProps) {
  const { user, toggleSidebar, syncStatus } = useAppStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative glass-premium border-b border-white/10 dark:border-white/5",
        className
      )}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-pattern-grid opacity-5" />

      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient" />

      <div className="relative flex items-center justify-between px-8 py-6">
        {/* Left side - Logo and Welcome */}
        <div className="flex items-center space-x-6">
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={onMenuClick || toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </PremiumButton>

          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-2xl gradient-primary"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>

            <div>
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-gradient-primary"
              >
                {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Assistant Hub'}
              </motion.h1>
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 font-medium"
              >
                {formatRelativeTime(currentTime)}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right side - Search, notifications, user menu */}
        <div className="flex items-center space-x-4">
          {/* Sync Status with Animation */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden md:flex items-center space-x-3 px-4 py-2 glass-premium rounded-2xl"
          >
            <div className="flex items-center space-x-2">
              {syncStatus.map((status, index) => (
                <motion.div
                  key={status.service}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    status.status === 'synced' && "bg-green-500 animate-pulse",
                    status.status === 'syncing' && "bg-yellow-500 animate-bounce",
                    status.status === 'error' && "bg-red-500",
                    status.status === 'disabled' && "bg-gray-400"
                  )}
                  title={`${status.service}: ${status.status}`}
                />
              ))}
            </div>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              All Synced
            </motion.span>
          </motion.div>

          {/* Premium Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Search everything..."
                  className="w-full px-4 py-3 pl-12 glass-premium rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PremiumButton
                  variant="glass"
                  size="sm"
                  onClick={() => setSearchOpen(true)}
                  glow
                >
                  <Search className="w-5 h-5" />
                </PremiumButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Notifications */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <PremiumButton variant="glass" size="sm" glow>
              <Bell className="w-5 h-5" />
            </PremiumButton>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
            />
          </motion.div>

          {/* Premium Settings */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <PremiumButton variant="glass" size="sm">
              <Settings className="w-5 h-5" />
            </PremiumButton>
          </motion.div>

          {/* Premium User Menu */}
          <AnimatePresence>
            {user && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center space-x-4 pl-6 border-l border-white/10"
              >
                <div className="text-right hidden sm:block">
                  <motion.p
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-sm font-bold text-gray-900 dark:text-white"
                  >
                    {user.name}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {user.email}
                  </motion.p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div className="w-12 h-12 rounded-2xl gradient-primary p-0.5">
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-gradient-primary text-sm font-black">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Status Indicator */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {!user && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <PremiumButton variant="gradient" size="md" glow>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </PremiumButton>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}