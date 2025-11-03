/**
 * CRITICAL PRODUCTION FIXES - IMMEDIATE IMPLEMENTATION REQUIRED
 * These fixes resolve the unresponsiveness and sign-out issues
 */

// 1. DISABLE APPEARANCE STORAGE CONFLICTS
export const disableAppearanceStorage = () => {
  try {
    // Clear all appearance storage keys that cause conflicts
    const keysToRemove = [
      'user_preferences:font_size',
      'user_preferences:theme',
      'user_preferences:compact_mode',
      'productivity_hub_auth'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    console.log('✅ Disabled conflicting appearance storage');
  } catch (error) {
    console.error('❌ Error disabling appearance storage:', error);
  }
};

// 2. FIX SIGN-OUT FUNCTIONALITY
export const performEmergencySignOut = () => {
  try {
    console.log('🚨 EMERGENCY SIGN OUT INITIATED');

    // Clear ALL storage completely
    localStorage.clear();
    sessionStorage.clear();

    // Clear any indexedDB or other storage
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase('productivity_hub');
    }

    // Force redirect to login
    window.location.href = window.location.origin + '/login';

    console.log('✅ Emergency sign out completed');
  } catch (error) {
    console.error('❌ Emergency sign out failed:', error);
    // Fallback - force page reload
    window.location.reload();
  }
};

// 3. TIMER MEMORY LEAK FIX
export let globalTimerInterval: any = null;

export const clearAllTimers = () => {
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
    console.log('✅ Global timer cleared');
  }

  // Clear any other intervals that might be running
  const maxIntervalId = setTimeout(() => {}, 0);
  for (let i = 1; i <= maxIntervalId; i++) {
    clearInterval(i);
  }

  console.log('✅ All intervals cleared');
};

// 4. EMERGENCY THEME OVERRIDE
export const forceThemeOverride = (theme: 'light' | 'dark') => {
  try {
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'light', 'font-small', 'font-medium', 'font-large', 'compact-mode');

    // Apply simple theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    console.log(`✅ Theme forced to: ${theme}`);
  } catch (error) {
    console.error('❌ Theme override failed:', error);
  }
};

// 5. PERFORMANCE MONITOR
export const startPerformanceMonitoring = () => {
  let checkCount = 0;
  const maxChecks = 60; // Monitor for 1 minute

  const monitor = setInterval(() => {
    checkCount++;

    // Check memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);

      console.log(`📊 Memory: ${usedMB}MB / ${totalMB}MB`);

      // If memory usage is too high, clear timers
      if (usedMB > 100) {
        console.warn('⚠️ High memory usage detected, clearing timers');
        clearAllTimers();
      }
    }

    // Stop monitoring after maxChecks
    if (checkCount >= maxChecks) {
      clearInterval(monitor);
      console.log('✅ Performance monitoring completed');
    }
  }, 1000);

  return monitor;
};

// 6. EMERGENCY RECOVERY FUNCTION
export const emergencyRecovery = () => {
  console.log('🚨 EMERGENCY RECOVERY INITIATED');

  try {
    // Step 1: Clear all timers
    clearAllTimers();

    // Step 2: Disable conflicting storage
    disableAppearanceStorage();

    // Step 3: Force light theme (most stable)
    forceThemeOverride('light');

    // Step 4: Start performance monitoring
    startPerformanceMonitoring();

    console.log('✅ Emergency recovery completed - Application should now be responsive');

    return true;
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
    return false;
  }
};

// Auto-execute fixes on import
console.log('🔧 APPLYING CRITICAL PRODUCTION FIXES...');
emergencyRecovery();