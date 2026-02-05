import React, { useId } from 'react';

export const Sparkline: React.FC<{ data: number[]; width?: number; height?: number; color?: string }> = ({
  data,
  width = 60,
  height = 20,
  color = '#10b981',
}) => {
  if (data.length < 2) return null;
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padX = 4;
  const padY = 4;
  const innerW = Math.max(width - padX * 2, 1);
  const innerH = Math.max(height - padY * 2, 1);

  const points = data
    .map((val, i) => {
      const x = padX + (i / (data.length - 1)) * innerW;
      const y = padY + (innerH - ((val - min) / range) * innerH);
      return `${x},${y}`;
    })
    .join(' ');

  const trend = data[data.length - 1] - data[0];
  const strokeColor = trend >= 0 ? '#10b981' : '#f43f5e';
  const markerId = `sparkline-arrow-${safeId}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
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
          <path d="M 0 0 L 6 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        opacity="0.8"
      />
    </svg>
  );
};
