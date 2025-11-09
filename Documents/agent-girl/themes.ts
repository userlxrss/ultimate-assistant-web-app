/**
 * REFINED DARK THEME DESIGN SYSTEM - Readability-First Implementation
 *
 * EXACTLY FOLLOWING SPECIFICATIONS:
 * ✅ True dark base: #0D0F13 solid (no mid-gray panels for content areas)
 * ✅ Glassmorphism only to secondary surfaces (cards, floating panels, sidebar)
 * ❌ NEVER to content or forms (inputs, sliders, calendars remain solid dark)
 * ✅ Consistent dark mode - no bright white backgrounds anywhere
 * ✅ Text hierarchy: #F2F3F5 > #A0A4AE > #6C717A
 * ✅ Single subtle blue accent: #3A7CFF
 * ✅ Apple-style glass aesthetic with refined readability
 */

export interface Theme {
  name: string;
  colors: {
    // SOLID BACKGROUNDS - EXACT SPECIFICATIONS
    'bg-primary': string;          // #0D0F13 - Main app background, solid, no blur
    'bg-secondary': string;        // #141925 - Cards, containers, solid dark
    'bg-tertiary': string;         // #1E2533 - Elevated elements, solid dark
    'bg-sidebar': string;          // Sidebar - can use glass
    'bg-input': string;            // #151A26 - Input fields, SOLID for readability

    // GLASS EFFECTS - ONLY for secondary surfaces
    'glass-bg': string;            // rgba(255,255,255,0.05) - Translucent panels only
    'glass-border': string;        // rgba(255,255,255,0.08) - Glass panel borders
    'glass-shadow': string;        // Glass panel shadows

    // EXACT TEXT HIERARCHY FROM SPECIFICATIONS
    'text-primary': string;        // #F2F3F5 - Maximum contrast for headings
    'text-secondary': string;      // #A0A4AE - Comfortable reading for body text
    'text-tertiary': string;       // #6C717A - Subtle information, labels
    'text-muted': string;          // Even more muted for placeholders
    'text-inverse': string;        // #FFFFFF - On dark backgrounds

    // SOPHISTICATED BORDERS
    'border-subtle': string;       // rgba(255,255,255,0.05) - Subtle edges
    'border-normal': string;       // rgba(255,255,255,0.08) - Standard borders
    'border-strong': string;       // rgba(255,255,255,0.12) - Strong emphasis

    // SINGLE BLUE ACCENT SYSTEM - EXACT SPECIFICATIONS
    'accent-primary': string;      // #3A7CFF - Single subtle blue
    'accent-hover': string;        // #558CFF - Hover state
    'accent-active': string;       // #2968DD - Active state
    'accent-subtle': string;       // rgba(58,124,255,0.15) - Background accents

    // SUBTLE STATUS COLORS - Low saturation
    'success': string;             // #22C55E - Muted green
    'warning': string;             // #F59E0B - Muted amber
    'error': string;               // #EF4444 - Muted red
    'info': string;                // #3B82F6 - Muted blue

    // REFINED INTERACTIVE STATES
    'hover-bg': string;            // rgba(255,255,255,0.04) - Soft hover
    'active-bg': string;           // rgba(255,255,255,0.08) - Active state
    'focus-ring': string;          // rgba(58,124,255,0.3) - Focus indicator

    // PREMIUM SHADOWS - Depth without harshness
    'shadow-sm': string;           // 0 2px 4px rgba(0,0,0,0.1)
    'shadow-md': string;           // 0 4px 12px rgba(0,0,0,0.15)
    'shadow-lg': string;           // 0 8px 24px rgba(0,0,0,0.2)
    'shadow-xl': string;           // 0 16px 40px rgba(0,0,0,0.25)
    'shadow-2xl': string;          // 0 20px 50px rgba(0,0,0,0.3)

    // OVERLAYS AND MODALS - SOLID DARK
    'overlay-bg': string;          // rgba(0,0,0,0.5) - Modal backdrop
    'modal-bg': string;            // #141925 - Modal content, solid dark
  };

  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      light: string;
      normal: string;
      medium: string;        // 500 - Medium weight for headings (not bold)
      semibold: string;      // 600 - Slightly bolder for emphasis
      bold: string;          // 700 - Used sparingly
    };
    lineHeight: {
      tight: string;
      normal: string;        // 1.6 - Airy spacing for readability
      relaxed: string;       // 1.8 - Extra breathing room
    };
  };

  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };

  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;          // Larger radius for premium feel
    full: string;
  };

  transitions: {
    fast: string;           // 150ms - Quick interactions
    normal: string;         // 250ms - Standard transitions
    slow: string;           // 350ms - Deliberate movements
    easing: string;         // cubic-bezier(0.4, 0, 0.2, 1) - Apple standard
  };
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    'bg-primary': '#FFFFFF',
    'bg-secondary': '#F8FAFC',
    'bg-tertiary': '#F1F5F9',
    'bg-sidebar': '#FFFFFF',
    'bg-input': '#FFFFFF',

    'glass-bg': 'rgba(255, 255, 255, 0.8)',
    'glass-border': 'rgba(0, 0, 0, 0.08)',
    'glass-shadow': 'rgba(0, 0, 0, 0.1)',

    'text-primary': '#1A1D23',
    'text-secondary': '#4A5568',
    'text-tertiary': '#718096',
    'text-muted': '#A0AEC0',
    'text-inverse': '#FFFFFF',

    'border-subtle': 'rgba(0, 0, 0, 0.05)',
    'border-normal': 'rgba(0, 0, 0, 0.08)',
    'border-strong': 'rgba(0, 0, 0, 0.12)',

    'accent-primary': '#3A7CFF',
    'accent-hover': '#558CFF',
    'accent-active': '#2968DD',
    'accent-subtle': 'rgba(58, 124, 255, 0.1)',

    'success': '#22C55E',
    'warning': '#F59E0B',
    'error': '#EF4444',
    'info': '#3B82F6',

    'hover-bg': 'rgba(0, 0, 0, 0.04)',
    'active-bg': 'rgba(0, 0, 0, 0.08)',
    'focus-ring': 'rgba(58, 124, 255, 0.25)',

    'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
    'shadow-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
    'shadow-lg': '0 4px 20px rgba(0, 0, 0, 0.12)',
    'shadow-xl': '0 8px 32px rgba(0, 0, 0, 0.15)',
    'shadow-2xl': '0 16px 48px rgba(0, 0, 0, 0.18)',

    'overlay-bg': 'rgba(0, 0, 0, 0.3)',
    'modal-bg': 'rgba(255, 255, 255, 0.95)',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },

  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    // EXACT SPECIFICATIONS - SOLID DARK BASES
    'bg-primary': '#0D0F13',           // True dark base - solid, no blur
    'bg-secondary': '#141925',         // Cards, containers - solid dark
    'bg-tertiary': '#1E2533',          // Elevated elements - solid dark
    'bg-sidebar': 'rgba(255, 255, 255, 0.05)', // Sidebar - glass allowed
    'bg-input': '#151A26',             // Input fields - SOLID for readability

    // GLASS EFFECTS - ONLY for secondary surfaces
    'glass-bg': 'rgba(255, 255, 255, 0.05)', // Translucent panels only
    'glass-border': 'rgba(255, 255, 255, 0.08)', // Glass panel borders
    'glass-shadow': 'rgba(0, 0, 0, 0.3)', // Soft glass shadows

    // EXACT TEXT HIERARCHY
    'text-primary': '#F2F3F5',         // Maximum contrast - headings
    'text-secondary': '#A0A4AE',       // Comfortable reading - body text
    'text-tertiary': '#6C717A',        // Subtle information - labels
    'text-muted': '#5A5F66',           // Very subtle - placeholders
    'text-inverse': '#FFFFFF',         // On dark backgrounds

    // SOPHISTICATED BORDERS
    'border-subtle': 'rgba(255, 255, 255, 0.05)',
    'border-normal': 'rgba(255, 255, 255, 0.08)',
    'border-strong': 'rgba(255, 255, 255, 0.12)',

    // SINGLE BLUE ACCENT SYSTEM
    'accent-primary': '#3A7CFF',       // Single subtle blue
    'accent-hover': '#558CFF',         // Hover state
    'accent-active': '#2968DD',        // Active state
    'accent-subtle': 'rgba(58, 124, 255, 0.15)', // Background accents

    // SUBTLE STATUS COLORS
    'success': '#22C55E',              // Muted green
    'warning': '#F59E0B',              // Muted amber
    'error': '#EF4444',                // Muted red
    'info': '#3B82F6',                 // Muted blue

    // REFINED INTERACTIVE STATES
    'hover-bg': 'rgba(255, 255, 255, 0.04)', // Soft hover
    'active-bg': 'rgba(255, 255, 255, 0.08)', // Active state
    'focus-ring': 'rgba(58, 124, 255, 0.3)', // Focus indicator

    // PREMIUM SHADOWS
    'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
    'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
    'shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.2)',
    'shadow-xl': '0 16px 40px rgba(0, 0, 0, 0.25)',
    'shadow-2xl': '0 20px 50px rgba(0, 0, 0, 0.3)',

    'overlay-bg': 'rgba(0, 0, 0, 0.5)',
    'modal-bg': '#141925',             // Modal content - solid dark
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',                   // Medium weight for headings (not bold)
      semibold: '600',                 // Slightly bolder for emphasis
      bold: '700',                     // Used sparingly
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.6',                   // Airy spacing for readability
      relaxed: '1.8',                  // Extra breathing room
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },

  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',                  // Larger radius for premium feel
    full: '9999px',
  },

  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Apple-standard easing
  },
};

export type ThemeType = 'light' | 'dark';

// Utility function to apply theme to CSS custom properties
export const applyThemeToCSS = (theme: Theme): void => {
  const root = document.documentElement;

  // Apply all color properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Apply typography
  root.style.setProperty('--font-family', theme.typography.fontFamily);

  // Apply spacing
  root.style.setProperty('--radius-sm', theme.borderRadius.sm);
  root.style.setProperty('--radius-md', theme.borderRadius.md);
  root.style.setProperty('--radius-lg', theme.borderRadius.lg);
  root.style.setProperty('--radius-xl', theme.borderRadius.xl);
  root.style.setProperty('--radius-2xl', theme.borderRadius['2xl']);
  root.style.setProperty('--radius-full', theme.borderRadius.full);

  // Apply transitions
  root.style.setProperty('--transition-fast', theme.transitions.fast);
  root.style.setProperty('--transition-normal', theme.transitions.normal);
  root.style.setProperty('--transition-slow', theme.transitions.slow);
  root.style.setProperty('--transition-easing', theme.transitions.easing);
};