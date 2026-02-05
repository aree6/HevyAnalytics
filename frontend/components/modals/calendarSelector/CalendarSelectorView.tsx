import React from 'react';
import { CalendarRangeBanner } from './CalendarRangeBanner';
import { CalendarYearNav } from './CalendarYearNav';
import { CalendarMonthRow } from './CalendarMonthRow';
import { CalendarWeekGrid } from './CalendarWeekGrid';
import { CalendarFooter } from './CalendarFooter';
import type { Range, SelectionStatus } from './calendarSelectorTypes';

interface CalendarSelectorViewProps {
  mode: 'day' | 'week' | 'both';
  multipleWeeks: boolean;
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  viewYear: number;
  yearStatus: SelectionStatus;
  yearHasData: boolean;
  tooltipYear: boolean;
  tooltipMonth: number | null;
  tooltipWeek: { start: Date; end: Date } | null;
  tooltipDay: Date | null;
  jumpHighlightDay: Date | null;
  today: Date;
  weeks: Date[][];
  hasSelection: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  isMonthDisabled: (year: number, month: number) => boolean;
  monthHasData: (year: number, month: number) => boolean;
  getMonthStatus: (year: number, month: number) => SelectionStatus;
  getWeekStatus: (week: Date[]) => SelectionStatus;
  isDisabled: (d: Date) => boolean;
  isValidGymDay: (d: Date) => boolean;
  weekHasData: (week: Date[]) => boolean;
  isInRange: (d: Date) => boolean;
  isRangeEdge: (d: Date) => 'start' | 'end' | null;
  onYearClick: () => void;
  onSetYearStart: () => void;
  onSetYearEnd: () => void;
  onMonthClick: (monthIndex: number) => void;
  onSetMonthStart: (monthIndex: number) => void;
  onSetMonthEnd: (monthIndex: number) => void;
  onWeekClick: (weekStart: Date) => void;
  onSetWeekStart: (weekStart: Date) => void;
  onSetWeekEnd: (weekStart: Date) => void;
  onSelectWeek?: (range: Range) => void;
  onDayClick: (day: Date) => void;
  onSetDayStart: (day: Date) => void;
  onSetDayEnd: (day: Date) => void;
  onClear: () => void;
  onGoToToday: () => void;
  onApply: () => void;
  jumpToDate: (d: Date) => void;
  onClose?: () => void;
}

export const CalendarSelectorView: React.FC<CalendarSelectorViewProps> = ({
  mode,
  multipleWeeks,
  viewMonth,
  setViewMonth,
  viewYear,
  yearStatus,
  yearHasData,
  tooltipYear,
  tooltipMonth,
  tooltipWeek,
  tooltipDay,
  jumpHighlightDay,
  today,
  weeks,
  hasSelection,
  rangeStart,
  rangeEnd,
  isMonthDisabled,
  monthHasData,
  getMonthStatus,
  getWeekStatus,
  isDisabled,
  isValidGymDay,
  weekHasData,
  isInRange,
  isRangeEdge,
  onYearClick,
  onSetYearStart,
  onSetYearEnd,
  onMonthClick,
  onSetMonthStart,
  onSetMonthEnd,
  onWeekClick,
  onSetWeekStart,
  onSetWeekEnd,
  onSelectWeek,
  onDayClick,
  onSetDayStart,
  onSetDayEnd,
  onClear,
  onGoToToday,
  onApply,
  jumpToDate,
  onClose,
}) => (
  <div className="relative z-10 bg-black/90 border border-slate-700/50 rounded-2xl p-4 pt-6 w-[440px] max-w-[94vw] text-slate-200 shadow-2xl">
    <button
      onClick={onClose}
      className="hidden sm:flex absolute top-0 right-0 -translate-y-[35%] translate-x-[35%] w-8 h-8 rounded-full bg-red-950/70 hover:bg-red-950 border border-red-500/40 items-center justify-center text-red-200 hover:text-white z-10 shadow-lg"
      title="Close"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <CalendarRangeBanner
      hasSelection={hasSelection}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      jumpToDate={jumpToDate}
      onClear={onClear}
      onGoToToday={onGoToToday}
    />

    <CalendarYearNav
      viewMonth={viewMonth}
      setViewMonth={setViewMonth}
      viewYear={viewYear}
      yearStatus={yearStatus}
      yearHasData={yearHasData}
      tooltipYear={tooltipYear}
      onYearClick={onYearClick}
      onSetYearStart={onSetYearStart}
      onSetYearEnd={onSetYearEnd}
    />

    <CalendarMonthRow
      viewYear={viewYear}
      viewMonth={viewMonth}
      tooltipMonth={tooltipMonth}
      isMonthDisabled={isMonthDisabled}
      monthHasData={monthHasData}
      getMonthStatus={getMonthStatus}
      onMonthClick={onMonthClick}
      onSetMonthStart={onSetMonthStart}
      onSetMonthEnd={onSetMonthEnd}
    />

    <CalendarWeekGrid
      mode={mode}
      multipleWeeks={multipleWeeks}
      weeks={weeks}
      viewMonth={viewMonth}
      today={today}
      tooltipWeek={tooltipWeek}
      tooltipDay={tooltipDay}
      jumpHighlightDay={jumpHighlightDay}
      hasSelection={hasSelection}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      weekHasData={weekHasData}
      getWeekStatus={getWeekStatus}
      isDisabled={isDisabled}
      isValidGymDay={isValidGymDay}
      isInRange={isInRange}
      isRangeEdge={isRangeEdge}
      onWeekClick={onWeekClick}
      onSetWeekStart={onSetWeekStart}
      onSetWeekEnd={onSetWeekEnd}
      onSelectWeek={onSelectWeek}
      onDayClick={onDayClick}
      onSetDayStart={onSetDayStart}
      onSetDayEnd={onSetDayEnd}
    />

    <CalendarFooter
      hasSelection={hasSelection}
      onApply={onApply}
      onClose={onClose}
    />
  </div>
);
