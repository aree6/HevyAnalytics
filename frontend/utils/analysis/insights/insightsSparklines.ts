import { format, startOfWeek, subWeeks } from 'date-fns';
import { DailySummary, WorkoutSet } from '../../../types';
import { formatDayContraction, formatWeekContraction, getSessionKey } from '../../date/dateUtils';
import { isWarmupSet } from '../classification/setClassification';

export interface SparklinePoint {
  value: number;
  label: string;
}

export const getVolumeSparkline = (dailyData: DailySummary[], points: number = 7): SparklinePoint[] => {
  const sorted = [...dailyData].sort((a, b) => b.timestamp - a.timestamp);
  const recent = sorted.slice(0, points).reverse();

  return recent.map(d => ({
    value: d.totalVolume,
    label: formatDayContraction(new Date(d.timestamp)),
  }));
};

export const getWorkoutSparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).workoutSparkline;
};

export const getPRSparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).prSparkline;
};

export const getSetsSparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).setsSparkline;
};

export const getConsistencySparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).consistencySparkline;
};

export const buildWeeklySparklineBundle = (
  data: WorkoutSet[],
  weeks: number = 8,
  now: Date = new Date(0)
): {
  workoutSparkline: SparklinePoint[];
  prSparkline: SparklinePoint[];
  setsSparkline: SparklinePoint[];
  consistencySparkline: SparklinePoint[];
} => {
  const baseWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekStarts: Date[] = [];
  const weekKeyToIndex = new Map<string, number>();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(baseWeekStart, i);
    const key = format(weekStart, 'yyyy-MM-dd');
    weekKeyToIndex.set(key, weekStarts.length);
    weekStarts.push(weekStart);
  }

  const sessionBuckets: Array<Set<string>> = weekStarts.map(() => new Set());
  const setCounts = new Array<number>(weekStarts.length).fill(0);
  const prCounts = new Array<number>(weekStarts.length).fill(0);

  for (const s of data) {
    const d = s.parsedDate;
    if (!d) continue;

    const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const idx = weekKeyToIndex.get(weekKey);
    if (idx == null) continue;

    if (isWarmupSet(s)) continue;

    setCounts[idx] += 1;
    if (s.isPr) prCounts[idx] += 1;

    const sessionKey = getSessionKey(s);
    if (sessionKey) sessionBuckets[idx].add(sessionKey);
  }

  const workoutSparkline = weekStarts.map((weekStart, idx) => ({
    value: sessionBuckets[idx].size,
    label: formatWeekContraction(weekStart),
  }));

  const prSparkline = weekStarts.map((weekStart, idx) => ({
    value: prCounts[idx],
    label: formatWeekContraction(weekStart),
  }));

  const setsSparkline = weekStarts.map((weekStart, idx) => ({
    value: setCounts[idx],
    label: formatWeekContraction(weekStart),
  }));

  return {
    workoutSparkline,
    prSparkline,
    setsSparkline,
    consistencySparkline: workoutSparkline,
  };
};
