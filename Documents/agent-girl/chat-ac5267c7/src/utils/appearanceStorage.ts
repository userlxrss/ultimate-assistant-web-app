/**
 * Appearance Storage Utility
 * Disabled for emergency recovery
 */

export const AppearanceStorage = {
  // Disabled methods to prevent storage conflicts
  getTheme: () => 'light',
  setTheme: () => {},
  getFontSize: () => 'medium',
  setFontSize: () => {},
  getCompactMode: () => false,
  setCompactMode: () => {},

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