import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppearanceStorage } from '../utils/appearanceStorage';

interface ThemeContextType {
  theme: 'light' | 'dark';
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
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    // Check for saved preference in localStorage first for immediate load
    const savedTheme = localStorage.getItem('user_preferences:theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'light'; // default
  });

  // Apply theme changes to DOM and storage
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);

    // Apply to DOM immediately
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to storage (async but don't wait for it)
    AppearanceStorage.saveTheme(newTheme).catch(error => {
      console.error('Failed to save theme:', error);
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Initialize theme on mount and apply to DOM
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Load saved theme using AppearanceStorage
        const savedTheme = await AppearanceStorage.loadTheme();
        setThemeState(savedTheme);

        // Apply theme to document element
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        // Keep current state as fallback
      }
    };

    initializeTheme();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};