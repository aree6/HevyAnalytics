import { useState, useMemo, useCallback } from 'react';
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { WorkoutSet } from '../../types';
import { formatDayYearContraction, formatHumanReadableDate } from '../../utils/date/dateUtils';

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

  // Normalized bounds, hoisted out of the per-set filter: startOfDay/endOfDay
  // were re-allocated for every set × every selected week on each keystroke.
  const normalizedWeeks = useMemo(
    () => selectedWeeks.map((r) => ({ start: startOfDay(r.start).getTime(), end: endOfDay(r.end).getTime() })),
    [selectedWeeks],
  );
  const normalizedRange = useMemo(
    () => (selectedRange ? { start: startOfDay(selectedRange.start).getTime(), end: endOfDay(selectedRange.end).getTime() } : null),
    [selectedRange],
  );

  // Apply filters
  const filteredData = useMemo(() => {
    return parsedData.filter(d => {
      if (!d.parsedDate) return false;
      const ts = d.parsedDate.getTime();
      if (selectedDay) return isSameDay(d.parsedDate, selectedDay);
      if (normalizedWeeks.length > 0) {
        return normalizedWeeks.some(r => ts >= r.start && ts <= r.end);
      }
      if (normalizedRange) {
        return ts >= normalizedRange.start && ts <= normalizedRange.end;
      }
      if (selectedMonth !== 'all') return format(d.parsedDate, 'yyyy-MM') === selectedMonth;
      return true;
    });
  }, [parsedData, selectedMonth, selectedDay, normalizedRange, normalizedWeeks]);

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
    const minDate = isFinite(minTs) ? startOfDay(new Date(minTs)) : null;
    const maxInData = maxTs > 0 ? endOfDay(new Date(maxTs)) : null;
    // Use effectiveNow consistently - respect user's dateMode preference
    const maxDate = maxInData ?? (effectiveNow.getTime() > 0 ? endOfDay(effectiveNow) : null);
    return { minDate, maxDate, availableDatesSet: set };
  }, [effectiveNow, parsedData]);

  // Cache key carries the actual week bounds (was count-only `w:length`,
  // so two different week selections with the same count shared entries).
  const filterCacheKey = useMemo(() => {
    const parts: string[] = [];
    if (selectedMonth !== 'all') parts.push(`m:${selectedMonth}`);
    if (selectedDay) parts.push(`d:${selectedDay.toISOString()}`);
    if (selectedRange) parts.push(`r:${selectedRange.start.toISOString()}-${selectedRange.end.toISOString()}`);
    if (selectedWeeks.length > 0) {
      const weeks = selectedWeeks
        .map((w) => `${w.start.toISOString()}-${w.end.toISOString()}`)
        .sort()
        .join(',');
      parts.push(`w:${weeks}`);
    }
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
