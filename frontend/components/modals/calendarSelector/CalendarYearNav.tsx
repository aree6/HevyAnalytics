import React from 'react';
import { addYears } from 'date-fns';
import { CheckmarkIcon, StartEndTooltip } from './CalendarSelectorParts';
import type { SelectionStatus } from './calendarSelectorTypes';

interface CalendarYearNavProps {
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  viewYear: number;
  yearStatus: SelectionStatus;
  yearHasData: boolean;
  tooltipYear: boolean;
  onYearClick: () => void;
  onSetYearStart: () => void;
  onSetYearEnd: () => void;
}

export const CalendarYearNav: React.FC<CalendarYearNavProps> = ({
  viewMonth,
  setViewMonth,
  viewYear,
  yearStatus,
  yearHasData,
  tooltipYear,
  onYearClick,
  onSetYearStart,
  onSetYearEnd,
}) => (
  <div className="flex items-center justify-center gap-3 mb-3">
    <button
      onClick={() => setViewMonth(addYears(viewMonth, -1))}
      className="px-3 py-2 rounded-lg bg-black/70 hover:bg-black/60 text-base font-bold text-slate-200 border border-slate-700/50"
      title="Previous year"
    >
      ‹
    </button>
    <div className="relative">
      <button
        onClick={onYearClick}
        className={`relative px-4 py-1.5 rounded-lg font-bold text-sm border transition-all duration-200 min-w-[80px] ${
          yearStatus === 'full'
            ? 'border-slate-500/60 bg-white/10 text-slate-200'
            : yearStatus === 'partial'
              ? 'border-slate-600/60 bg-white/5 text-slate-200'
              : (yearHasData ? 'border-emerald-500/30 bg-emerald-500/10 text-slate-200 hover:bg-emerald-500/15' : 'border-slate-700/50 bg-black/70 text-slate-200 hover:bg-white/5')
        } ${tooltipYear ? '' : ''}`}
        title="Click again to set start/end for the year"
      >
        {yearStatus === 'full' && <CheckmarkIcon className="absolute -top-1.5 -right-1.5 w-4 h-4 text-slate-200" />}
        {yearStatus === 'partial' && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-300" />}
        {viewYear}
      </button>
      {tooltipYear && (
        <StartEndTooltip
          position="bottom"
          onStart={(e) => { e.stopPropagation(); onSetYearStart(); }}
          onEnd={(e) => { e.stopPropagation(); onSetYearEnd(); }}
        />
      )}
    </div>
    <button
      onClick={() => setViewMonth(addYears(viewMonth, 1))}
      className="px-3 py-2 rounded-lg bg-black/70 hover:bg-black/60 text-base font-bold text-slate-200 border border-slate-700/50"
      title="Next year"
    >
      ›
    </button>
  </div>
);
