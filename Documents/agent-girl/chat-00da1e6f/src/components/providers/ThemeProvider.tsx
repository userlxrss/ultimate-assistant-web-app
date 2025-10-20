'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useThemeStore } from '@/store/useThemeStore'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme: storedTheme, setTheme: setStoredTheme } = useThemeStore()
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')
  const [theme, setTheme] = useState<Theme>(storedTheme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let systemTheme: 'dark' | 'light' = 'light'
    if (theme === 'system') {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }

    const finalTheme = theme === 'system' ? systemTheme : theme
    root.classList.add(finalTheme)
    setResolvedTheme(finalTheme)

    // Update glassmorphism styles based on theme
    root.style.setProperty('--glass-bg', finalTheme === 'dark'
      ? 'rgba(0, 0, 0, 0.3)'
      : 'rgba(255, 255, 255, 0.1)'
    )
    root.style.setProperty('--glass-border', finalTheme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.2)'
    )
  }, [theme])

  useEffect(() => {
    setTheme(storedTheme)
  }, [storedTheme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    setStoredTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}