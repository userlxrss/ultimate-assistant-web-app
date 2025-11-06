// Global Modal Emergency Close System
// This provides failsafe mechanisms to close stuck modals

interface EmergencyCloseUtils {
  forceCloseAllModals: () => void;
  isModalStuck: () => boolean;
  getModalStatus: () => { isStuck: boolean; modalType: string; stuckDuration: number };
}

declare global {
  interface Window {
    __modalEmergencyClose?: EmergencyCloseUtils;
  }
}

// Global emergency close function that can be called from browser console
const forceCloseAllModals = () => {
  console.warn('🚨 EMERGENCY MODAL CLOSE TRIGGERED');

  // Reset timer notification state
  const event = new CustomEvent('emergencyModalClose', {
    detail: { reason: 'global-emergency-close', timestamp: Date.now() }
  });
  document.dispatchEvent(event);

  // Remove any stuck modal elements
  const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
  modals.forEach(modal => {
    console.warn('Removing stuck modal element:', modal);
    modal.remove();
  });

  // Restore body scroll
  document.body.style.overflow = 'unset';
  document.body.classList.remove('modal-open');

  // Clear any modal-related timeouts
  const highestTimeoutId = setTimeout(() => {
    // This will be the last timeout ID
  }, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }

  console.log('✅ Emergency modal close completed');
};

// Check if modal is stuck (uses smart detection)
const isModalStuck = () => {
  return isModalActuallyStuck();
};

// Get modal status information
const getModalStatus = () => {
  const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
  const isStuck = isModalActuallyStuck();

  // Calculate average stuck duration for open modals
  const currentTime = Date.now();
  let totalDuration = 0;
  let modalCount = 0;

  modals.forEach(modal => {
    const modalId = modal.getAttribute('data-modal') || modal.id || `modal-${modal.tagName}`;
    if (modalOpenTime[modalId]) {
      totalDuration += currentTime - modalOpenTime[modalId];
      modalCount++;
    }
  });

  const avgDuration = modalCount > 0 ? Math.round(totalDuration / modalCount / 1000) : 0;

  return {
    isStuck,
    modalType: modals.length > 0 ? modals[0].tagName.toLowerCase() : 'none',
    stuckDuration: avgDuration,
    timeSinceInteraction: Math.round((currentTime - lastUserInteraction) / 1000),
    isTabVisible: isDocumentVisible
  };
};

// Debug function to check modal status
const debugModalStatus = () => {
  const status = getModalStatus();
  console.log('🔍 Modal Debug Status:', {
    ...status,
    currentTime: new Date().toLocaleTimeString(),
    openModals: document.querySelectorAll('[role="dialog"], .modal, [data-modal]').length,
    modalDetails: Array.from(document.querySelectorAll('[role="dialog"], .modal, [data-modal]')).map(modal => ({
      id: modal.id || modal.getAttribute('data-modal') || 'unknown',
      tag: modal.tagName.toLowerCase(),
      openDuration: modal.getAttribute('data-modal') ?
        Math.round((Date.now() - (modalOpenTime[modal.getAttribute('data-modal')] || Date.now())) / 1000) : 'unknown'
    }))
  });
  return status;
};

// Make emergency close functions available globally
window.__modalEmergencyClose = {
  forceCloseAllModals,
  isModalStuck,
  getModalStatus,
  debugModalStatus
};

// Track user interaction and tab visibility to avoid false positives
let lastUserInteraction = Date.now();
let isDocumentVisible = !document.hidden;
let modalOpenTime: Record<string, number> = {};

// Monitor user interactions
const setupInteractionTracking = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  events.forEach(event => {
    document.addEventListener(event, () => {
      lastUserInteraction = Date.now();
    }, { passive: true });
  });
};

// Monitor tab visibility changes
const setupVisibilityTracking = () => {
  document.addEventListener('visibilitychange', () => {
    isDocumentVisible = !document.hidden;
    if (!isDocumentVisible) {
      // Tab is hidden, pause checking
      console.log('🔄 Tab hidden - pausing modal detection');
    } else {
      // Tab is visible again, reset interaction time
      console.log('🔄 Tab visible - resuming modal detection');
      lastUserInteraction = Date.now();
    }
  });
};

// Check if modal is legitimately stuck (not just open for normal use)
const isModalActuallyStuck = () => {
  if (!isDocumentVisible) {
    // Don't close modals when tab is hidden
    return false;
  }

  const timeSinceInteraction = Date.now() - lastUserInteraction;
  if (timeSinceInteraction < 30000) {
    // User has interacted recently, modal is likely being used normally
    return false;
  }

  const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
  if (modals.length === 0) {
    return false;
  }

  // Check each modal's open time
  const currentTime = Date.now();
  for (const modal of modals) {
    const modalId = modal.getAttribute('data-modal') || modal.id || `modal-${modal.tagName}`;

    if (!modalOpenTime[modalId]) {
      modalOpenTime[modalId] = currentTime;
    }

    const openDuration = currentTime - modalOpenTime[modalId];

    // Only consider modal stuck if it's been open for more than 2 minutes without user interaction
    if (openDuration > 120000 && timeSinceInteraction > 60000) {
      console.warn(`⚠️ Modal ${modalId} appears stuck (open for ${Math.round(openDuration/1000)}s, no interaction for ${Math.round(timeSinceInteraction/1000)}s)`);
      return true;
    }
  }

  return false;
};

// Smart stuck modal detector that accounts for user activity and tab visibility
const stuckModalDetector = () => {
  setupInteractionTracking();
  setupVisibilityTracking();

  // Check every 30 seconds instead of 10 seconds
  const checkInterval = setInterval(() => {
    if (isModalActuallyStuck()) {
      console.error('🚨 STUCK MODAL DETECTED! Running emergency close...');
      forceCloseAllModals();

      // Reset modal open times after emergency close
      modalOpenTime = {};
    }
  }, 30000);

  // Clean up interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(checkInterval);
  });
};

// Keyboard shortcut for emergency close (Ctrl+Shift+Escape)
const setupEmergencyShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
      console.warn('Emergency keyboard shortcut triggered');
      forceCloseAllModals();
    }
  });
};

// Initialize emergency close system
if (typeof window !== 'undefined') {
  setupEmergencyShortcuts();
  stuckModalDetector();
}

export { forceCloseAllModals, isModalStuck, getModalStatus };