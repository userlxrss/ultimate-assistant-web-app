import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  children: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  glow = false,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700',
    outline: 'bg-transparent text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'bg-transparent text-gray-900 dark:text-white border-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    gradient: 'gradient-primary text-white border-transparent hover:opacity-90',
    glass: 'glass-premium text-gray-900 dark:text-white border-white/20 hover:glass-card'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-3xl',
    xl: 'px-10 py-5 text-xl rounded-3xl'
  };

  const MotionComponent = motion.button;

  const motionProps = {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  };

  const glowProps = glow ? {
    whileHover: {
      boxShadow: [
        "0 0 20px rgba(102, 126, 234, 0.4)",
        "0 0 40px rgba(102, 126, 234, 0.6)",
        "0 0 60px rgba(102, 126, 234, 0.4)"
      ]
    }
  } : {};

  return (
    <MotionComponent
      className={cn(
        'relative inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed btn-premium',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...motionProps}
      {...glowProps}
      {...props}
    >
      {/* Loading State */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-5 h-5 animate-spin" />
        </motion.div>
      )}

      {/* Button Content */}
      <div className={cn('flex items-center space-x-2', loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {icon}
          </motion.div>
        )}

        <motion.span
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.span>

        {icon && iconPosition === 'right' && (
          <motion.div
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Hover Glow Effect */}
      {glow && (
        <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      )}
    </MotionComponent>
  );
};

export const PremiumButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}> = ({ children, className, spacing = 'md' }) => {
  const spacingClasses = {
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6'
  };

  return (
    <div className={cn('flex items-center', spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};