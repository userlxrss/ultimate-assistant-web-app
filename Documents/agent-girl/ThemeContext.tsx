import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { lightTheme, darkTheme, Theme, applyThemeToCSS } from './themes';

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

      // Update HTML element for broader CSS targeting
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);

      // Set data-theme attribute for Apple dark mode system
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

      // Apply CSS custom properties using the refined theme system
      applyThemeToCSS(newTheme);

      // Apply Apple-specific CSS custom properties for dark mode
      if (isDark) {
        const root = document.documentElement;

        // Apple color system
        root.style.setProperty('--apple-bg-primary', '#0D0F13');
        root.style.setProperty('--apple-bg-secondary', '#12151A');
        root.style.setProperty('--apple-bg-tertiary', '#141925');
        root.style.setProperty('--apple-bg-sidebar', '#080C12');
        root.style.setProperty('--apple-bg-input', '#151A26');

        // Apple glassmorphism
        root.style.setProperty('--apple-glass-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--apple-glass-border', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--apple-glass-shadow', 'rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--apple-glass-blur', '20px');

        // Apple typography
        root.style.setProperty('--apple-text-primary', '#EAEAEA');
        root.style.setProperty('--apple-text-secondary', '#A0A4AE');
        root.style.setProperty('--apple-text-tertiary', '#6F7480');
        root.style.setProperty('--apple-text-muted', '#4A5058');

        // Apple accent (muted blue only)
        root.style.setProperty('--apple-accent', '#3A7CFF');
        root.style.setProperty('--apple-accent-hover', '#558CFF');
        root.style.setProperty('--apple-accent-active', '#2968DD');
        root.style.setProperty('--apple-accent-subtle', 'rgba(58, 124, 255, 0.15)');

        // Apple borders and edges
        root.style.setProperty('--apple-border-subtle', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--apple-border-normal', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--apple-border-strong', 'rgba(255, 255, 255, 0.12)');

        // Apple shadows with depth
        root.style.setProperty('--apple-shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.2)');
        root.style.setProperty('--apple-shadow-md', '0 2px 8px rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--apple-shadow-lg', '0 4px 20px rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--apple-shadow-xl', '0 8px 32px rgba(0, 0, 0, 0.4)');

        // Apple interactive states
        root.style.setProperty('--apple-hover-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--apple-active-bg', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--apple-focus-ring', 'rgba(58, 124, 255, 0.3)');

        // Apple transitions
        root.style.setProperty('--apple-transition-fast', '150ms');
        root.style.setProperty('--apple-transition-normal', '250ms');
        root.style.setProperty('--apple-transition-slow', '350ms');
        root.style.setProperty('--apple-transition-easing', 'cubic-bezier(0.4, 0, 0.2, 1)');

      } else {
        // Light mode Apple values (maintain consistency)
        const root = document.documentElement;

        root.style.setProperty('--apple-bg-primary', '#FFFFFF');
        root.style.setProperty('--apple-bg-secondary', '#F8FAFC');
        root.style.setProperty('--apple-bg-tertiary', '#F1F5F9');
        root.style.setProperty('--apple-bg-sidebar', '#FFFFFF');
        root.style.setProperty('--apple-bg-input', '#FFFFFF');

        root.style.setProperty('--apple-glass-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--apple-glass-border', 'rgba(0, 0, 0, 0.08)');
        root.style.setProperty('--apple-glass-shadow', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--apple-glass-blur', '20px');

        root.style.setProperty('--apple-text-primary', '#1A1D23');
        root.style.setProperty('--apple-text-secondary', '#4A5568');
        root.style.setProperty('--apple-text-tertiary', '#718096');
        root.style.setProperty('--apple-text-muted', '#A0AEC0');

        root.style.setProperty('--apple-accent', '#3A7CFF');
        root.style.setProperty('--apple-accent-hover', '#558CFF');
        root.style.setProperty('--apple-accent-active', '#2968DD');
        root.style.setProperty('--apple-accent-subtle', 'rgba(58, 124, 255, 0.1)');

        root.style.setProperty('--apple-border-subtle', 'rgba(0, 0, 0, 0.05)');
        root.style.setProperty('--apple-border-normal', 'rgba(0, 0, 0, 0.08)');
        root.style.setProperty('--apple-border-strong', 'rgba(0, 0, 0, 0.12)');

        root.style.setProperty('--apple-shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)');
        root.style.setProperty('--apple-shadow-md', '0 2px 8px rgba(0, 0, 0, 0.08)');
        root.style.setProperty('--apple-shadow-lg', '0 4px 20px rgba(0, 0, 0, 0.12)');
        root.style.setProperty('--apple-shadow-xl', '0 8px 32px rgba(0, 0, 0, 0.15)');

        root.style.setProperty('--apple-hover-bg', 'rgba(0, 0, 0, 0.04)');
        root.style.setProperty('--apple-active-bg', 'rgba(0, 0, 0, 0.08)');
        root.style.setProperty('--apple-focus-ring', 'rgba(58, 124, 255, 0.25)');

        root.style.setProperty('--apple-transition-fast', '150ms');
        root.style.setProperty('--apple-transition-normal', '250ms');
        root.style.setProperty('--apple-transition-slow', '350ms');
        root.style.setProperty('--apple-transition-easing', 'cubic-bezier(0.4, 0, 0.2, 1)');
      }

      // Update transition durations
      Object.entries(newTheme.transitions).forEach(([key, value]: [string, string]) => {
        root.style.setProperty(`--transition-${key}`, value);
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