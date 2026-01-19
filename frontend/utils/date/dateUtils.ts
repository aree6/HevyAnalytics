import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, differenceInCalendarDays, differenceInWeeks, differenceInMonths, differenceInYears, isValid } from 'date-fns';
import { WorkoutSet } from '../../types';
import type { TimeFilterMode } from '../storage/localStorage';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const getRollingWindowDaysForMode = (mode: TimeFilterMode): number | null => {
  if (mode === 'weekly') return 7;
  if (mode === 'monthly') return 30;
  if (mode === 'yearly') return 365;
  return null;
};

export const getRollingWindowStartForMode = (mode: TimeFilterMode, now: Date): Date | null => {
  const days = getRollingWindowDaysForMode(mode);
  if (!days) return null;
  return startOfDay(subDays(now, days - 1));
};

export const formatRollingWindowAbbrev = (days: number): string => {
  if (days === 7) return 'wk';
  if (days === 30) return 'mo';
  if (days === 365) return 'yr';
  return `${days}d`;
};

export const formatVsPrevRollingWindow = (days: number): string => {
  return `vs prev ${formatRollingWindowAbbrev(days)}`;
};

export const formatLastRollingWindow = (days: number): string => {
  if (days === 7) return 'Last Week';
  if (days === 30) return 'Last Month';
  if (days === 365) return 'Last Year';
  return `Last ${days}d`;
};

export interface DateKeyResult {
  key: string;
  timestamp: number;
  label: string;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const MIN_PLAUSIBLE_YEAR = 1971;
const MAX_PLAUSIBLE_YEAR = 2099;

export const isPlausibleDate = (d: Date): boolean => {
  if (!isValid(d)) return false;
  const ts = d.getTime();
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const y = d.getFullYear();
  return y >= MIN_PLAUSIBLE_YEAR && y <= MAX_PLAUSIBLE_YEAR;
};

export const formatYearContraction = (d: Date): string => {
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  return yy;
};

export const formatMonthContraction = (d: Date): string => {
  return MONTH_ABBR[d.getMonth()] ?? 'M';
};

export const formatDayContraction = (d: Date): string => {
  return `${d.getDate()} ${formatMonthContraction(d)}`;
};

export const formatDayYearContraction = (d: Date): string => {
  return `${formatDayContraction(d)} ${formatYearContraction(d)}`;
};

export const formatMonthYearContraction = (d: Date): string => {
  return `${formatMonthContraction(d)} ${formatYearContraction(d)}`;
};

export const formatWeekContraction = (weekStart: Date): string => {
  return `${formatDayContraction(weekStart)}`;
};

export const formatRelativeDay = (d: Date, now: Date): string => {
  if (!isPlausibleDate(d)) return '—';
  if (!isPlausibleDate(now)) return formatDayYearContraction(d);
  const diffDays = differenceInCalendarDays(now, d);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays === -1) return 'tomorrow';
  if (diffDays > 1) return `${diffDays} days ago`;
  return `in ${Math.abs(diffDays)} days`;
};

export const formatRelativeTime = (d: Date, now: Date): string => {
  if (!isPlausibleDate(d)) return '—';
  if (!isPlausibleDate(now)) return formatDayYearContraction(d);
  
  const diffDays = differenceInCalendarDays(now, d);
  const diffWeeks = differenceInWeeks(now, d);
  const diffMonths = differenceInMonths(now, d);
  const diffYears = differenceInYears(now, d);
  
  // Handle today/yesterday/tomorrow
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays === -1) return 'tomorrow';
  
  // Future dates
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays <= 14) return `in ${absDays} day${absDays === 1 ? '' : 's'}`;
    if (absDays <= 30) return `in ${Math.abs(diffWeeks)} week${Math.abs(diffWeeks) === 1 ? '' : 's'}`;
    if (absDays <= 365) return `in ${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'}`;
    return `in ${Math.abs(diffYears)} year${Math.abs(diffYears) === 1 ? '' : 's'}`;
  }
  
  // Past dates
  if (diffDays <= 14) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks <= 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths <= 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
};

