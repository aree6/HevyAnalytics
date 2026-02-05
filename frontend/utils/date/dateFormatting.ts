import {
  differenceInCalendarDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isValid,
} from 'date-fns';

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
