import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'elevated';
  hover?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  hover = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    glass: 'glass-card dark:glass-card-dark border-white/20 dark:border-white/10',
    solid: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg'
  };

  const MotionComponent = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { scale: 1.02, y: -2 },
    transition: { type: "spring", stiffness: 300, damping: 30 }
  } : {};

  return (
    <MotionComponent
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 pb-6', className)}
      {...props}
    />
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-sm text-gray-600 dark:text-gray-400',
        className
      )}
      {...props}
    />
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn('pt-0', className)} {...props} />
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex items-center pt-6', className)}
      {...props}
    />
  );
};