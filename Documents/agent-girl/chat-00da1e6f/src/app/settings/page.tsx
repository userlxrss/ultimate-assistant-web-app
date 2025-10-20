'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, Globe, Database, HelpCircle, ChevronRight, Moon, Sun, Monitor } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppStore, useAppActions } from '@/store/useAppStore'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, theme, sidebarCollapsed } = useAppStore()
  const { setUser, setTheme, setSidebarCollapsed } = useAppActions()
  const { theme: currentTheme, setTheme: setAppTheme } = useTheme()

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64">
          <Card variant="glass">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'appearance' && <AppearanceSettings theme={theme} setTheme={setTheme} currentTheme={currentTheme} setAppTheme={setAppTheme} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'data' && <DataSettings />}
          {activeTab === 'help' && <HelpSettings />}
        </div>
      </div>
    </div>
  )
}

// Profile Settings Component
function ProfileSettings({ user, setUser }: { user: any; setUser: (user: any) => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  })

  const handleSave = () => {
    setUser({
      ...user,
      ...formData,
      updatedAt: new Date()
    })
  }

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-medium">
                {formData.name.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <Button variant="outline">Change Avatar</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <Input
                value={formData.name.split(' ')[0] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: e.target.value + ' ' + (prev.name.split(' ')[1] || '')
                }))}
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <Input
                value={formData.name.split(' ')[1] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: (prev.name.split(' ')[0] || '') + ' ' + e.target.value
                }))}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@example.com"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Notification Settings Component
function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    dailyDigest: true,
    weeklyReport: false,
    journalReminder: true,
    taskReminder: true,
    calendarSummary: true
  })

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive email updates about your activity</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.email ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.email ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications in your browser</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.push ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.push ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Daily Digest</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get a daily summary of your activity</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, dailyDigest: !prev.dailyDigest }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.dailyDigest ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.dailyDigest ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Weekly Report</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly productivity reports</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, weeklyReport: !prev.weeklyReport }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.weeklyReport ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.weeklyReport ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Journal Reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get reminded to write in your journal</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, journalReminder: !prev.journalReminder }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.journalReminder ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.journalReminder ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Task Reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about upcoming task deadlines</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, taskReminder: !prev.taskReminder }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.taskReminder ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.taskReminder ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Calendar Summary</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily summary of your calendar events</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, calendarSummary: !prev.calendarSummary }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications.calendarSummary ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications.calendarSummary ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Appearance Settings Component
function AppearanceSettings({ theme, setTheme, currentTheme, setAppTheme }: any) {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setAppTheme('light')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                currentTheme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
            </button>

            <button
              onClick={() => setAppTheme('dark')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                currentTheme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <Moon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
            </button>

            <button
              onClick={() => setAppTheme('system')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                currentTheme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <Monitor className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">System</p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Sidebar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Collapse Sidebar</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Minimize the sidebar to save space</p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                sidebarCollapsed ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  sidebarCollapsed ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Security Settings Component
function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your password regularly</p>
            </div>
            <Button variant="outline">Change</Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Active Sessions</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your active sessions</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Integration Settings Component
function IntegrationSettings() {
  const [integrations, setIntegrations] = useState({
    google: { connected: false, services: ['calendar', 'gmail', 'contacts'] },
    motion: { connected: false, services: ['tasks'] },
    slack: { connected: false, services: ['notifications'] }
  })

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(integrations).map(([service, config]) => (
            <div key={service} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{service}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {config.connected ? `Connected to ${config.services.join(', ')}` : 'Not connected'}
                </p>
              </div>
              <Button variant={config.connected ? 'destructive' : 'default'}>
                {config.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Data Settings Component
function DataSettings() {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download all your data in JSON format</p>
            </div>
            <Button variant="outline">Export</Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Import data from another application</p>
            </div>
            <Button variant="outline">Import</Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-red-500 dark:text-red-400">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Help Settings Component
function HelpSettings() {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Documentation</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse our comprehensive documentation</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Video Tutorials</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to use the platform with video guides</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Contact Support</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get help from our support team</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Community Forum</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Join our community of users</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
              <span className="text-gray-900 dark:text-white">October 21, 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function for class names
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}