import React from 'react';
import { useTheme } from './ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md'
}) => {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        relative
        inline-flex
        items-center
        justify-center
        rounded-full
        backdrop-blur-md
        border
        transition-all
        duration-300
        ease-in-out
        hover:scale-105
        active:scale-95
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-glass-bg)',
        borderColor: 'var(--color-glass-border)',
        boxShadow: 'var(--color-glass-shadow) 0 8px 32px',
        transition: 'var(--transition-smooth)',
        color: 'var(--color-text-primary)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon for light mode */}
      <svg
        className={`absolute transition-all duration-300 ${iconSize[size]} ${
          isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon icon for dark mode */}
      <svg
        className={`absolute transition-all duration-300 ${iconSize[size]} ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isDark
            ? 'radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)'
            : 'radial-gradient(circle, var(--color-accent-secondary) 0%, transparent 70%)',
          filter: 'blur(8px)',
          zIndex: -1,
        }}
      />
    </button>
  );
};

export default ThemeToggle;