import React, { useMemo, useState } from 'react';
import { addYears, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay, format } from 'date-fns';
import { formatDayYearContraction, formatDayContraction } from '../utils/dateUtils';

// ============================================================================
// Types
// ============================================================================

type Range = { start: Date; end: Date };
type SelectionStatus = 'full' | 'partial' | 'none';

interface CalendarSelectorProps {
  mode?: 'day' | 'week' | 'both';
  initialMonth?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  availableDates?: Set<string> | null;
  multipleWeeks?: boolean;
  onSelectWeek?: (range: Range) => void;
  onClear?: () => void;
  onClose?: () => void;
  onApply?: (selection: { range: Range | null }) => void;
}

// ============================================================================
// Constants
// ============================================================================

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ============================================================================
// Reusable Sub-Components
// ============================================================================

/** Tooltip with Start/End buttons for range selection */
const StartEndTooltip: React.FC<{
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
    <div className={`absolute z-50 ${positionClasses[position]} flex gap-1 bg-slate-900 border border-slate-600 rounded-lg p-1 shadow-xl`}>
      <button
        onClick={onStart}
        className="px-2 py-1 text-[10px] font-bold rounded bg-green-700 hover:bg-green-600 text-white whitespace-nowrap"
      >
        Start
      </button>
      <button
        onClick={onEnd}
        className="px-2 py-1 text-[10px] font-bold rounded bg-red-700 hover:bg-red-600 text-white whitespace-nowrap"
      >
        End
      </button>
    </div>
  );
};

/** Checkmark icon for full selection */
const CheckmarkIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg fill="currentColor" viewBox="0 0 20 20" className={className}>
    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" fillRule="evenodd" />
  </svg>
);

/** Dot indicator for partial selection */
const PartialDot: React.FC<{ className?: string }> = ({ className = 'w-2 h-2' }) => (
  <span className={`${className} rounded-full bg-blue-400`} />
);

