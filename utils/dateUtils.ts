import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DateKeyResult {
  key: string;
  timestamp: number;
  label: string;
}

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
    keyFormat: 'yyyy-ww',
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
  
  const labelFormatted = period === 'weekly' 
    ? `Wk of ${format(start, config.labelFormat)}`
    : format(start, config.labelFormat);

  return {
    key: format(start, config.keyFormat),
    timestamp: start.getTime(),
    label: labelFormatted,
  };
};

export const sortByTimestamp = <T extends { timestamp: number }>(arr: T[], ascending = true): T[] => {
  return [...arr].sort((a, b) => ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
};

export const DATE_FORMAT_HEVY = 'd MMM yyyy, HH:mm';
