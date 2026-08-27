import React from 'react';

interface TabSkeletonProps {
  rows?: number;
  className?: string;
}

const SkeletonBar: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div
    className={`rounded-lg animate-pulse ${className}`}
    style={{
      backgroundColor: 'rgb(var(--border-rgb) / 0.12)',
      ...style,
    }}
  />
);

export const TabSkeleton: React.FC<TabSkeletonProps> = ({ rows = 5, className = '' }) => {
  const contentRows = Array.from({ length: rows }, (_, i) => {
    const widths = ['90%', '75%', '95%', '60%', '85%'];
    return widths[i % widths.length];
  });

  return (
    // Reserve roughly a viewport of content so tab switches don't shift layout
    // (real tab content is 1000px+; the bare rows were ~150-210px). Viewport-
    // relative on small screens so short/empty tabs don't over-reserve scroll.
    <div className={`flex flex-col gap-3 py-1 min-h-[400px] sm:min-h-[60vh] ${className}`}>
      <SkeletonBar className="h-10 w-1/3" />
      {contentRows.map((width, i) => (
        <SkeletonBar key={i} className="h-4" style={{ width }} />
      ))}
    </div>
  );
};
