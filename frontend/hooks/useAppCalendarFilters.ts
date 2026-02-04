import { useState, useMemo, useCallback } from 'react';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { WorkoutSet } from '../types';
import { formatDayYearContraction, formatHumanReadableDate } from '../utils/date/dateUtils';

export interface UseAppCalendarFiltersReturn {
  selectedMonth: string;
  selectedDay: Date | null;
  selectedRange: { start: Date; end: Date } | null;
  selectedWeeks: Array<{ start: Date; end: Date }>;
  calendarOpen: boolean;
  availableMonths: string[];
  filteredData: WorkoutSet[];
  hasActiveCalendarFilter: boolean;
  calendarSummaryText: string;
  minDate: Date | null;
  maxDate: Date | null;
  availableDatesSet: Set<string>;
  filterCacheKey: string;
  setSelectedMonth: (month: string) => void;
  setSelectedDay: (day: Date | null) => void;
  setSelectedRange: (range: { start: Date; end: Date } | null) => void;
  setSelectedWeeks: (weeks: Array<{ start: Date; end: Date }>) => void;
  setCalendarOpen: (open: boolean) => void;
  toggleCalendarOpen: () => void;
  clearAllFilters: () => void;
}

export interface UseAppCalendarFiltersProps {
  parsedData: WorkoutSet[];
  effectiveNow: Date;
}

export function useAppCalendarFilters({
  parsedData,
  effectiveNow,
}: UseAppCalendarFiltersProps): UseAppCalendarFiltersReturn {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<Array<{ start: Date; end: Date }>>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Available months for filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    parsedData.forEach(d => {
      if (d.parsedDate) {
        months.add(format(d.parsedDate, 'yyyy-MM'));
      }
    });
    return Array.from(months).sort().reverse();
  }, [parsedData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return parsedData.filter(d => {
      if (!d.parsedDate) return false;
      if (selectedDay) return isSameDay(d.parsedDate, selectedDay);
      if (selectedWeeks.length > 0) {
        return selectedWeeks.some(r => isWithinInterval(d.parsedDate as Date, {
          start: startOfDay(r.start),
          end: endOfDay(r.end),
        }));
      }
      if (selectedRange) {
        return isWithinInterval(d.parsedDate as Date, {
          start: startOfDay(selectedRange.start),
          end: endOfDay(selectedRange.end),
        });
      }
      if (selectedMonth !== 'all') return format(d.parsedDate, 'yyyy-MM') === selectedMonth;
      return true;
    });
  }, [parsedData, selectedMonth, selectedDay, selectedRange, selectedWeeks]);

  const hasActiveCalendarFilter = !!selectedDay || selectedWeeks.length > 0 || !!selectedRange;

  const calendarSummaryText = useMemo(() => {
    if (selectedDay) return formatHumanReadableDate(selectedDay, { now: effectiveNow });
    if (selectedRange) return `${formatDayYearContraction(selectedRange.start)} – ${formatDayYearContraction(selectedRange.end)}`;
    if (selectedWeeks.length === 1) return `${formatDayYearContraction(selectedWeeks[0].start)} – ${formatDayYearContraction(selectedWeeks[0].end)}`;
    if (selectedWeeks.length > 1) return `Weeks: ${selectedWeeks.length}`;
    return 'No filter';
  }, [effectiveNow, selectedDay, selectedRange, selectedWeeks]);

  // Calendar boundaries
  const { minDate, maxDate, availableDatesSet } = useMemo(() => {
    let minTs = Number.POSITIVE_INFINITY;
    let maxTs = 0;
    const set = new Set<string>();
    parsedData.forEach(d => {
      if (!d.parsedDate) return;
      const ts = d.parsedDate.getTime();
      if (ts < minTs) minTs = ts;
      if (ts > maxTs) maxTs = ts;
      set.add(format(d.parsedDate, 'yyyy-MM-dd'));
    });
    const today = new Date();
    const minDate = isFinite(minTs) ? startOfDay(new Date(minTs)) : null;
    const maxInData = maxTs > 0 ? endOfDay(new Date(maxTs)) : null;
    const maxDate = maxInData ?? (effectiveNow.getTime() > 0 ? endOfDay(effectiveNow) : endOfDay(today));
    return { minDate, maxDate, availableDatesSet: set };
  }, [effectiveNow, parsedData]);

  // Simple cache key
  const filterCacheKey = useMemo(() => {
    const parts: string[] = [];
    if (selectedMonth !== 'all') parts.push(`m:${selectedMonth}`);
    if (selectedDay) parts.push(`d:${selectedDay.toISOString()}`);
    if (selectedRange) parts.push(`r:${selectedRange.start.toISOString()}-${selectedRange.end.toISOString()}`);
    if (selectedWeeks.length > 0) parts.push(`w:${selectedWeeks.length}`);
    return parts.join('|') || 'all';
  }, [selectedMonth, selectedDay, selectedRange, selectedWeeks]);

  const toggleCalendarOpen = useCallback(() => {
    setCalendarOpen(prev => !prev);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedRange(null);
    setSelectedDay(null);
    setSelectedWeeks([]);
    setSelectedMonth('all');
  }, []);

  return {
    selectedMonth,
    selectedDay,
    selectedRange,
    selectedWeeks,
    calendarOpen,
    availableMonths,
    filteredData,
    hasActiveCalendarFilter,
    calendarSummaryText,
    minDate,
    maxDate,
    availableDatesSet,
    filterCacheKey,
    setSelectedMonth,
    setSelectedDay,
    setSelectedRange,
    setSelectedWeeks,
    setCalendarOpen,
    toggleCalendarOpen,
    clearAllFilters,
  };
}
