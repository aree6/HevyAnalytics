import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInCalendarDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isValid,
} from 'date-fns';
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
  // For trend charts, show the current rolling window AND the previous window.
  // This keeps charts aligned with the "vs prev" deltas (rolling windows) while
  // giving users enough context to validate what they're seeing.
  //
  // weekly  => last 14 days (current 7d + previous 7d)
  // monthly => last 60 days (current 30d + previous 30d)
  // yearly  => last 730 days (current 365d + previous 365d)
  if (mode === 'weekly') return startOfDay(subDays(now, 13));
  if (mode === 'monthly') return startOfDay(subDays(now, 59));
  if (mode === 'yearly') return startOfDay(subDays(now, 729));
  return null;
};

export type ChartAggregation = 'daily' | 'weekly' | 'monthly';

// Target max plotted points for time-series charts.
// Lower values force more aggressive bucketing (fewer points).
export const DEFAULT_CHART_MAX_POINTS = 30;

export const pickChartAggregation = (args: {
  /** earliest timestamp (ms) */
  minTs: number;
  /** latest timestamp (ms) */
  maxTs: number;
  /** preferred granularity (used when it fits) */
  preferred: ChartAggregation;
  /** hard cap for plotted points */
  maxPoints: number;
}): ChartAggregation => {
  const { minTs, maxTs, preferred, maxPoints } = args;

  if (!Number.isFinite(minTs) || !Number.isFinite(maxTs) || maxTs <= minTs) return preferred;

  const msPerDay = 24 * 60 * 60 * 1000;
  const spanDays = Math.max(1, Math.floor((maxTs - minTs) / msPerDay) + 1);

  const estimatePoints = (agg: ChartAggregation) => {
    if (agg === 'daily') return spanDays;
    if (agg === 'weekly') return Math.ceil(spanDays / 7);
    return Math.ceil(spanDays / 30);
  };

  const order: ChartAggregation[] = ['daily', 'weekly', 'monthly'];
  const startIdx = Math.max(0, order.indexOf(preferred));

  for (let i = startIdx; i < order.length; i += 1) {
    const candidate = order[i];
    if (estimatePoints(candidate) <= maxPoints) return candidate;
  }

  return 'monthly';
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

export const formatRelativeDuration = (d: Date, now: Date): string => {
  if (!isPlausibleDate(d)) return '—';
  if (!isPlausibleDate(now)) return formatDayYearContraction(d);

  const diffDays = Math.abs(differenceInCalendarDays(now, d));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'}`;

  if (diffDays < 30) {
    const weeks = Math.max(1, Math.floor(diffDays / 7));
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  }

  if (diffDays < 365) {
    const months = Math.max(1, Math.floor(diffDays / 30));
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  const years = Math.max(1, Math.floor(diffDays / 365));
  return `${years} year${years === 1 ? '' : 's'}`;
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
