import React from 'react';
import { useTheme } from '../../../index';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  smooth?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 300,
  showGrid = true,
  showDots = true,
  smooth = true,
  className = '',
}) => {
  const { theme } = useTheme();

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const width = 100;
  const chartHeight = height - 60; // Account for labels

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = (i / 4) * chartHeight;
    const value = maxValue - (range * i) / 4;
    return { y, value };
  });

  return (
    <div className={`w-full h-full relative ${className}`}>
      <svg
        width="100%"
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Grid */}
        {showGrid && gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1="0"
              y1={line.y}
              x2={width}
              y2={line.y}
              stroke="var(--color-border-light)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text
              x={width + 5}
              y={line.y + 4}
              fill="var(--color-text-tertiary)"
              fontSize="10"
              textAnchor="start"
            >
              {Math.round(line.value)}
            </text>
          </g>
        ))}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin={smooth ? 'round' : 'miter'}
        />

        {/* Fill area under line */}
        <polygon
          points={`${points} ${width},${chartHeight} 0,${chartHeight}`}
          fill="var(--color-accent-primary)"
          fillOpacity="0.1"
        />

        {/* Data points */}
        {showDots && data.map((point, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = chartHeight - ((point.value - minValue) / range) * chartHeight;

          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="var(--color-bg-primary)"
                stroke="var(--color-accent-primary)"
                strokeWidth="2"
                className="cursor-pointer hover:r-6 transition-all"
              />
              <text
                x={x}
                y={chartHeight + 20}
                fill="var(--color-text-secondary)"
                fontSize="10"
                textAnchor="middle"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive tooltip placeholder */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="glass glass-blur-8 rounded-lg px-2 py-1 text-xs opacity-0 hover:opacity-100 transition-opacity">
          {/* Tooltip content would go here */}
        </div>
      </div>
    </div>
  );
};