// ============================================
// UNIFIED THEME MANAGER - SINGLE SOURCE OF TRUTH
// ============================================

class UnifiedThemeManager {
  constructor() {
    this.THEME_KEY = 'app-theme'; // Single key for all theme storage
    this.currentTheme = this.getStoredTheme();
    this.init();
  }

  // Get theme from localStorage
  getStoredTheme() {
    const stored = localStorage.getItem(this.THEME_KEY);
    const fallback = localStorage.getItem('theme'); // Check old key for migration
    const theme = stored || fallback || 'light';

    // Migrate old theme key to new unified key
    if (fallback && !stored) {
      localStorage.setItem(this.THEME_KEY, theme);
      localStorage.removeItem('theme');
    }

    return theme === 'dark' ? 'dark' : 'light';
  }

  // Initialize theme on page load
  init() {
    // Apply theme immediately
    this.applyTheme(this.currentTheme);

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === this.THEME_KEY || e.key === 'theme') {
        const newTheme = e.newValue === 'dark' ? 'dark' : 'light';
        this.applyTheme(newTheme);
      }
    });

    // Log initialization
    console.log(`🎨 UnifiedThemeManager initialized with theme: ${this.currentTheme}`);
  }

  // Apply theme to DOM
  applyTheme(theme) {
    console.log(`🎨 Applying theme: ${theme}`);
    this.currentTheme = theme;

    // Force theme removal first
    document.documentElement.classList.remove('dark', 'light');
    document.body.classList.remove('dark', 'light');
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');

    // Apply new theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
      console.log('🌙 Dark theme applied - DOM updated');
    } else {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
      console.log('☀️ Light theme applied - DOM updated');
    }

    // Save to both old and new keys for compatibility
    localStorage.setItem(this.THEME_KEY, theme);
    localStorage.setItem('theme', theme);

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('global-theme-changed', {
      detail: { theme }
    }));

    // Update theme buttons
    this.updateThemeButtons();
  }

  // Toggle theme
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    console.log(`🔄 Theme toggled to ${newTheme}`);
  }

  // Set specific theme
  setTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      this.applyTheme(theme);
      console.log(`✅ Theme set to ${theme}`);
    } else {
      console.warn(`⚠️ Invalid theme: ${theme}. Use 'dark' or 'light'`);
    }
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Check if dark mode is active
  isDark() {
    return this.currentTheme === 'dark';
  }

  // Update theme button states
  updateThemeButtons() {
    // Update all theme selector buttons
    document.querySelectorAll('[data-theme-option]').forEach(btn => {
      const btnTheme = btn.getAttribute('data-theme-option');
      if (btnTheme === this.currentTheme) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Update toggle buttons
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      if (this.currentTheme === 'dark') {
        btn.classList.add('dark-active');
        btn.setAttribute('aria-label', 'Switch to light mode');
      } else {
        btn.classList.remove('dark-active');
        btn.setAttribute('aria-label', 'Switch to dark mode');
      }
    });

    console.log(`🔄 Theme buttons updated for ${this.currentTheme} mode`);
  }

  // Force theme refresh (useful for debugging)
  refreshTheme() {
    const currentTheme = this.getCurrentTheme();
    console.log(`🔄 Refreshing theme: ${currentTheme}`);
    this.applyTheme(currentTheme);
  }

  // Get theme CSS variables
  getThemeVariables() {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
      bgPrimary: rootStyles.getPropertyValue('--bg-primary').trim(),
      bgSecondary: rootStyles.getPropertyValue('--bg-secondary').trim(),
      bgCard: rootStyles.getPropertyValue('--bg-card').trim(),
      textPrimary: rootStyles.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyles.getPropertyValue('--text-secondary').trim(),
      borderPrimary: rootStyles.getPropertyValue('--border-primary').trim(),
    };
  }

  // Debug current state
  debug() {
    console.group('🎨 Theme Manager Debug Info');
    console.log('Current Theme:', this.currentTheme);
    console.log('HTML Classes:', document.documentElement.className);
    console.log('Body Classes:', document.body.className);
    console.log('HTML data-theme:', document.documentElement.getAttribute('data-theme'));
    console.log('Body data-theme:', document.body.getAttribute('data-theme'));
    console.log('Theme Variables:', this.getThemeVariables());
    console.log('localStorage theme:', localStorage.getItem(this.THEME_KEY));
    console.log('localStorage old theme:', localStorage.getItem('theme'));
    console.groupEnd();
  }
}

// Initialize global theme manager
window.themeManager = new UnifiedThemeManager();

// Expose methods globally for easy access
window.setTheme = (theme) => window.themeManager.setTheme(theme);
window.toggleTheme = () => window.themeManager.toggleTheme();
window.getCurrentTheme = () => window.themeManager.getCurrentTheme();
window.isDarkTheme = () => window.themeManager.isDark();
window.refreshTheme = () => window.themeManager.refreshTheme();
window.debugTheme = () => window.themeManager.debug();

// Auto-fix theme on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager.refreshTheme();
    console.log('🎨 Theme refreshed on DOM ready');
  });
} else {
  // DOM already loaded
  window.themeManager.refreshTheme();
  console.log('🎨 Theme refreshed (DOM already loaded)');
}

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    window.themeManager.refreshTheme();
    console.log('🎨 Theme refreshed on tab focus');
  }
});

console.log('🎨 Unified Theme Manager loaded successfully');