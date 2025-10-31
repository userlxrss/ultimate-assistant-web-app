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

// Check if modal is stuck
const isModalStuck = () => {
  const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
  return modals.length > 0;
};

// Get modal status information
const getModalStatus = () => {
  const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
  return {
    isStuck: modals.length > 0,
    modalType: modals.length > 0 ? modals[0].tagName.toLowerCase() : 'none',
    stuckDuration: 0 // Would need tracking implementation
  };
};

// Make emergency close functions available globally
window.__modalEmergencyClose = {
  forceCloseAllModals,
  isModalStuck,
  getModalStatus
};

// Auto-detect stuck modals after 10 seconds
const stuckModalDetector = () => {
  setTimeout(() => {
    if (isModalStuck()) {
      console.error('🚨 STUCK MODAL DETECTED! Running emergency close...');
      forceCloseAllModals();
    }
  }, 10000);
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