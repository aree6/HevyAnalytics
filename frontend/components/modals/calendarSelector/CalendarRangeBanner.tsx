import React from 'react';
import { formatDayYearContraction } from '../../../utils/date/dateUtils';
import { isSameDay } from 'date-fns';
import type { Range } from './calendarSelectorTypes';

interface CalendarRangeBannerProps {
  hasSelection: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  jumpToDate: (d: Date) => void;
  onClear: () => void;
  onGoToToday: () => void;
}

export const CalendarRangeBanner: React.FC<CalendarRangeBannerProps> = ({
  hasSelection,
  rangeStart,
  rangeEnd,
  jumpToDate,
  onClear,
  onGoToToday,
}) => {
  if (!hasSelection) {
    return (
      <div className="mb-3 px-2 flex justify-end">
        <button
          onClick={onGoToToday}
          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/5 text-slate-200 font-semibold transition-colors"
          title="Go to today"
        >
          Today
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 px-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Selected Range</div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <button
              onClick={() => rangeStart && jumpToDate(rangeStart)}
              className="px-2 py-0.5 rounded-md bg-black/50 hover:bg-white/5 text-slate-200 transition-colors"
              title="Go to start date"
            >
              {rangeStart ? formatDayYearContraction(rangeStart) : ''}
            </button>
            {rangeStart && rangeEnd && !isSameDay(rangeStart, rangeEnd) && (
              <>
                <span className="text-slate-500">↔</span>
                <button
                  onClick={() => jumpToDate(rangeEnd)}
                  className="px-2 py-0.5 rounded-md bg-black/50 hover:bg-white/5 text-slate-200 transition-colors"
                  title="Go to end date"
                >
                  {formatDayYearContraction(rangeEnd)}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/5 text-slate-200 font-semibold transition-colors"
            title="Clear selection"
          >
            Clear
          </button>
          <button
            onClick={onGoToToday}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/5 text-slate-200 font-semibold transition-colors"
            title="Go to today"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
};
