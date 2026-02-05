import { useMemo, useState } from 'react';
import { addDays, addYears, endOfMonth, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import type { Range, SelectionStatus } from './calendarSelectorTypes';

interface UseCalendarSelectorStateParams {
  initialMonth?: Date | null;
  initialRange?: Range | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  availableDates?: Set<string> | null;
  onClear?: () => void;
  onApply?: (selection: { range: Range | null }) => void;
}

export const useCalendarSelectorState = ({
  initialMonth,
  initialRange,
  minDate,
  maxDate,
  availableDates,
  onClear,
  onApply,
}: UseCalendarSelectorStateParams) => {
  const [viewMonth, setViewMonth] = useState<Date>(() => initialMonth ?? initialRange?.start ?? maxDate ?? new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(() => initialRange?.start ?? null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(() => initialRange?.end ?? null);
  const [tooltipDay, setTooltipDay] = useState<Date | null>(null);
  const [tooltipWeek, setTooltipWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [tooltipMonth, setTooltipMonth] = useState<number | null>(null);
  const [tooltipYear, setTooltipYear] = useState(false);
  const [jumpHighlightDay, setJumpHighlightDay] = useState<Date | null>(null);

  const today = useMemo(() => maxDate ?? new Date(), [maxDate]);
  const viewYear = viewMonth.getFullYear();
  const hasSelection = rangeStart !== null && rangeEnd !== null;

  const sortedValidDates = useMemo(() => {
    if (!availableDates) return [];
    return Array.from(availableDates)
      .map((s) => new Date(`${s}T12:00:00`))
      .filter((d) => (!minDate || d >= minDate) && (!maxDate || d <= maxDate))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [availableDates, minDate, maxDate]);

  const yearHasData = useMemo(() => {
    return sortedValidDates.some((d) => d.getFullYear() === viewYear);
  }, [sortedValidDates, viewYear]);

  const validDateSet = useMemo(() => {
    return new Set(sortedValidDates.map((d) => format(d, 'yyyy-MM-dd')));
  }, [sortedValidDates]);

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

  const isDisabled = (d: Date) => (minDate && d < minDate) || (maxDate && d > maxDate);
  const hasData = (d: Date) => !availableDates || validDateSet.has(format(d, 'yyyy-MM-dd'));
  const isValidGymDay = (d: Date) => hasData(d) && !isDisabled(d);
  const weekHasData = (week: Date[]) => week.some(isValidGymDay);
  const isInRange = (d: Date) => rangeStart && rangeEnd && d >= rangeStart && d <= rangeEnd;

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

  const getSelectionStatus = (first: Date | null, last: Date | null): SelectionStatus => {
    if (!first || !last || !rangeStart || !rangeEnd) return 'none';
    if (first >= rangeStart && last <= rangeEnd) return 'full';
    if ((first <= rangeEnd && last >= rangeStart) || isSameDay(first, rangeStart) || isSameDay(last, rangeEnd)) return 'partial';
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
    const { first, last } = getWeekValidRange(week[0]);
    return getSelectionStatus(first, last);
  };

  const isRangeEdge = (d: Date): 'start' | 'end' | null => {
    if (!rangeStart || !rangeEnd) return null;
    if (isSameDay(d, rangeStart)) return 'start';
    if (isSameDay(d, rangeEnd)) return 'end';
    return null;
  };

  const monthHasData = (year: number, month: number) => getMonthValidRange(year, month).first !== null;
  const isMonthDisabled = (year: number, month: number) => {
    if (minDate && endOfMonth(new Date(year, month, 1)) < minDate) return true;
    if (maxDate && new Date(year, month, 1) > maxDate) return true;
    return false;
  };

  const setAsStart = (date: Date, closeTooltip: () => void) => {
    setRangeStart(date);
    if (!rangeEnd || rangeEnd < date) setRangeEnd(date);
    closeTooltip();
  };

  const setAsEnd = (date: Date, closeTooltip: () => void) => {
    setRangeEnd(date);
    if (!rangeStart || rangeStart > date) setRangeStart(date);
    closeTooltip();
  };

  const handleDayClick = (day: Date) => {
    if (!isValidGymDay(day)) return;
    setTooltipWeek(null);
    setTooltipMonth(null);
    setTooltipYear(false);
    setTooltipDay(tooltipDay && isSameDay(tooltipDay, day) ? null : day);
  };

  const handleSetDayAsStart = (day: Date) => setAsStart(day, () => setTooltipDay(null));
  const handleSetDayAsEnd = (day: Date) => setAsEnd(day, () => setTooltipDay(null));

  const handleWeekClick = (weekStart: Date) => {
    setTooltipDay(null);
    setTooltipMonth(null);
    setTooltipYear(false);
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

  const handleMonthClick = (monthIndex: number) => {
    const isCurrentView = viewMonth.getMonth() === monthIndex && viewMonth.getFullYear() === viewYear;
    if (!isCurrentView) {
      setViewMonth(new Date(viewYear, monthIndex, 1));
      return;
    }
    setTooltipDay(null);
    setTooltipWeek(null);
    setTooltipYear(false);
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

  const handleYearClick = () => {
    const { first, last } = getYearValidRange(viewYear);
    if (!first || !last) return;
    setTooltipDay(null);
    setTooltipWeek(null);
    setTooltipMonth(null);
    setTooltipYear((v) => !v);
  };

  const handleSetYearAsStart = () => {
    const { first } = getYearValidRange(viewYear);
    if (first) setAsStart(first, () => setTooltipYear(false));
  };

  const handleSetYearAsEnd = () => {
    const { last } = getYearValidRange(viewYear);
    if (last) setAsEnd(last, () => setTooltipYear(false));
  };

  const handleClear = () => {
    setRangeStart(null);
    setRangeEnd(null);
    onClear?.();
  };

  const handleGoToToday = () => {
    setViewMonth(startOfMonth(today));
    setTooltipDay(null);
    setTooltipWeek(null);
    setTooltipMonth(null);
    setTooltipYear(false);
    setJumpHighlightDay(today);
    setTimeout(() => setJumpHighlightDay(null), 1200);
  };

  const handleApply = () => {
    onApply?.({ range: hasSelection ? { start: rangeStart!, end: rangeEnd! } : null });
  };

  const jumpToDate = (d: Date) => {
    setViewMonth(startOfMonth(d));
    setJumpHighlightDay(d);
    setTimeout(() => setJumpHighlightDay(null), 1200);
  };

  const yearStatus = getYearStatus();

  return {
    viewMonth,
    setViewMonth,
    viewYear,
    rangeStart,
    rangeEnd,
    hasSelection,
    tooltipDay,
    tooltipWeek,
    tooltipMonth,
    tooltipYear,
    jumpHighlightDay,
    today,
    yearHasData,
    weeks,
    isDisabled,
    isValidGymDay,
    weekHasData,
    isInRange,
    isMonthDisabled,
    monthHasData,
    getWeekStatus,
    getMonthStatus,
    yearStatus,
    isRangeEdge,
    handleDayClick,
    handleSetDayAsStart,
    handleSetDayAsEnd,
    handleWeekClick,
    handleSetWeekAsStart,
    handleSetWeekAsEnd,
    handleMonthClick,
    handleSetMonthAsStart,
    handleSetMonthAsEnd,
    handleYearClick,
    handleSetYearAsStart,
    handleSetYearAsEnd,
    handleClear,
    handleGoToToday,
    handleApply,
    jumpToDate,
  };
};