export const getEffectiveNowFromWorkoutData = (
  data: WorkoutSet[],
  fallbackNow: Date = new Date(0)
): Date => {
  let maxTs = -Infinity;
  for (const s of data) {
    const d = s.parsedDate;
    if (!d) continue;
    if (!isPlausibleDate(d)) continue;
    const ts = d.getTime();
    if (ts > maxTs) maxTs = ts;
  }
  return Number.isFinite(maxTs) ? new Date(maxTs) : fallbackNow;
};

export const formatHumanReadableDate = (
  d: Date,
  opts?: { now?: Date; cutoffDays?: number }
): string => {
  if (!isPlausibleDate(d)) return '—';
  const now = opts?.now;
  if (!now || !isPlausibleDate(now)) return formatDayYearContraction(d);
  const cutoffDays = opts?.cutoffDays ?? 30;
  const diffDays = Math.abs(differenceInCalendarDays(now, d));
  return diffDays > cutoffDays ? formatDayYearContraction(d) : formatRelativeDay(d, now);
};

export const formatRelativeWithDate = (
  d: Date,
  opts?: { now?: Date; cutoffDays?: number }
): string => {
  if (!isPlausibleDate(d)) return '—';
  const now = opts?.now;
  if (!now || !isPlausibleDate(now)) return formatDayYearContraction(d);
  const cutoffDays = opts?.cutoffDays ?? 30;
  const diffDays = Math.abs(differenceInCalendarDays(now, d));
  if (diffDays > cutoffDays) return formatDayYearContraction(d);
  return `${formatRelativeDay(d, now)} on ${formatDayYearContraction(d)}`;
};

const DATE_KEY_CONFIGS: Record<TimePeriod, {
  getStart: (d: Date) => Date;
  keyFormat: string;
  labelFormat: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}> = {
  daily: {
    getStart: startOfDay,
    keyFormat: 'yyyy-MM-dd',
    labelFormat: 'MMM d',
  },
  weekly: {
    getStart: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
    keyFormat: 'yyyy-MM-dd',
    labelFormat: 'MMM d',
    weekStartsOn: 1,
  },
  monthly: {
    getStart: startOfMonth,
    keyFormat: 'yyyy-MM',
    labelFormat: 'MMM yyyy',
  },
  yearly: {
    getStart: startOfYear,
    keyFormat: 'yyyy',
    labelFormat: 'yyyy',
  },
};

export const getDateKey = (date: Date, period: TimePeriod): DateKeyResult => {
  const config = DATE_KEY_CONFIGS[period];
  const start = config.getStart(date);

  const labelFormatted =
    period === 'daily'
      ? formatDayContraction(start)
      : period === 'weekly'
        ? formatWeekContraction(start)
        : period === 'monthly'
          ? formatMonthYearContraction(start)
          : formatYearContraction(start);

  return {
    key: period === 'weekly' ? `wk-${format(start, config.keyFormat)}` : format(start, config.keyFormat),
    timestamp: start.getTime(),
    label: labelFormatted,
  };
};

export const sortByTimestamp = <T extends { timestamp: number }>(arr: T[], ascending = true): T[] => {
  return [...arr].sort((a, b) => ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
};

export const DATE_FORMAT_HEVY = 'd MMM yyyy, HH:mm';

export const getSessionKey = (set: Pick<WorkoutSet, 'start_time' | 'title' | 'parsedDate'>): string => {
  const start = String(set.start_time ?? '').trim();
  const title = String(set.title ?? '').trim();
  const ts = set.parsedDate?.getTime?.() ?? NaN;
  const dateKey = Number.isFinite(ts) ? String(ts) : '';
  if (start && title) return `${start}_${title}`;
  if (start) return start;
  if (dateKey && title) return `${dateKey}_${title}`;
  return dateKey || title;
};
