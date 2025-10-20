'use client'

import React from 'react'
import { Bell, Search, Settings, User, LogOut, Menu } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { user, toggleSidebar, syncStatus } = useAppStore()

  return (
    <header
      className={cn(
        "flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {/* Left side - Menu button and title */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick || toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome to Assistant Hub'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatRelativeTime(new Date())}
          </p>
        </div>
      </div>

      {/* Right side - Search, notifications, user menu */}
      <div className="flex items-center space-x-4">
        {/* Sync Status Indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-1">
            {syncStatus.map((status) => (
              <div
                key={status.service}
                className={cn(
                  "w-2 h-2 rounded-full",
                  status.status === 'synced' && "bg-green-500",
                  status.status === 'syncing' && "bg-yellow-500 animate-pulse",
                  status.status === 'error' && "bg-red-500",
                  status.status === 'disabled' && "bg-gray-400"
                )}
                title={`${status.service}: ${status.status}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Sync
          </span>
        </div>

        {/* Search Button */}
        <Button variant="ghost" size="sm">
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline ml-2">Search</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        {user ? (
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="default" size="sm">
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}