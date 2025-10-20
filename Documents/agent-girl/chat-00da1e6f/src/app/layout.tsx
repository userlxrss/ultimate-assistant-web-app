import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { PremiumSidebar } from '@/components/layout/PremiumSidebar'
import { PremiumHeader } from '@/components/layout/PremiumHeader'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Assistant Hub - Premium Productivity Platform',
  description: 'Transform your productivity with our AI-powered personal assistant hub. Journal, tasks, calendar, email, and contacts seamlessly integrated for ultimate efficiency.',
  keywords: ['productivity', 'AI assistant', 'premium dashboard', 'journal', 'tasks', 'calendar', 'email', 'contacts', 'automation'],
  authors: [{ name: 'Assistant Hub Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#667eea' },
    { media: '(prefers-color-scheme: dark)', color: '#764ba2' }
  ],
  openGraph: {
    title: 'Assistant Hub - Premium Productivity Platform',
    description: 'Transform your productivity with AI-powered insights and beautiful design.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assistant Hub - Premium Productivity Platform',
    description: 'Transform your productivity with AI-powered insights and beautiful design.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={cn(
        inter.className,
        "min-h-screen antialiased font-inter",
        "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50",
        "dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30",
        "selection:bg-blue-100 dark:selection:bg-blue-900/30"
      )}>
        <ThemeProvider>
          <QueryProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Premium Sidebar */}
              <PremiumSidebar className="hidden lg:block" />

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Premium Header */}
                <PremiumHeader />

                {/* Page Content with premium background */}
                <main className="flex-1 overflow-y-auto relative">
                  {/* Animated background overlay */}
                  <div className="fixed inset-0 bg-pattern-dots opacity-5 pointer-events-none" />

                  {/* Gradient overlays for depth */}
                  <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                  {/* Content */}
                  <div className="relative z-10">
                    {children}
                  </div>
                </main>
              </div>
            </div>

            {/* Premium Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                iconTheme: {
                  primary: '#667eea',
                  secondary: '#ffffff',
                },
                success: {
                  style: {
                    background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.9), rgba(56, 249, 215, 0.9))',
                    color: '#ffffff',
                  },
                },
                error: {
                  style: {
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                    color: '#ffffff',
                  },
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}