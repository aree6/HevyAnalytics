import { useCallback } from 'react';

interface CalendarSelectionHandlersArgs {
  setSelectedDay: (day: Date | null) => void;
  setSelectedRange: (range: { start: Date; end: Date } | null) => void;
  setSelectedWeeks: (ranges: Array<{ start: Date; end: Date }>) => void;
  setCalendarOpen: (open: boolean) => void;
}

export const useCalendarSelectionHandlers = ({
  setSelectedDay,
  setSelectedRange,
  setSelectedWeeks,
  setCalendarOpen,
}: CalendarSelectionHandlersArgs) => {
  const onSelectWeeks = useCallback(
    (ranges: Array<{ start: Date; end: Date }>) => {
      setSelectedWeeks(ranges);
      setSelectedDay(null);
      setSelectedRange(null);
      setCalendarOpen(false);
    },
    [setSelectedWeeks, setSelectedDay, setSelectedRange, setCalendarOpen]
  );

  const onSelectDay = useCallback(
    (d: Date) => {
      setSelectedDay(d);
      setSelectedWeeks([]);
      setSelectedRange(null);
      setCalendarOpen(false);
    },
    [setSelectedDay, setSelectedWeeks, setSelectedRange, setCalendarOpen]
  );

  const onSelectWeek = useCallback(
    (r: { start: Date; end: Date }) => {
      setSelectedWeeks([r]);
      setSelectedDay(null);
      setSelectedRange(null);
      setCalendarOpen(false);
    },
    [setSelectedWeeks, setSelectedDay, setSelectedRange, setCalendarOpen]
  );

  const onSelectMonth = useCallback(
    (r: { start: Date; end: Date }) => {
      setSelectedRange(r);
      setSelectedDay(null);
      setSelectedWeeks([]);
      setCalendarOpen(false);
    },
    [setSelectedRange, setSelectedDay, setSelectedWeeks, setCalendarOpen]
  );

  const onSelectYear = useCallback(
    (r: { start: Date; end: Date }) => {
      setSelectedRange(r);
      setSelectedDay(null);
      setSelectedWeeks([]);
      setCalendarOpen(false);
    },
    [setSelectedRange, setSelectedDay, setSelectedWeeks, setCalendarOpen]
  );

  const onApplyCalendar = useCallback(
    ({ range }: { range?: { start: Date; end: Date } | null }) => {
      if (range) {
        setSelectedRange(range);
        setSelectedDay(null);
        setSelectedWeeks([]);
      }
      setCalendarOpen(false);
    },
    [setSelectedRange, setSelectedDay, setSelectedWeeks, setCalendarOpen]
  );

  return {
    onSelectWeeks,
    onSelectDay,
    onSelectWeek,
    onSelectMonth,
    onSelectYear,
    onApplyCalendar,
  };
};
