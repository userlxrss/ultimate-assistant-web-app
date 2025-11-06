import React from 'react';
import { useTheme } from '../../../index';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  showGrid?: boolean;
  showValues?: boolean;
  horizontal?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  showGrid = true,
  showValues = true,
  horizontal = false,
  className = '',
}) => {
  const { theme } = useTheme();

  const maxValue = Math.max(...data.map(d => d.value));
  const barPadding = horizontal ? 4 : 8;
  const groupPadding = horizontal ? 2 : 4;

  if (horizontal) {
    const width = 100;
    const barHeight = (height - 60) / data.length - barPadding;

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
          {showGrid && Array.from({ length: 5 }, (_, i) => {
            const x = (i / 4) * width;
            const value = (maxValue * i) / 4;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={height - 30}
                  stroke="var(--color-border-light)"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={height - 10}
                  fill="var(--color-text-tertiary)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((point, index) => {
            const barWidth = (point.value / maxValue) * width;
            const y = index * (barHeight + barPadding) + 10;

            return (
              <g key={index}>
                <rect
                  x="0"
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={point.color || 'var(--color-accent-primary)'}
                  fillOpacity="0.8"
                  rx="4"
                  className="cursor-pointer hover:fill-opacity-100 transition-all"
                />

                {showValues && (
                  <text
                    x={barWidth + 5}
                    y={y + barHeight / 2 + 4}
                    fill="var(--color-text-primary)"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {point.value}
                  </text>
                )}

                <text
                  x="-5"
                  y={y + barHeight / 2 + 4}
                  fill="var(--color-text-secondary)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Vertical bar chart
  const width = 100;
  const chartHeight = height - 60;
  const barWidth = (width - barPadding * (data.length - 1)) / data.length;

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
        {showGrid && Array.from({ length: 5 }, (_, i) => {
          const y = (i / 4) * chartHeight;
          const value = maxValue - (maxValue * i) / 4;
          return (
            <g key={i}>
              <line
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="var(--color-border-light)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <text
                x={width + 5}
                y={y + 4}
                fill="var(--color-text-tertiary)"
                fontSize="10"
                textAnchor="start"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const x = index * (barWidth + barPadding);
          const y = chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={point.color || 'var(--color-accent-primary)'}
                fillOpacity="0.8"
                rx="4"
                className="cursor-pointer hover:fill-opacity-100 transition-all"
              />

              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fill="var(--color-text-primary)"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {point.value}
                </text>
              )}

              <text
                x={x + barWidth / 2}
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
    </div>
  );
};