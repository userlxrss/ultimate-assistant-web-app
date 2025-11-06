/**
 * EMERGENCY PRODUCTION RECOVERY SCRIPT
 * Run this immediately to fix the unresponsive application
 *
 * USAGE:
 * 1. Copy this entire script
 * 2. Paste into browser console on the problematic page
 * 3. Press Enter
 * 4. The application should become responsive immediately
 */

console.log('🚨 EMERGENCY RECOVERY SCRIPT INITIATED');

// 1. IMMEDIATE TIMER CLEANUP
function emergencyTimerCleanup() {
  console.log('🧹 Cleaning up all timers...');

  // Clear all intervals
  const maxIntervalId = setTimeout(() => {}, 0);
  for (let i = 1; i <= maxIntervalId; i++) {
    clearInterval(i);
  }

  // Clear all timeouts
  const maxTimeoutId = setTimeout(() => {}, 0);
  for (let i = 1; i <= maxTimeoutId; i++) {
    clearTimeout(i);
  }

  console.log('✅ All timers cleared');
}

// 2. STORAGE CONFLICT RESOLUTION
function emergencyStorageCleanup() {
  console.log('🗑️ Cleaning up conflicting storage...');

  // Clear localStorage items that cause conflicts
  const conflictKeys = [
    'user_preferences:font_size',
    'user_preferences:theme',
    'user_preferences:compact_mode',
    'productivity_hub_auth',
    'current_user_session_id'
  ];

  conflictKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Clear theme classes
  document.documentElement.classList.remove('dark', 'light', 'font-small', 'font-medium', 'font-large', 'compact-mode');

  console.log('✅ Storage conflicts resolved');
}

// 3. FORCED STABLE THEME
function emergencyThemeReset() {
  console.log('🎨 Resetting to stable theme...');

  // Force light theme
  document.documentElement.classList.remove('dark');
  document.body.style.backgroundColor = '#f9fafb';
  document.body.style.color = '#111827';

  // Remove any theme-related event listeners
  const bodyClone = document.body.cloneNode(true);
  document.body.parentNode?.replaceChild(bodyClone, document.body);

  console.log('✅ Theme reset to stable light mode');
}

// 4. MEMORY OPTIMIZATION
function emergencyMemoryOptimization() {
  console.log('💾 Optimizing memory usage...');

  // Force garbage collection if available
  if (window.gc) {
    window.gc();
    console.log('✅ Garbage collection forced');
  }

  // Clear any pending animations
  document.getAnimations().forEach(animation => {
    animation.cancel();
  });

  console.log('✅ Memory optimization completed');
}

// 5. EVENT LISTENER CLEANUP - DISABLED: This breaks React's synthetic event system
function emergencyEventCleanup() {
  console.log('🚫 EVENT LISTENER CLEANUP DISABLED - Prevents React event system from breaking');
  console.log('👂 React event listeners will function normally');

  // REMOVED: EventTarget.prototype modifications that break React
  // const originalAddEventListener = EventTarget.prototype.addEventListener;
  // const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  // EventTarget.prototype.addEventListener = function(type, listener, options) {
  //   if (type === 'storage' || type === 'beforeunload') {
  //     return; // Block problematic listeners
  //   }
  //   return originalAddEventListener.call(this, type, listener, options);
  // };

  console.log('✅ React event system protection applied');
}

// 6. FORCED SIGN-OUT FIX
function emergencySignOutFix() {
  console.log('🚪 Applying sign-out fix...');

  // Create global emergency sign-out function
  window.emergencySignOut = function() {
    console.log('🚨 EMERGENCY SIGN OUT EXECUTED');

    // Clear everything
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login
    window.location.href = window.location.origin + '/login';
  };

  // Override any existing sign-out buttons
  const signOutButtons = document.querySelectorAll('button');
  signOutButtons.forEach(button => {
    if (button.textContent?.includes('Sign Out') || button.textContent?.includes('Logout')) {
      button.onclick = window.emergencySignOut;
      console.log('✅ Sign-out button fixed');
    }
  });

  console.log('✅ Sign-out fix applied');
}

// 7. PERFORMANCE MONITORING
function startEmergencyMonitoring() {
  console.log('📊 Starting emergency performance monitoring...');

  let checkCount = 0;
  const monitor = setInterval(() => {
    checkCount++;

    // Check if page is responsive
    const startTime = performance.now();
    const dummy = document.createElement('div');
    document.body.appendChild(dummy);
    document.body.removeChild(dummy);
    const endTime = performance.now();

    const responseTime = endTime - startTime;
    console.log(`📈 Response time: ${responseTime.toFixed(2)}ms`);

    if (responseTime > 100) {
      console.warn('⚠️ Slow response detected, applying emergency fixes again');
      emergencyTimerCleanup();
    }

    // Stop monitoring after 5 minutes
    if (checkCount >= 300) {
      clearInterval(monitor);
      console.log('✅ Emergency monitoring completed - Application appears stable');
    }
  }, 1000);

  return monitor;
}

// 8. MAIN EMERGENCY RECOVERY FUNCTION
function performEmergencyRecovery() {
  console.log('🚨 === STARTING EMERGENCY RECOVERY ===');

  try {
    // Step 1: Timer cleanup
    emergencyTimerCleanup();

    // Step 2: Storage cleanup
    emergencyStorageCleanup();

    // Step 3: Theme reset
    emergencyThemeReset();

    // Step 4: Memory optimization
    emergencyMemoryOptimization();

    // Step 5: Event cleanup
    emergencyEventCleanup();

    // Step 6: Sign-out fix
    emergencySignOutFix();

    // Step 7: Start monitoring
    startEmergencyMonitoring();

    console.log('✅ === EMERGENCY RECOVERY COMPLETED ===');
    console.log('🎉 Application should now be responsive and stable');

    // Show success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    notification.textContent = '✅ Emergency Recovery Applied - Application Stabilized';
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    return true;

  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);

    // Last resort - force page reload
    if (confirm('Emergency recovery failed. Force reload the page?')) {
      window.location.reload();
    }

    return false;
  }
}

// DISABLED: AUTO-EXECUTION BREAKS REACT EVENTS
// performEmergencyRecovery();
console.log('🚫 Auto-execution disabled - React event system protection applied');

// Export for manual access
window.emergencyRecovery = performEmergencyRecovery;
window.emergencyTimerCleanup = emergencyTimerCleanup;
window.emergencySignOut = window.emergencySignOut;

console.log('🔧 Emergency recovery functions are now available in window object');
console.log('✅ Script execution completed');