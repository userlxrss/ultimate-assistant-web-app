// Emergency modal close utility
export const emergencyModalClose = () => {
  // Close any open modals
  const modals = document.querySelectorAll('[role="dialog"], .modal, .modal-overlay');
  modals.forEach(modal => {
    if (modal instanceof HTMLElement) {
      modal.style.display = 'none';
      modal.remove();
    }
  });

  // Remove any backdrop overlays
  const overlays = document.querySelectorAll('.modal-backdrop, .backdrop');
  overlays.forEach(overlay => {
    if (overlay instanceof HTMLElement) {
      overlay.style.display = 'none';
      overlay.remove();
    }
  });

  // Remove body overflow hidden
  document.body.style.overflow = '';
  document.body.classList.remove('modal-open');
};