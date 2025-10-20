import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow, addDays, subDays, startOfWeek, endOfWeek } from "date-fns"
import type { Task, CalendarEvent, EmailAddress, Contact, JournalEntry, HeatmapData, MoodChartData } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: Date, formatStr: string = "PPP"): string {
  return format(date, formatStr)
}

export function formatRelativeTime(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`
  }
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatCountdown(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff < 0) return "Started"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''}`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 })     // Sunday
  }
}

export function getDayOfWeek(date: Date): string {
  return format(date, "EEEE")
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

// Mood utilities
export function getMoodEmoji(mood: number): string {
  if (mood >= 9) return "😊"
  if (mood >= 8) return "🙂"
  if (mood >= 7) return "😌"
  if (mood >= 6) return "😐"
  if (mood >= 5) return "😕"
  if (mood >= 4) return "😔"
  if (mood >= 3) return "😟"
  if (mood >= 2) return "😢"
  return "😭"
}

export function getMoodColor(mood: number): string {
  if (mood >= 8) return "text-green-500"
  if (mood >= 6) return "text-blue-500"
  if (mood >= 4) return "text-yellow-500"
  return "text-red-500"
}

export function getMoodBgColor(mood: number): string {
  if (mood >= 8) return "bg-green-100 dark:bg-green-900/20"
  if (mood >= 6) return "bg-blue-100 dark:bg-blue-900/20"
  if (mood >= 4) return "bg-yellow-100 dark:bg-yellow-900/20"
  return "bg-red-100 dark:bg-red-900/20"
}

// Task utilities
export function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'urgent': return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20"
    case 'high': return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20"
    case 'medium': return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20"
    case 'low': return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20"
    default: return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20"
  }
}

export function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'completed': return "text-green-600 dark:text-green-400"
    case 'in_progress': return "text-blue-600 dark:text-blue-400"
    case 'cancelled': return "text-red-600 dark:text-red-400"
    default: return "text-gray-600 dark:text-gray-400"
  }
}

export function isOverdue(dueDate?: Date): boolean {
  if (!dueDate) return false
  return dueDate < new Date()
}

export function isDueToday(dueDate?: Date): boolean {
  if (!dueDate) return false
  return isToday(dueDate)
}

export function isDueSoon(dueDate?: Date, days: number = 3): boolean {
  if (!dueDate) return false
  const now = new Date()
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= days
}

// Calendar utilities
export function getEventColor(type: CalendarEvent['type']): string {
  switch (type) {
    case 'meeting': return "bg-blue-500"
    case 'focus_time': return "bg-green-500"
    case 'personal': return "bg-purple-500"
    case 'break': return "bg-yellow-500"
    default: return "bg-gray-500"
  }
}

export function getEventDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // minutes
}

export function formatEventDuration(startTime: Date, endTime: Date): string {
  const duration = getEventDuration(startTime, endTime)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }
  return `${minutes}m`
}

export function hasTimeConflict(event1: CalendarEvent, event2: CalendarEvent): boolean {
  return (
    event1.startTime < event2.endTime &&
    event1.endTime > event2.startTime
  )
}

// Email utilities
export function formatEmailList(emails: EmailAddress[]): string {
  return emails.map(e => e.name || e.email).join(", ")
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function getContactInitials(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return getInitials(`${contact.firstName} ${contact.lastName}`)
}

// Analytics utilities
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function calculateTrend(current: number, previous: number): {
  value: number
  direction: 'up' | 'down' | 'same'
  percentage: number
} {
  if (previous === 0) {
    return {
      value: current,
      direction: current > 0 ? 'up' : 'same',
      percentage: current > 0 ? 100 : 0
    }
  }

  const change = current - previous
  const percentage = Math.round(Math.abs((change / previous) * 100))

  return {
    value: change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    percentage
  }
}

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  // Sort dates in descending order (newest first)
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const date of sortedDates) {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    if (checkDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate = addDays(currentDate, -1)
    } else if (checkDate.getTime() < currentDate.getTime()) {
      break
    }
  }

  return streak
}

// Chart utilities
export function generateHeatmapData(data: Array<{ date: Date; value: number }>): HeatmapData[] {
  const today = new Date()
  const startDate = addDays(today, -59) // 60 days including today

  const heatmapData: HeatmapData[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= today) {
    const dateStr = format(currentDate, "yyyy-MM-dd")
    const dayData = data.find(d => format(d.date, "yyyy-MM-dd") === dateStr)

    heatmapData.push({
      date: dateStr,
      value: dayData?.value || 0,
      intensity: dayData?.value || 0,
      label: format(currentDate, "MMM d")
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return heatmapData
}

export function generateMoodChartData(entries: JournalEntry[]): MoodChartData[] {
  return entries
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(entry => ({
      date: format(entry.date, "MMM dd"),
      mood: entry.mood,
      tasksCompleted: 0, // This would come from task data
      value: entry.mood
    }))
}

// Local storage utilities
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error)
  }
}

export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error)
  }
}

// Theme utilities
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  setLocalStorageItem('theme', theme)
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function isApiError(error: unknown): error is { message: string; status?: number } {
  return typeof error === 'object' && error !== null && 'message' in error
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// ID generation
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// File utilities
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2)
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  return imageExtensions.includes(getFileExtension(filename).toLowerCase())
}

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Array utilities
export function groupBy<T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export function uniqueBy<T, K extends keyof any>(array: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>()
  return array.filter(item => {
    const itemKey = key(item)
    if (seen.has(itemKey)) {
      return false
    }
    seen.add(itemKey)
    return true
  })
}

// Sort utilities
export function sortByDate<T extends { date: Date }>(array: T[], direction: 'asc' | 'desc' = 'desc'): T[] {
  return [...array].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime()
    return direction === 'desc' ? -diff : diff
  })
}

export function sortByPriority<T extends { priority: Task['priority'] }>(array: T[]): T[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  return [...array].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

// Re-export date-fns functions for convenience
export { addDays, subDays }