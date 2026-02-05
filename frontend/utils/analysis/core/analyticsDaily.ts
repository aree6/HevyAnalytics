import {
  format,
  startOfDay,
  subDays,
  eachDayOfInterval,
  getDay,
  parse,
  differenceInMinutes,
  isValid,
} from 'date-fns';
import type { DailySummary, WorkoutSet } from '../../../types';
import { getDateKey, type TimePeriod, sortByTimestamp, getSessionKey } from '../../date/dateUtils';
import { roundTo } from '../../format/formatters';
import { isWarmupSet, isUnilateralSet } from '../classification/setClassification';

const parseSessionDuration = (startDate: Date | undefined, endTimeStr: string): number => {
  if (!startDate) return 0;
  try {
    const end = parse(endTimeStr, 'd MMM yyyy, HH:mm', new Date(0));
    if (!isValid(end)) return 0;
    const duration = differenceInMinutes(end, startDate);
    return (duration > 0 && duration < 1440) ? duration : 0;
  } catch {
    return 0;
  }
};

export const getDailySummaries = (data: WorkoutSet[]): DailySummary[] => {
  const metaByDate = new Map<string, {
    timestamp: number;
    workoutTitle: string;
    sessions: Set<string>;
    durationMinutes: number;
    totalVolume: number;
    totalReps: number;
    setCount: number;
  }>();

  for (const set of data) {
    if (!set.parsedDate) continue;

    const dateKey = format(set.parsedDate, 'yyyy-MM-dd');

    let meta = metaByDate.get(dateKey);
    if (!meta) {
      meta = {
        timestamp: startOfDay(set.parsedDate).getTime(),
        workoutTitle: set.title || 'Workout',
        sessions: new Set(),
        durationMinutes: 0,
        totalVolume: 0,
        totalReps: 0,
        setCount: 0,
      };
      metaByDate.set(dateKey, meta);
    }

    const sessionKey = getSessionKey(set);
    if (sessionKey && !meta.sessions.has(sessionKey)) {
      meta.sessions.add(sessionKey);
      meta.durationMinutes += parseSessionDuration(set.parsedDate, set.end_time);
    }

    if (isWarmupSet(set)) continue;

    meta.totalVolume += (set.weight_kg || 0) * (set.reps || 0);
    meta.totalReps += set.reps || 0;
    meta.setCount += isUnilateralSet(set) ? 0.5 : 1;
  }

  const summaries: DailySummary[] = [];

  for (const [dateKey, meta] of metaByDate) {
    if (meta.setCount <= 0) continue;
    summaries.push({
      date: dateKey,
      timestamp: meta.timestamp,
      totalVolume: meta.totalVolume,
      workoutTitle: meta.workoutTitle,
      sets: meta.setCount,
      avgReps: meta.setCount > 0 ? Math.round(meta.totalReps / meta.setCount) : 0,
      durationMinutes: meta.durationMinutes,
      density: meta.durationMinutes > 0 ? Math.round(meta.totalVolume / meta.durationMinutes) : 0,
    });
  }

  return sortByTimestamp(summaries);
};

export interface HeatmapEntry {
  date: Date;
  count: number;
  totalVolume: number;
  title: string | null;
}

export const getHeatmapData = (dailyData: DailySummary[]): HeatmapEntry[] => {
  if (dailyData.length === 0) return [];

  const lastDate = new Date(dailyData[dailyData.length - 1].timestamp);
  const firstDate = subDays(lastDate, 364);
  const days = eachDayOfInterval({ start: firstDate, end: lastDate });

  const byDayKey = new Map<string, DailySummary>();
  for (const d of dailyData) {
    byDayKey.set(format(new Date(d.timestamp), 'yyyy-MM-dd'), d);
  }

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const activity = byDayKey.get(key);
    return {
      date: day,
      count: activity?.sets ?? 0,
      totalVolume: activity?.totalVolume ?? 0,
      title: activity?.workoutTitle ?? null,
    };
  });
};

export type TrainingStyle = 'Strength' | 'Hypertrophy' | 'Endurance';

export interface IntensityEntry {
  dateFormatted: string;
  timestamp: number;
  Strength: number;
  Hypertrophy: number;
  Endurance: number;
}

const categorizeByReps = (reps: number): TrainingStyle => {
  if (reps <= 5) return 'Strength';
  if (reps <= 12) return 'Hypertrophy';
  return 'Endurance';
};

export const getIntensityEvolution = (
  data: WorkoutSet[],
  mode: 'daily' | 'weekly' | 'monthly' = 'monthly'
): IntensityEntry[] => {
  const period: TimePeriod = mode === 'monthly' ? 'monthly' : (mode === 'weekly' ? 'weekly' : 'daily');
  const grouped = new Map<string, IntensityEntry>();

  for (const set of data) {
    if (!set.parsedDate) continue;

    const { key, timestamp, label } = getDateKey(set.parsedDate, period);

    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        dateFormatted: label,
        timestamp,
        Strength: 0,
        Hypertrophy: 0,
        Endurance: 0,
      };
      grouped.set(key, entry);
    }

    const style = categorizeByReps(set.reps || 8);
    entry[style] += 1;
  }

  return sortByTimestamp(Array.from(grouped.values()));
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface DayOfWeekEntry {
  subject: string;
  A: number;
  fullMark: number;
}

export const getDayOfWeekShape = (dailyData: DailySummary[]): DayOfWeekEntry[] => {
  const counts = new Array(7).fill(0);

  for (const day of dailyData) {
    const dayIndex = getDay(new Date(day.timestamp));
    counts[dayIndex]++;
  }

  const maxVal = Math.max(...counts, 1);

  return DAY_NAMES.map((day, index) => ({
    subject: day,
    A: counts[index],
    fullMark: maxVal,
  }));
};
