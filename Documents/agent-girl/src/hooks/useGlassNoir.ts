import { useEffect } from 'react';

/**
 * Glass Noir Dark Mode Hook
 * Manages premium Apple-level glassmorphism design system
 */
export const useGlassNoir = () => {
  useEffect(() => {
    // Apply Glass Noir styles when dark mode is active
    const applyGlassNoirStyles = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    document.documentElement.getAttribute('data-theme') === 'dark';

      if (isDark) {
        // Apply glass noir background to body
        document.body.style.background = 'radial-gradient(at 50% 50%, #0E111A 0%, #090B10 100%)';
        document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

        // Add glass noir class to main elements
        const main = document.querySelector('main');
        if (main) {
          main.classList.add('glass-noir-panel');
        }

        // Update nav items to use glass noir classes
        const navItems = document.querySelectorAll('.nav-item, .menu-item, nav button');
        navItems.forEach(item => {
          if (!item.classList.contains('glass-noir-processed')) {
            item.classList.add('glass-noir-processed');
            item.classList.add('nav-item');
          }
        });

        // Update cards to use glass noir styling
        const cards = document.querySelectorAll('.card, .panel, .dashboard-card, .stat-card');
        cards.forEach(card => {
          if (!card.classList.contains('glass-noir-processed')) {
            card.classList.add('glass-noir-processed');
            card.classList.add('glass-noir-card');
          }
        });
      }
    };

    // Initial application
    applyGlassNoirStyles();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      applyGlassNoirStyles();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};

/**
 * Glass Noir Utility Functions
 */
export const glassNoirUtils = {
  // Check if glass noir dark mode is active
  isGlassNoirActive: () => {
    return document.documentElement.classList.contains('dark') ||
           document.documentElement.getAttribute('data-theme') === 'dark';
  },

  // Apply glass noir class to element
  applyGlassNoirPanel: (element: HTMLElement) => {
    element.classList.add('glass-noir-card');
    return element;
  },

  // Apply glass noir navigation styling
  applyGlassNoirNav: (element: HTMLElement, isActive: boolean = false) => {
    element.classList.add('nav-item');
    if (isActive) {
      element.classList.add('active');
    }
    return element;
  },

  // Get glass noir color value
  getColor: (colorName: string) => {
    const colors: Record<string, string> = {
      'accent': '#4C8BFF',
      'text-primary': '#EAEAEA',
      'text-secondary': '#9BA1AE',
      'text-muted': '#7A808C',
      'panel': 'rgba(20, 25, 35, 0.65)',
      'border': 'rgba(255, 255, 255, 0.06)',
    };
    return colors[colorName] || colorName;
  }
};