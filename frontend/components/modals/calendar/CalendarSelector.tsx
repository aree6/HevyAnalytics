import React from 'react';
import type { Range } from '../calendarSelector/calendarSelectorTypes';
import { CalendarSelectorView } from '../calendarSelector/CalendarSelectorView';
import { useCalendarSelectorState } from '../calendarSelector/useCalendarSelectorState';

interface CalendarSelectorProps {
  mode?: 'day' | 'week' | 'both';
  initialMonth?: Date | null;
  initialRange?: Range | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  availableDates?: Set<string> | null;
  multipleWeeks?: boolean;
  onSelectWeek?: (range: Range) => void;
  onSelectWeeks?: (ranges: Range[]) => void;
  onSelectDay?: (day: Date) => void;
  onSelectMonth?: (range: Range) => void;
  onSelectYear?: (range: Range) => void;
  onClear?: () => void;
  onClose?: () => void;
  onApply?: (selection: { range: Range | null }) => void;
}

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  mode = 'both',
  initialMonth = null,
  initialRange = null,
  minDate = null,
  maxDate = null,
  availableDates = null,
  multipleWeeks = false,
  onSelectWeek,
  onClear,
  onClose,
  onApply,
}) => {
  const state = useCalendarSelectorState({
    initialMonth,
    initialRange,
    minDate,
    maxDate,
    availableDates,
    onClear,
    onApply,
  });

  return (
    <CalendarSelectorView
      mode={mode}
      multipleWeeks={multipleWeeks}
      viewMonth={state.viewMonth}
      setViewMonth={state.setViewMonth}
      viewYear={state.viewYear}
      yearStatus={state.yearStatus}
      yearHasData={state.yearHasData}
      tooltipYear={state.tooltipYear}
      tooltipMonth={state.tooltipMonth}
      tooltipWeek={state.tooltipWeek}
      tooltipDay={state.tooltipDay}
      jumpHighlightDay={state.jumpHighlightDay}
      today={state.today}
      weeks={state.weeks}
      hasSelection={state.hasSelection}
      rangeStart={state.rangeStart}
      rangeEnd={state.rangeEnd}
      isMonthDisabled={state.isMonthDisabled}
      monthHasData={state.monthHasData}
      getMonthStatus={state.getMonthStatus}
      getWeekStatus={state.getWeekStatus}
      isDisabled={state.isDisabled}
      isValidGymDay={state.isValidGymDay}
      weekHasData={state.weekHasData}
      isInRange={state.isInRange}
      isRangeEdge={state.isRangeEdge}
      onYearClick={state.handleYearClick}
      onSetYearStart={state.handleSetYearAsStart}
      onSetYearEnd={state.handleSetYearAsEnd}
      onMonthClick={state.handleMonthClick}
      onSetMonthStart={state.handleSetMonthAsStart}
      onSetMonthEnd={state.handleSetMonthAsEnd}
      onWeekClick={state.handleWeekClick}
      onSetWeekStart={state.handleSetWeekAsStart}
      onSetWeekEnd={state.handleSetWeekAsEnd}
      onSelectWeek={onSelectWeek}
      onDayClick={state.handleDayClick}
      onSetDayStart={state.handleSetDayAsStart}
      onSetDayEnd={state.handleSetDayAsEnd}
      onClear={state.handleClear}
      onGoToToday={state.handleGoToToday}
      onApply={state.handleApply}
      jumpToDate={state.jumpToDate}
      onClose={onClose}
    />
  );
};
