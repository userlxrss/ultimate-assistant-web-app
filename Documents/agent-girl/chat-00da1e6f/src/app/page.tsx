'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDummyData } from '@/hooks/useDummyData'
import { useAppStore } from '@/store/useAppStore'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAppStore()

  // Load dummy data
  useDummyData()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard')
      } else {
        // For demo purposes, we'll create a mock user and go to dashboard
        // In a real app, this would redirect to login
        const mockUser = {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            timezone: 'America/New_York',
            notifications: {
              email: true,
              push: true,
              dailyDigest: true,
              weeklyReport: true,
              journalReminder: true,
              taskReminder: true,
              calendarSummary: true,
            },
            privacy: {
              shareAnalytics: false,
              shareInsights: false,
              dataRetention: 365,
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        useAppStore.getState().setUser(mockUser)
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg mx-auto mb-4" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assistant Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Loading your personal productivity dashboard...
        </p>
      </div>
    </div>
  )
}