// ============================================================================
// Main Component
// ============================================================================

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({ 
  mode = 'both', 
  initialMonth = null, 
  minDate = null, 
  maxDate = null, 
  availableDates = null, 
  multipleWeeks = false, 
  onSelectWeek,
  onClear,
  onClose,
  onApply
}) => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [viewMonth, setViewMonth] = useState<Date>(initialMonth ?? new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [tooltipDay, setTooltipDay] = useState<Date | null>(null);
  const [tooltipWeek, setTooltipWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [tooltipMonth, setTooltipMonth] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const viewYear = viewMonth.getFullYear();
  const hasSelection = rangeStart !== null && rangeEnd !== null;

  // ---------------------------------------------------------------------------
  // Memoized Data
  // ---------------------------------------------------------------------------
  
  /** Sorted array of valid gym dates within constraints */
  const sortedValidDates = useMemo(() => {
    if (!availableDates) return [];
    return Array.from(availableDates)
      .map(s => new Date(`${s}T12:00:00`))
      .filter(d => d <= today && (!minDate || d >= minDate) && (!maxDate || d <= maxDate))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [availableDates, today, minDate, maxDate]);

  /** Set for O(1) lookup of valid dates */
  const validDateSet = useMemo(() => {
    return new Set(sortedValidDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [sortedValidDates]);

  /** 6 weeks of dates for the current view month */
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const rows: Date[][] = [];
    let curr = start;
    for (let r = 0; r < 6; r++) {
      const row: Date[] = [];
      for (let c = 0; c < 7; c++) {
        row.push(curr);
        curr = addDays(curr, 1);
      }
      rows.push(row);
    }
    return rows;
  }, [viewMonth]);

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  const isDisabled = (d: Date) => d > today || (minDate && d < minDate) || (maxDate && d > maxDate);
  const hasData = (d: Date) => !availableDates || validDateSet.has(format(d, 'yyyy-MM-dd'));
  const isValidGymDay = (d: Date) => hasData(d) && !isDisabled(d);
  const weekHasData = (week: Date[]) => week.some(isValidGymDay);
  const isInRange = (d: Date) => rangeStart && rangeEnd && d >= rangeStart && d <= rangeEnd;

  /** Get first and last valid gym day in a date range */
  const getValidRange = (startDate: Date, endDate: Date): { first: Date | null; last: Date | null } => {
    let first: Date | null = null;
    let last: Date | null = null;
    for (const d of sortedValidDates) {
      if (d >= startDate && d <= endDate) {
        if (!first) first = d;
        last = d;
      }
    }
    return { first, last };
  };

  const getMonthValidRange = (year: number, month: number) => 
    getValidRange(new Date(year, month, 1), endOfMonth(new Date(year, month, 1)));

  const getYearValidRange = (year: number) => 
    getValidRange(new Date(year, 0, 1), new Date(year, 11, 31));

  const getWeekValidRange = (weekStart: Date) => {
    let first: Date | null = null;
    let last: Date | null = null;
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      if (isValidGymDay(d)) {
        if (!first) first = d;
        last = d;
      }
    }
    return { first, last };
  };

  /** Get selection status for a date range */
  const getSelectionStatus = (first: Date | null, last: Date | null): SelectionStatus => {
    if (!rangeStart || !rangeEnd || !first || !last) return 'none';
    const firstInRange = first >= rangeStart && first <= rangeEnd;
    const lastInRange = last >= rangeStart && last <= rangeEnd;
    if (firstInRange && lastInRange) return 'full';
    if (firstInRange || lastInRange) return 'partial';
    if (rangeStart <= first && rangeEnd >= last) return 'full';
    if ((rangeStart >= first && rangeStart <= last) || (rangeEnd >= first && rangeEnd <= last)) return 'partial';
    return 'none';
  };

  const getMonthStatus = (year: number, month: number): SelectionStatus => {
    const { first, last } = getMonthValidRange(year, month);
    return getSelectionStatus(first, last);
  };

  const getYearStatus = (): SelectionStatus => {
    const { first, last } = getYearValidRange(viewYear);
    return getSelectionStatus(first, last);
  };

  const getWeekStatus = (week: Date[]): SelectionStatus => {
    const validDays = week.filter(isValidGymDay);
    if (validDays.length === 0) return 'none';
    const inRangeCount = validDays.filter(d => isInRange(d)).length;
    if (inRangeCount === validDays.length) return 'full';
    if (inRangeCount > 0) return 'partial';
    return 'none';
  };

  const monthHasData = (year: number, month: number) => getMonthValidRange(year, month).first !== null;
  
  const isMonthDisabled = (year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);
    return monthStart > today || (minDate && monthEnd < minDate) || (maxDate && monthStart > maxDate);
  };

  const isRangeEdge = (d: Date): 'start' | 'end' | null => {
    if (!rangeStart || !rangeEnd) return null;
    if (isSameDay(d, rangeStart)) return 'start';
    if (isSameDay(d, rangeEnd)) return 'end';
    return null;
  };

  // ---------------------------------------------------------------------------
  // Range Selection Handlers
  // ---------------------------------------------------------------------------

  /** Set a date as range start, adjusting end if needed */
  const setAsStart = (date: Date, closeTooltip: () => void) => {
    setRangeStart(date);
    if (!rangeEnd || rangeEnd < date) setRangeEnd(date);
    closeTooltip();
  };

  /** Set a date as range end, adjusting start if needed */
  const setAsEnd = (date: Date, closeTooltip: () => void) => {
    setRangeEnd(date);
    if (!rangeStart || rangeStart > date) setRangeStart(date);
    closeTooltip();
  };

  // Day handlers
  const handleDayClick = (day: Date) => {
    if (!isValidGymDay(day)) return;
    setTooltipDay(tooltipDay && isSameDay(tooltipDay, day) ? null : day);
  };

  const handleSetDayAsStart = (day: Date) => setAsStart(day, () => setTooltipDay(null));
  const handleSetDayAsEnd = (day: Date) => setAsEnd(day, () => setTooltipDay(null));

  // Week handlers
  const handleWeekClick = (weekStart: Date) => {
    setTooltipWeek(tooltipWeek && isSameDay(tooltipWeek.start, weekStart) 
      ? null 
      : { start: weekStart, end: addDays(weekStart, 6) });
  };

  const handleSetWeekAsStart = (weekStart: Date) => {
    const { first } = getWeekValidRange(weekStart);
    if (first) setAsStart(first, () => setTooltipWeek(null));
  };

  const handleSetWeekAsEnd = (weekStart: Date) => {
    const { last } = getWeekValidRange(weekStart);
    if (last) setAsEnd(last, () => setTooltipWeek(null));
  };

  // Month handlers
  const handleMonthClick = (monthIndex: number) => {
    const isCurrentView = viewMonth.getMonth() === monthIndex && viewMonth.getFullYear() === viewYear;
    if (!isCurrentView) {
      setViewMonth(new Date(viewYear, monthIndex, 1));
      return;
    }
    setTooltipMonth(tooltipMonth === monthIndex ? null : monthIndex);
  };

  const handleSetMonthAsStart = (monthIndex: number) => {
    const { first } = getMonthValidRange(viewYear, monthIndex);
    if (first) setAsStart(first, () => setTooltipMonth(null));
  };

  const handleSetMonthAsEnd = (monthIndex: number) => {
    const { last } = getMonthValidRange(viewYear, monthIndex);
    if (last) setAsEnd(last, () => setTooltipMonth(null));
  };

  // Year handler
  const handleYearClick = () => {
    const { first, last } = getYearValidRange(viewYear);
    if (!first || !last) return;

    if (!rangeStart || !rangeEnd) {
      setRangeStart(first);
      setRangeEnd(last);
      return;
    }

    const yearStatus = getYearStatus();
    if (yearStatus === 'full') {
      setRangeStart(null);
      setRangeEnd(null);
    } else {
      const newStart = first < rangeStart ? first : rangeStart;
      const newEnd = last > rangeEnd ? last : rangeEnd;
      setRangeStart(newStart);
      setRangeEnd(newEnd);
    }
  };

  // Clear and Apply
  const handleClear = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setViewMonth(new Date());
    onClear?.();
  };

  const handleApply = () => {
    onApply?.({ range: hasSelection ? { start: rangeStart!, end: rangeEnd! } : null });
  };

  const yearStatus = getYearStatus();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative z-10 bg-black/90 border border-slate-700/50 rounded-2xl p-4 pt-6 w-[440px] max-w-[94vw] text-slate-200 shadow-2xl">
      {/* Close button (desktop) */}
      <button
        onClick={onClose}
        className="hidden sm:flex absolute top-0 right-0 -translate-y-[35%] translate-x-[35%] w-8 h-8 rounded-full bg-red-950/70 hover:bg-red-950 border border-red-500/40 items-center justify-center text-red-200 hover:text-white z-10 shadow-lg"
        title="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Range display banner */}
      {hasSelection && (
        <div className="mb-3 px-3 py-2 bg-blue-950/50 border border-blue-500/30 rounded-lg text-center">
          <div className="text-[10px] text-blue-300 uppercase tracking-wide mb-1">Selected Range</div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <button
              onClick={() => setViewMonth(startOfMonth(rangeStart!))}
              className="px-2 py-0.5 rounded bg-green-900/50 hover:bg-green-800/60 border border-green-500/40 text-green-200 hover:text-green-100 transition-colors"
              title="Go to start date"
            >
              {formatDayYearContraction(rangeStart!)}
            </button>
            {!isSameDay(rangeStart!, rangeEnd!) && (
              <>
                <span className="text-blue-400">→</span>
                <button
                  onClick={() => setViewMonth(startOfMonth(rangeEnd!))}
                  className="px-2 py-0.5 rounded bg-red-900/50 hover:bg-red-800/60 border border-red-500/40 text-red-200 hover:text-red-100 transition-colors"
                  title="Go to end date"
                >
                  {formatDayYearContraction(rangeEnd!)}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Year navigation */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => setViewMonth(addYears(viewMonth, -1))}
          className="px-3 py-2 rounded-lg bg-black/70 hover:bg-black/60 text-base font-bold text-slate-200 border border-slate-700/50"
          title="lst yr"
        >
          ‹
        </button>
        <button
          onClick={handleYearClick}
          className={`relative px-4 py-1.5 rounded-lg font-bold text-sm border-2 transition-all duration-200 min-w-[80px] ${
            yearStatus === 'full' ? 'border-blue-500 bg-blue-500 text-white'
              : yearStatus === 'partial' ? 'border-blue-400 bg-blue-900/60 text-blue-200'
              : 'border-slate-600 bg-slate-800 text-white hover:border-blue-400'
          }`}
          title="Click to select/deselect entire year"
        >
          {yearStatus === 'full' && <CheckmarkIcon className="absolute -top-1.5 -right-1.5 w-4 h-4 text-blue-300" />}
          {yearStatus === 'partial' && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400" />}
          {viewYear}
        </button>
        <button
          onClick={() => setViewMonth(addYears(viewMonth, 1))}
          className="px-3 py-2 rounded-lg bg-black/70 hover:bg-black/60 text-base font-bold text-slate-200 border border-slate-700/50"
          title="Next year"
        >
          ›
        </button>
      </div>

      {/* Month row */}
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
                onClick={() => !disabled && hasDataInMonth && handleMonthClick(idx)}
                disabled={disabled || !hasDataInMonth}
                className={`group relative aspect-square w-full rounded-md flex items-center justify-center text-[11px] font-semibold border-2 transition-all duration-200
                  ${status === 'full' ? 'border-blue-500 bg-blue-500 text-white' 
                    : status === 'partial' ? 'border-blue-400 bg-blue-900/60 text-blue-200'
                    : isCurrentView ? 'border-blue-400 bg-blue-900/40 text-blue-200'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-blue-400'}
                  ${disabled || !hasDataInMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                  ${showTooltip ? 'ring-2 ring-yellow-400' : ''}
                `}
                title={`${MONTH_NAMES[idx]}${isCurrentView ? ' (click again to select)' : ''}`}
              >
                {status === 'full' && <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-md" />}
                <span className="relative z-10">{label}</span>
                {status === 'full' && <CheckmarkIcon className="absolute -top-1 -right-1 w-3 h-3 text-blue-300" />}
                {status === 'partial' && <PartialDot className="absolute -top-0.5 -right-0.5 w-2 h-2" />}
              </button>
              {showTooltip && (
                <StartEndTooltip
                  position="bottom"
                  onStart={(e) => { e.stopPropagation(); handleSetMonthAsStart(idx); }}
                  onEnd={(e) => { e.stopPropagation(); handleSetMonthAsEnd(idx); }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Day headers */}
      <div className={`grid ${mode !== 'day' ? 'grid-cols-8' : 'grid-cols-7'} gap-1 text-[10px] text-slate-400 mb-1`}>
        {mode !== 'day' && <div className="text-center opacity-0">Wk</div>}
        {DAY_HEADERS.map(d => <div key={d} className="text-center">{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIdx) => {
          const weekStart = week[0];
          const weekEnd = week[6];
          const enabledWeek = weekHasData(week);
          const weekStatus = getWeekStatus(week);
          const showWeekTooltip = tooltipWeek && isSameDay(tooltipWeek.start, weekStart);

          return (
            <div key={weekIdx} className={`flex items-center gap-1 ${weekStatus === 'full' ? 'rounded-md bg-blue-900/10' : ''}`}>
              {/* Week checkbox */}
              {mode !== 'day' && (
                multipleWeeks ? (
                  <div className="relative">
                    <button 
                      className={`group flex items-center justify-center cursor-pointer shrink-0 w-6 h-6 rounded-md border-2 transition-all duration-200
                        ${!enabledWeek ? 'opacity-40 cursor-not-allowed border-slate-700 bg-slate-800' : ''}
                        ${weekStatus === 'full' ? 'border-blue-500 bg-blue-500' : ''}
                        ${weekStatus === 'partial' ? 'border-blue-400 bg-blue-900/60' : ''}
                        ${weekStatus === 'none' && enabledWeek ? 'border-slate-600 bg-slate-800 hover:border-blue-400 hover:scale-105' : ''}
                        ${showWeekTooltip ? 'ring-2 ring-yellow-400' : ''}
                      `}
                      onClick={() => enabledWeek && handleWeekClick(weekStart)}
                      disabled={!enabledWeek}
                      title={`${formatDayContraction(weekStart)}–${formatDayContraction(weekEnd)}`}
                    >
                      {weekStatus === 'full' && <CheckmarkIcon className="w-3 h-3 text-white" />}
                      {weekStatus === 'partial' && <PartialDot />}
                    </button>
                    {showWeekTooltip && (
                      <StartEndTooltip
                        position="right"
                        onStart={(e) => { e.stopPropagation(); handleSetWeekAsStart(weekStart); }}
                        onEnd={(e) => { e.stopPropagation(); handleSetWeekAsEnd(weekStart); }}
                      />
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectWeek && enabledWeek && onSelectWeek({ start: weekStart, end: weekEnd })}
                    className={`text-[9px] px-1.5 py-1 rounded border w-[72px] shrink-0 truncate ${
                      enabledWeek ? 'bg-black/70 hover:bg-black/60 border-slate-700/50' : 'bg-black/40 border-slate-700/50 opacity-40 cursor-not-allowed'
                    }`}
                    title={`${formatDayContraction(weekStart)}–${formatDayContraction(weekEnd)}`}
                  >
                    {format(weekStart, 'M/d')}–{format(weekEnd, 'd')}
                  </button>
                )
              )}

              {/* Days */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {week.map((day) => {
                  const disabled = isDisabled(day);
                  const hasWorkout = isValidGymDay(day);
                  const inMonth = isSameMonth(day, viewMonth);
                  const isToday = isSameDay(day, today);
                  const inRange = isInRange(day);
                  const edge = isRangeEdge(day);
                  const isStart = edge === 'start';
                  const isEnd = edge === 'end';
                  const showDayTooltip = tooltipDay && isSameDay(tooltipDay, day);
                  
                  return (
                    <div key={day.toISOString()} className="relative">
                      <button
                        onClick={() => mode !== 'week' && hasWorkout && handleDayClick(day)}
                        disabled={disabled || !hasWorkout}
                        className={`relative w-full h-7 rounded flex items-center justify-center text-[11px] border-2 transition-colors
                          ${inRange
                            ? isStart || isEnd
                              ? 'border-blue-400 bg-blue-500 text-white font-bold shadow-md'
                              : 'border-blue-500 bg-blue-600 text-white font-medium'
                            : inMonth 
                              ? hasWorkout ? 'border-blue-600 bg-blue-900/40 text-blue-200 hover:bg-blue-700' : 'border-slate-700/50 text-slate-500'
                              : 'border-slate-800 text-slate-500'
                          }
                          ${isToday ? 'ring-1 ring-sky-400' : ''}
                          ${disabled || !hasWorkout ? 'opacity-30 cursor-not-allowed' : ''}
                          ${showDayTooltip ? 'ring-2 ring-yellow-400' : ''}
                        `}
                      >
                        {format(day, 'd')}
                        {isStart && hasSelection && !isSameDay(rangeStart!, rangeEnd!) && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] text-green-300 font-bold">S</span>
                        )}
                        {isEnd && hasSelection && !isSameDay(rangeStart!, rangeEnd!) && (
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-red-300 font-bold">E</span>
                        )}
                      </button>
                      {showDayTooltip && (
                        <StartEndTooltip
                          position="top"
                          onStart={(e) => { e.stopPropagation(); handleSetDayAsStart(day); }}
                          onEnd={(e) => { e.stopPropagation(); handleSetDayAsEnd(day); }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer buttons */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 text-[11px] px-3 py-2 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 border border-amber-500/30 text-amber-200 font-semibold transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          disabled={!hasSelection}
          className={`flex-1 text-[11px] px-3 py-2 rounded-lg font-semibold transition-colors ${
            hasSelection ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Apply
        </button>
      </div>

      {/* Mobile close button */}
      <button
        onClick={() => onClose?.()}
        className="sm:hidden mt-2 w-full text-[11px] px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-950 border border-red-500/40 text-red-200 font-semibold transition-colors"
      >
        Close
      </button>
    </div>
  );
};
