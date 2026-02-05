import React from 'react';
import { MONTH_LABELS, MONTH_NAMES } from './calendarSelectorConstants';
import { CheckmarkIcon, PartialDot, StartEndTooltip } from './CalendarSelectorParts';
import type { SelectionStatus } from './calendarSelectorTypes';

interface CalendarMonthRowProps {
  viewYear: number;
  viewMonth: Date;
  tooltipMonth: number | null;
  isMonthDisabled: (year: number, month: number) => boolean;
  monthHasData: (year: number, month: number) => boolean;
  getMonthStatus: (year: number, month: number) => SelectionStatus;
  onMonthClick: (monthIndex: number) => void;
  onSetMonthStart: (monthIndex: number) => void;
  onSetMonthEnd: (monthIndex: number) => void;
}

export const CalendarMonthRow: React.FC<CalendarMonthRowProps> = ({
  viewYear,
  viewMonth,
  tooltipMonth,
  isMonthDisabled,
  monthHasData,
  getMonthStatus,
  onMonthClick,
  onSetMonthStart,
  onSetMonthEnd,
}) => (
  <div className="grid grid-cols-12 gap-1.5 mb-3">
    {MONTH_LABELS.map((label, idx) => {
      const disabled = isMonthDisabled(viewYear, idx);
      const hasDataInMonth = monthHasData(viewYear, idx);
      const isCurrentView = viewMonth.getMonth() === idx && viewMonth.getFullYear() === viewYear;
      const status = getMonthStatus(viewYear, idx);
      const showTooltip = tooltipMonth === idx && isCurrentView;

      return (
        <div key={idx} className="relative">
          <button
            onClick={() => !disabled && hasDataInMonth && onMonthClick(idx)}
            disabled={disabled || !hasDataInMonth}
            className={`group relative aspect-square w-full rounded-md flex items-center justify-center text-[11px] font-semibold border-2 transition-all duration-200
              ${status === 'full' ? 'border-slate-500/60 bg-white/10 text-white'
                : status === 'partial' ? 'border-slate-600/60 bg-white/5 text-slate-200'
                : isCurrentView ? (hasDataInMonth ? 'border-emerald-500/30 bg-emerald-500/10 text-slate-200' : 'border-slate-600/60 bg-black/50 text-slate-200')
                : (hasDataInMonth ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-200 hover:bg-emerald-500/10' : 'border-slate-700/50 bg-black/70 text-slate-300 hover:bg-white/5')}
              ${disabled || !hasDataInMonth ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              ${showTooltip ? '' : ''}
            `}
            title={`${MONTH_NAMES[idx]}${isCurrentView ? ' (click again to select)' : ''}`}
          >
            <span className="relative z-10">{label}</span>
            {status === 'full' && <CheckmarkIcon className="absolute -top-1 -right-1 w-3 h-3 text-slate-200" />}
            {status === 'partial' && <PartialDot className="absolute -top-0.5 -right-0.5 w-2 h-2" />}
          </button>
          {showTooltip && (
            <StartEndTooltip
              position="bottom"
              onStart={(e) => { e.stopPropagation(); onSetMonthStart(idx); }}
              onEnd={(e) => { e.stopPropagation(); onSetMonthEnd(idx); }}
            />
          )}
        </div>
      );
    })}
  </div>
);
