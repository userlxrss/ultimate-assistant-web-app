import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'gradient' | 'elevated';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
  animated?: boolean;
  pattern?: 'dots' | 'grid' | 'none';
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  className,
  variant = 'glass',
  hover = false,
  glow = false,
  children,
  animated = false,
  pattern = 'none',
  ...props
}) => {
  const variants = {
    glass: 'glass-card dark:glass-card-dark border-white/20 dark:border-white/10',
    solid: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-white/20 dark:border-white/10',
    gradient: 'gradient-primary text-white border-white/20',
    elevated: 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-white/30 dark:border-white/15 shadow-2xl'
  };

  const patternClasses = {
    dots: 'bg-pattern-dots',
    grid: 'bg-pattern-grid',
    none: ''
  };

  const MotionComponent = (hover || animated) ? motion.div : 'div';

  const motionProps = hover ? {
    whileHover: {
      scale: 1.02,
      y: -8,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    whileTap: { scale: 0.98 }
  } : animated ? {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, ease: "easeOut" }
  } : {};

  const glowProps = glow ? {
    whileHover: {
      boxShadow: [
        "0 20px 40px rgba(102, 126, 234, 0.1)",
        "0 25px 50px rgba(102, 126, 234, 0.2)",
        "0 30px 60px rgba(102, 126, 234, 0.3)"
      ],
      transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" }
    }
  } : {};

  return (
    <MotionComponent
      className={cn(
        'relative rounded-3xl p-8 transition-all duration-500 overflow-hidden group',
        variants[variant],
        patternClasses[pattern],
        hover && 'hover-lift cursor-pointer',
        glow && 'hover-glow',
        'animate-slide-in-blurred',
        className
      )}
      {...motionProps}
      {...glowProps}
      {...props}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 animate-shimmer" />
      </div>

      {/* Gradient Overlay for Glass Effect */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      )}

      {/* Top Gradient Line */}
      <div className="premium-stat-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 animate-gradient" />
      </div>

      {children}
    </MotionComponent>
  );
};

export const PremiumCardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex flex-col space-y-3 pb-6 relative z-10', className)}
      {...props}
    />
  );
};

export const PremiumCardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'text-2xl font-bold text-gray-900 dark:text-white tracking-tight',
        className
      )}
      {...props}
    />
  );
};

export const PremiumCardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-gray-600 dark:text-gray-300 leading-relaxed',
        className
      )}
      {...props}
    />
  );
};

export const PremiumCardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn('pt-0 relative z-10', className)} {...props} />
  );
};

export const PremiumCardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex items-center pt-6 mt-6 border-t border-white/10 dark:border-white/5 relative z-10', className)}
      {...props}
    />
  );
};