import React from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { CalendarSelector } from '../modals/CalendarSelector';

type DateRange = { start: Date; end: Date };

interface AppCalendarOverlayProps {
  open: boolean;
  onClose: () => void;

  selectedDay: Date | null;
  selectedRange: DateRange | null;
  selectedWeeks: DateRange[];

  effectiveNow: Date | null;
  minDate: Date | null;
  maxDate: Date | null;
  availableDatesSet: Set<string>;

  onSelectWeeks: (ranges: DateRange[]) => void;
  onSelectDay: (d: Date) => void;
  onSelectWeek: (r: DateRange) => void;
  onSelectMonth: (r: DateRange) => void;
  onSelectYear: (r: DateRange) => void;
  onClear: () => void;
  onApply: (args: { range: DateRange | null }) => void;
}

export const AppCalendarOverlay: React.FC<AppCalendarOverlayProps> = ({
  open,
  onClose,
  selectedDay,
  selectedRange,
  selectedWeeks,
  effectiveNow,
  minDate,
  maxDate,
  availableDatesSet,
  onSelectWeeks,
  onSelectDay,
  onSelectWeek,
  onSelectMonth,
  onSelectYear,
  onClear,
  onApply,
}) => {
  if (!open) return null;

  const initialMonth = selectedDay ?? selectedRange?.start ?? selectedWeeks[0]?.start ?? effectiveNow ?? null;

  const initialRange = selectedRange
    ? { start: selectedRange.start, end: selectedRange.end }
    : selectedWeeks.length === 1
      ? { start: startOfDay(selectedWeeks[0].start), end: endOfDay(selectedWeeks[0].end) }
      : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <CalendarSelector
        mode="both"
        initialMonth={initialMonth}
        initialRange={initialRange}
        minDate={minDate}
        maxDate={maxDate}
        availableDates={availableDatesSet}
        multipleWeeks={true}
        onSelectWeeks={onSelectWeeks}
        onSelectDay={onSelectDay}
        onSelectWeek={onSelectWeek}
        onSelectMonth={onSelectMonth}
        onSelectYear={onSelectYear}
        onClear={onClear}
        onClose={onClose}
        onApply={onApply}
      />
    </div>
  );
};
