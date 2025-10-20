'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <motion.div
      className={cn('animate-spin', sizes[size], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  children?: React.ReactNode
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  children
}) => {
  if (children) {
    return (
      <div className={cn('animate-pulse', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} />
  )
}

interface LoadingCardProps {
  title?: boolean
  lines?: number
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = true,
  lines = 3,
  className
}) => {
  return (
    <div className={cn('glass-card rounded-2xl p-6', className)}>
      {title && (
        <LoadingSkeleton className="h-6 w-1/3 mb-4" />
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="lg" className="text-blue-600 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  )
}