'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  description,
  children,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormRowProps {
  children: React.ReactNode
  className?: string
}

export const FormRow: React.FC<FormRowProps> = ({ children, className }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
    {children}
  </div>
)

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className
}) => (
  <div className={cn('space-y-4', className)}>
    {title && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    )}
    {children}
  </div>
)