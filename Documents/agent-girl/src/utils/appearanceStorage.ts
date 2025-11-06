/**
 * Appearance Storage Utility
 * Re-enabled for production use
 */

// Export FontSize type for components
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export const AppearanceStorage = {
  // Theme management
  getTheme: () => {
    try {
      const stored = localStorage.getItem('user_preferences:theme');
      return stored || 'light';
    } catch (error) {
      console.error('Failed to get theme:', error);
      return 'light';
    }
  },

  setTheme: (theme: 'light' | 'dark' | 'auto') => {
    try {
      localStorage.setItem('user_preferences:theme', theme);
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  },

  // Font size management
  getFontSize: () => {
    try {
      const stored = localStorage.getItem('user_preferences:font_size');
      return stored || 'medium';
    } catch (error) {
      console.error('Failed to get font size:', error);
      return 'medium';
    }
  },

  setFontSize: (fontSize: 'small' | 'medium' | 'large' | 'extra-large') => {
    try {
      localStorage.setItem('user_preferences:font_size', fontSize);
    } catch (error) {
      console.error('Failed to set font size:', error);
    }
  },

  // Alias for setFontSize - used by CleanSettingsPage
  saveFontSize: (fontSize: 'small' | 'medium' | 'large' | 'extra-large') => {
    AppearanceStorage.setFontSize(fontSize);
  },

  // Compact mode management
  getCompactMode: () => {
    try {
      const stored = localStorage.getItem('user_preferences:compact_mode');
      return stored === 'true';
    } catch (error) {
      console.error('Failed to get compact mode:', error);
      return false;
    }
  },

  setCompactMode: (compactMode: boolean) => {
    try {
      localStorage.setItem('user_preferences:compact_mode', compactMode.toString());
    } catch (error) {
      console.error('Failed to set compact mode:', error);
    }
  },

  // Alias for setCompactMode - used by CleanSettingsPage
  saveCompactMode: (compactMode: boolean) => {
    AppearanceStorage.setCompactMode(compactMode);
  },

  // Load all appearance preferences - used by CleanSettingsPage
  loadAllPreferences: async () => {
    try {
      return {
        theme: AppearanceStorage.getTheme(),
        font_size: AppearanceStorage.getFontSize() as FontSize,
        compact_mode: AppearanceStorage.getCompactMode()
      };
    } catch (error) {
      console.error('Failed to load all preferences:', error);
      return {
        theme: 'light',
        font_size: 'medium' as FontSize,
        compact_mode: false
      };
    }
  },

  // Apply appearance preferences - used by CleanSettingsPage
  applyAppearancePreferences: (preferences: any) => {
    try {
      if (preferences.theme) {
        AppearanceStorage.setTheme(preferences.theme);
      }
      if (preferences.fontSize) {
        AppearanceStorage.setFontSize(preferences.fontSize);
      }
      if (typeof preferences.compactMode === 'boolean') {
        AppearanceStorage.setCompactMode(preferences.compactMode);
      }
    } catch (error) {
      console.error('Failed to apply appearance preferences:', error);
    }
  },

  // Clear all appearance settings
  clear: () => {
    try {
      const keys = [
        'user_preferences:theme',
        'user_preferences:font_size',
        'user_preferences:compact_mode'
      ];

      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear appearance storage:', error);
    }
  }
};