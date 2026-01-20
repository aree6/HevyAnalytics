import React from 'react';

import type { SparklinePoint } from '../../utils/analysis/insights';

// Mini Sparkline Component
export const Sparkline: React.FC<{ data: SparklinePoint[]; color?: string; height?: number }> = ({
  data,
  color = '#3b82f6',
  height = 24,
}) => {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const width = 60;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const markerId = `sparkline-arrow-${String(color).replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 6 10"
          refX="4.8"
          refY="5"
          markerWidth="5"
          markerHeight="9"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 6 5 L 0 10 z" fill={color} />
        </marker>
      </defs>

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        className="drop-shadow-sm"
      />
    </svg>
  );
};
