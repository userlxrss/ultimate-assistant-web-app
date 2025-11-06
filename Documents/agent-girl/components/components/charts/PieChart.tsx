import React from 'react';
import { useTheme } from '../../../index';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  donut?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  showLabels = true,
  showLegend = true,
  donut = false,
  className = '',
}) => {
  const { theme } = useTheme();

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = 50;
  const centerY = 50;
  const radius = 35;
  const innerRadius = donut ? 20 : 0;

  // Calculate angles for each slice
  let currentAngle = -90; // Start from top

  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: item.color || `var(--color-accent-${['primary', 'secondary', 'success', 'warning', 'error', 'info'][index % 6]})`,
    };
  });

  // Create SVG path for pie slice
  const createSlicePath = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);

    if (innerRadius > 0) {
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 0 ${x4} ${y4} Z`;
    } else {
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
    }
  };

  // Calculate label positions
  const getLabelPosition = (startAngle: number, endAngle: number, radius: number) => {
    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
    const labelRadius = radius * 0.7;
    return {
      x: centerX + labelRadius * Math.cos(midAngle),
      y: centerY + labelRadius * Math.sin(midAngle),
    };
  };

  return (
    <div className={`w-full h-full relative ${className}`}>
      <svg
        width="100%"
        height={height}
        className="overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Pie slices */}
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={createSlicePath(slice.startAngle, slice.endAngle, radius, innerRadius)}
              fill={slice.color}
              fillOpacity="0.8"
              stroke="var(--color-bg-primary)"
              strokeWidth="0.5"
              className="cursor-pointer hover:fill-opacity-100 transition-all"
            />

            {/* Labels */}
            {showLabels && slice.percentage > 0.05 && (
              <text
                x={getLabelPosition(slice.startAngle, slice.endAngle, radius).x}
                y={getLabelPosition(slice.startAngle, slice.endAngle, radius).y}
                fill="var(--color-text-inverse)"
                fontSize="8"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {`${Math.round(slice.percentage * 100)}%`}
              </text>
            )}
          </g>
        ))}

        {/* Center text for donut chart */}
        {donut && (
          <text
            x={centerX}
            y={centerY}
            fill="var(--color-text-primary)"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {total}
          </text>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: `var(${slice.color.replace('var(', '').replace(')', '')})` }}
                />
                <span className="opacity-70">{slice.label}</span>
              </div>
              <span className="font-medium">{slice.value} ({Math.round(slice.percentage * 100)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};