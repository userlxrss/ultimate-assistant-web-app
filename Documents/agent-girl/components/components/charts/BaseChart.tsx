import React from 'react';
import { useTheme } from '../../../index';

interface BaseChartProps {
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  title,
  subtitle,
  height = 300,
  className = '',
  children,
}) => {
  const { theme } = useTheme();

  return (
    <div className={`glass glass-blur-16 glass-shadow-lg rounded-xl p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-text-secondary opacity-70">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};