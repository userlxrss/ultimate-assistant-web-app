/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Original preserved colors for light mode
        'sage': {
          50: '#f0f7f4',
          100: '#e1f0e8',
          200: '#c3e1d3',
          300: '#a5d2bd',
          400: '#87c3a7',
          500: '#69b491',
          600: '#559172',
          700: '#417453',
          800: '#2d5734',
          900: '#193a15',
        },
        'dusty-blue': {
          50: '#f0f5f8',
          100: '#e0eaf0',
          200: '#c2d5e1',
          300: '#a4c0d2',
          400: '#86abc3',
          500: '#6886b4',
          600: '#536c91',
          700: '#3e526e',
          800: '#29384b',
          900: '#141e28',
        },
        'soft-lavender': {
          50: '#f8f6fc',
          100: '#f1ecf9',
          200: '#e3daf3',
          300: '#d5c8ed',
          400: '#c7b6e7',
          500: '#b9a4e1',
          600: '#9483b4',
          700: '#6f6287',
          800: '#4a415a',
          900: '#25202d',
        },

        // Glass Noir Dark Mode System - Complete Design Tokens
        'glass-noir': {
          // Base backgrounds - Deep navy-black gradients
          'bg-primary': '#0E111A',
          'bg-secondary': '#0C0F15',
          'bg-deep': '#090B10',
          'bg-surface': 'rgba(12, 15, 21, 0.8)',

          // Glass panel surfaces - Precise translucency
          'panel-light': 'rgba(20, 25, 35, 0.6)',
          'panel': 'rgba(20, 25, 35, 0.65)',
          'panel-strong': 'rgba(22, 27, 35, 0.7)',
          'panel-elevated': 'rgba(25, 30, 40, 0.75)',
          'sidebar': 'rgba(14, 17, 24, 0.7)',

          // Desaturated accent colors - Calm sophistication
          'accent-primary': '#4C8BFF',
          'accent-hover': '#3D7BFF',
          'accent-active': '#2B63F8',
          'accent-subtle': 'rgba(76, 139, 255, 0.12)',

          // Precision borders - Subtle but defined
          'border-subtle': 'rgba(255, 255, 255, 0.04)',
          'border': 'rgba(255, 255, 255, 0.06)',
          'border-medium': 'rgba(255, 255, 255, 0.08)',
          'border-strong': 'rgba(255, 255, 255, 0.12)',
          'border-glow': 'rgba(76, 139, 255, 0.15)',

          // Typography hierarchy - Apple-style text rendering
          'text-primary': '#EAEAEA',
          'text-secondary': '#B8BCC6',
          'text-tertiary': '#9BA1AE',
          'text-muted': '#7D8492',
          'text-nav': '#B0B7C3',

          // Status colors - Desaturated variants
          'success': '#4ADE80',
          'warning': '#FACC15',
          'error': '#EF4444',
          'info': '#60A5FA',

          // Glass variations - Premium transparency
          'glass-light': 'rgba(255, 255, 255, 0.03)',
          'glass-medium': 'rgba(255, 255, 255, 0.05)',
          'glass-strong': 'rgba(255, 255, 255, 0.08)',
          'glass-max': 'rgba(255, 255, 255, 0.12)',
        }
      },

      // Enhanced backdrop blur for premium glassmorphism
      backdropBlur: {
        'glass-noir-light': '20px',
        'glass-noir': '25px',
        'glass-noir-strong': '30px',
        'glass-noir-max': '40px',
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // Enhanced shadows for Apple-grade depth
      boxShadow: {
        'glass-noir': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'glass-noir-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'glass-noir-lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'glass-noir-xl': '0 16px 40px rgba(0, 0, 0, 0.6)',
        'glass-noir-accent': '0 0 20px rgba(76, 139, 255, 0.15)',
        'glass-noir-accent-strong': '0 0 30px rgba(76, 139, 255, 0.25)',
        'glass-noir-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-noir-insight': 'inset 0 1px 0 rgba(76, 139, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
      },

      // Premium animations for Apple-quality motion
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'glass-entrance': 'glassEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glass-hover': 'glassHover 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'lit-from-above': 'litFromAbove 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'glass-noir-entrance': 'glassNoirEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glassEntrance: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.95)',
            backdropFilter: 'blur(0px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
            backdropFilter: 'blur(20px)',
          },
        },
        glassHover: {
          '0%': {
            transform: 'translateY(0px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
          '100%': {
            transform: 'translateY(-2px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 24px rgba(0, 0, 0, 0.5)',
          },
        },
        litFromAbove: {
          '0%': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
          '100%': {
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 24px rgba(0, 0, 0, 0.5)',
          },
        },
        glassNoirEntrance: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.95)',
            backdropFilter: 'blur(0px)',
          },
          '50%': {
            opacity: '0.8',
            backdropFilter: 'blur(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
            backdropFilter: 'blur(25px)',
          },
        },
      },

      // Enhanced spacing for better layout
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Enhanced border radius for Apple-style curves
      borderRadius: {
        'glass': '16px',
        'glass-lg': '20px',
        'glass-sm': '12px',
        'glass-xs': '8px',
        '4xl': '2rem',
      },

      // Enhanced gradients for premium effects
      backgroundImage: {
        'glass-noir-gradient': 'radial-gradient(at 50% 50%, #0E111A 0%, #090B10 100%)',
        'glass-noir-panel': 'linear-gradient(135deg, rgba(25, 30, 40, 0.8) 0%, rgba(15, 18, 25, 0.8) 100%)',
        'glass-noir-button': 'linear-gradient(135deg, #2B63F8, #3D7BFF)',
        'glass-noir-button-hover': 'linear-gradient(135deg, #3D7BFF, #4C8BFF)',
        'glass-noir-inner-glow': 'linear-gradient(145deg, rgba(25, 30, 40, 0.7), rgba(15, 18, 25, 0.7))',
        'glass-noir-sidebar': 'linear-gradient(180deg, rgba(14, 17, 24, 0.7), rgba(14, 17, 24, 0.8))',
      },

      // Custom font families for Apple-quality typography
      fontFamily: {
        'glass-noir': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        'sf-pro': ['SF Pro Text', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      // Enhanced blur effects
      blur: {
        'glass-noir': '25px',
      },

      // Custom spacing for Glass Noir layout
      inset: {
        'glass': '4px',
      },
    },
  },
  plugins: [
    // Custom plugin for Glass Noir utilities
    function({ addUtilities, theme }) {
      const glassNoirUtilities = {
        '.glass-noir-surface': {
          background: theme('colors.glass-noir.panel'),
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: `1px solid ${theme('colors.glass-noir.border')}`,
          borderRadius: theme('borderRadius.glass'),
        },
        '.glass-noir-elevated': {
          background: theme('colors.glass-noir.panel-strong'),
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: `1px solid ${theme('colors.glass-noir.border-medium')}`,
          boxShadow: theme('boxShadow.glass-noir-lg'),
        },
        '.glass-noir-interactive': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        },
        '.glass-noir-interactive:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme('boxShadow.glass-noir-lg'),
        },
        '.text-shadow-glass': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        },
      };
      addUtilities(glassNoirUtilities);
    },
  ],
}