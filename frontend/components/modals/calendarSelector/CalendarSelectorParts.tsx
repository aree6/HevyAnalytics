import React from 'react';

export const StartEndTooltip: React.FC<{
  position: 'top' | 'bottom' | 'right';
  onStart: (e: React.MouseEvent) => void;
  onEnd: (e: React.MouseEvent) => void;
}> = ({ position, onStart, onEnd }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  };

  return (
    <div className={`absolute z-50 ${positionClasses[position]} flex gap-1 bg-slate-950/75 border border-slate-700/35 rounded-xl p-1.5 shadow-xl`}>
      <button
        onClick={onStart}
        className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg bg-black/40 hover:bg-white/5 border border-emerald-500/30 text-emerald-200 whitespace-nowrap transition-colors"
        style={{ color: 'rgb(var(--mw-calendar-start-rgb, 16 185 129) / 1)' }}
      >
        Set start
      </button>
      <button
        onClick={onEnd}
        className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg bg-black/40 hover:bg-white/5 border border-rose-500/30 text-rose-200 whitespace-nowrap transition-colors"
        style={{ color: 'rgb(var(--mw-calendar-end-rgb, 244 63 94) / 1)' }}
      >
        Set end
      </button>
    </div>
  );
};

export const CheckmarkIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg fill="currentColor" viewBox="0 0 20 20" className={className}>
    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" fillRule="evenodd" />
  </svg>
);

export const PartialDot: React.FC<{ className?: string }> = ({ className = 'w-2 h-2' }) => (
  <span className={`${className} rounded-full bg-slate-300`} />
);
