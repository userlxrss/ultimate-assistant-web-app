/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
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
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}