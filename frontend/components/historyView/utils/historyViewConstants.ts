import { format } from 'date-fns';
import { parseHevyDateString } from '../../../utils/date/parseHevyDateString';
import type { Session } from './historySessions';

export const ITEMS_PER_PAGE = 3;

export const isSameCalendarDay = (a: Date, b: Date) => format(a, 'yyyy-MM-dd') === format(b, 'yyyy-MM-dd');

export const formatRestDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  const days = Math.floor(ms / dayMs);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} rest`;

  const hours = Math.floor(ms / hourMs);
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} rest`;

  const mins = Math.floor(ms / minuteMs);
  if (mins >= 1) return `${mins} min rest`;

  return 'less than 1 min rest';
};

export const formatWorkoutDuration = (ms: number): string | null => {
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const totalMinutes = Math.round(ms / (60 * 1000));
  if (totalMinutes <= 0) return 'less than 1 min';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hourPart = hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : '';
  const minutePart = minutes > 0 ? `${minutes} min${minutes === 1 ? '' : 's'}` : '';

  if (hourPart && minutePart) return `${hourPart} ${minutePart}`;
  return hourPart || minutePart;
};

export const getSessionDurationMs = (session: Session): number | null => {
  const start = session.date;
  if (!start) return null;

  let endMs = NaN;
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      const end = parseHevyDateString(String(s.end_time ?? '').trim());
      const t = end?.getTime?.() ?? NaN;
      if (Number.isFinite(t)) endMs = Math.max(Number.isFinite(endMs) ? endMs : t, t);
    }
  }

  if (!Number.isFinite(endMs)) return null;
  const dur = endMs - start.getTime();
  return Number.isFinite(dur) && dur > 0 ? dur : null;
};
