import { format, startOfWeek } from 'date-fns';
import { formatWeekContraction } from '../date/dateUtils';

type RollingWeeklySeriesEntry = {
  timestamp: number;
  dateFormatted: string;
  [k: string]: number | string;
};

export type RollingWeeklySeriesResult = {
  data: RollingWeeklySeriesEntry[];
  keys: string[];
};

export const bucketRollingWeeklySeriesToWeeks = (
  series: RollingWeeklySeriesResult
): RollingWeeklySeriesResult => {
  const { data, keys } = series;
  if (!data || data.length === 0) return series;

  const byWeek = new Map<string, RollingWeeklySeriesEntry>();

  for (const row of data) {
    const ts = typeof row.timestamp === 'number' ? row.timestamp : 0;
    if (!ts) continue;

    const weekStart = startOfWeek(new Date(ts), { weekStartsOn: 1 });
    const weekKey = `wk-${format(weekStart, 'yyyy-MM-dd')}`;

    const next: RollingWeeklySeriesEntry = {
      timestamp: weekStart.getTime(),
      dateFormatted: formatWeekContraction(weekStart),
    };
    for (const k of keys) {
      const v = row[k];
      next[k] = typeof v === 'number' ? v : 0;
    }

    // Keep the last observed rolling value in that week (rows are already chronological).
    byWeek.set(weekKey, next);
  }

  const out = Array.from(byWeek.values()).sort((a, b) => a.timestamp - b.timestamp);
  return { data: out, keys };
};
