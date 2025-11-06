import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { lightTheme, darkTheme, Theme } from './themes';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light'
}) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved theme preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    }
    return defaultTheme === 'dark';
  });

  const [theme, setThemeState] = useState(isDark ? darkTheme : lightTheme);

  useEffect(() => {
    const newTheme = isDark ? darkTheme : lightTheme;
    setThemeState(newTheme);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');

      // Update document body class for CSS transitions
      document.body.classList.toggle('dark', isDark);
      document.body.classList.toggle('light', !isDark);

      // Update CSS custom properties
      const root = document.documentElement;
      Object.entries(newTheme.colors).forEach(([key, value]: [string, string]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Update transition durations
      Object.entries(newTheme.transitions).forEach(([key, value]: [string, string]) => {
        root.style.setProperty(`--transition-${key}`, value);
      });

      // Update border radius values
      Object.entries(newTheme.radii).forEach(([key, value]: [string, string]) => {
        root.style.setProperty(`--radius-${key}`, value);
      });
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (themeName: 'light' | 'dark') => {
    setIsDark(themeName === 'dark');
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};