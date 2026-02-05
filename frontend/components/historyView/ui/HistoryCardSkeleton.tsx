import React from 'react';

export const HistoryCardSkeleton: React.FC<{ minHeight?: number }> = ({ minHeight = 220 }) => (
  <div
    className="bg-black/70 border border-slate-700/50 rounded-2xl p-4 sm:p-5 overflow-hidden"
    style={{ minHeight }}
  >
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded bg-slate-800/60" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-2/3 rounded bg-slate-800/60" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/50" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-10 rounded bg-slate-800/40" />
        <div className="h-10 rounded bg-slate-800/35" />
        <div className="h-10 rounded bg-slate-800/30" />
      </div>
    </div>
  </div>
);
