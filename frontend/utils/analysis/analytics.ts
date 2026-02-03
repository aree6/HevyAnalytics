import { WorkoutSet, ExerciseStats, DailySummary } from '../../types';
import { format, startOfDay, subDays, eachDayOfInterval, getDay, parse, differenceInMinutes, isValid } from 'date-fns';
import { getDateKey, TimePeriod, sortByTimestamp, getSessionKey } from '../date/dateUtils';
import { roundTo } from '../format/formatters';
import { isWarmupSet, isLeftSet, isRightSet, isUnilateralSet } from './setClassification';

const sortByParsedDate = (sets: WorkoutSet[], ascending: boolean): WorkoutSet[] => {
  const sign = ascending ? 1 : -1;
  return [...sets]
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const timeA = a.s.parsedDate?.getTime() ?? 0;
      const timeB = b.s.parsedDate?.getTime() ?? 0;
      const dt = timeA - timeB;
      if (dt !== 0) return dt * sign;

      const siA = a.s.set_index ?? 0;
      const siB = b.s.set_index ?? 0;
      const dsi = siA - siB;
      if (dsi !== 0) return dsi * sign;

      return (a.i - b.i) * sign;
    })
    .map((x) => x.s);
};

export const identifyPersonalRecords = (data: WorkoutSet[]): WorkoutSet[] => {
  const sorted = sortByParsedDate(data, true);
  const maxWeightMap = new Map<string, number>();
  const isPrFlags = new Map<WorkoutSet, boolean>();

  for (const set of sorted) {
    if (isWarmupSet(set)) {
      isPrFlags.set(set, false);
      continue;
    }
    const exercise = set.exercise_title;
    const currentWeight = set.weight_kg || 0;
    const previousMax = maxWeightMap.get(exercise) ?? 0;

    const isPr = currentWeight > 0 && currentWeight > previousMax;
    if (isPr) {
      maxWeightMap.set(exercise, currentWeight);
    }
    isPrFlags.set(set, isPr);
  }

  return sortByParsedDate(sorted, false).map((set) => ({
    ...set,
    isPr: isPrFlags.get(set) ?? false,
  }));
};

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

const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  return roundTo(weight * (1 + reps / 30), 2);
};

export const getExerciseStats = (data: WorkoutSet[]): ExerciseStats[] => {
  const statsByExercise = new Map<string, ExerciseStats>();

  for (const set of data) {
    if (isWarmupSet(set)) continue;
    const name = set.exercise_title;
    const d = set.parsedDate;
    if (!name || !d) continue;
    const ts = d.getTime();
    if (!Number.isFinite(ts) || ts <= 0) continue;
    const y = d.getFullYear();
    if (y <= 1970 || y >= 2100) continue;

    let stats = statsByExercise.get(name);
    if (!stats) {
      stats = {
        name,
        totalSets: 0,
        totalVolume: 0,
        maxWeight: 0,
        prCount: 0,
        history: [],
        hasUnilateralData: false,
      };
      statsByExercise.set(name, stats);
    }

    const volume = (set.weight_kg || 0) * (set.reps || 0);
    const oneRepMax = calculateOneRepMax(set.weight_kg, set.reps);

    stats.totalVolume += volume;
    if (set.weight_kg > stats.maxWeight) stats.maxWeight = set.weight_kg;
    if (set.isPr) stats.prCount += 1;

    let side: 'left' | 'right' | undefined;
    if (isLeftSet(set)) {
      side = 'left';
      stats.hasUnilateralData = true;
    } else if (isRightSet(set)) {
      side = 'right';
      stats.hasUnilateralData = true;
    }

    stats.history.push({
      date: d,
      weight: set.weight_kg,
      reps: set.reps,
      oneRepMax,
      volume,
      isPr: set.isPr ?? false,
      side,
    });

    stats.totalSets += isUnilateralSet(set) ? 0.5 : 1;
  }

  return Array.from(statsByExercise.values()).sort((a, b) => b.totalSets - a.totalSets);
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

  return days.map(day => {
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

export interface ExerciseRadialEntry {
  name: string;
  count: number;
}

export const getTopExercisesRadial = (stats: ExerciseStats[]): ExerciseRadialEntry[] => {
  return [...stats]
    .sort((a, b) => b.totalSets - a.totalSets)
    .map(s => ({ name: s.name, count: s.totalSets }));
};

export interface ExerciseTimeEntry {
  date: string;
  dateFormatted: string;
  timestamp: number;
  [exerciseName: string]: string | number;
}

export const getTopExercisesOverTime = (
  data: WorkoutSet[], 
  topExerciseNames: string[], 
  mode: 'daily' | 'weekly' | 'monthly' = 'monthly'
): ExerciseTimeEntry[] => {
  const period: TimePeriod = mode === 'monthly' ? 'monthly' : (mode === 'weekly' ? 'weekly' : 'daily');
  const topSet = new Set(topExerciseNames);
  
  const grouped = new Map<string, { 
    timestamp: number; 
    label: string; 
    counts: Map<string, number> 
  }>();

  for (const set of data) {
    if (!set.parsedDate || !topSet.has(set.exercise_title)) continue;
    if (isWarmupSet(set)) continue;
    
    const { key, timestamp, label } = getDateKey(set.parsedDate, period);
    
    let bucket = grouped.get(key);
    if (!bucket) {
      bucket = { timestamp, label, counts: new Map() };
      grouped.set(key, bucket);
    }
    
    const current = bucket.counts.get(set.exercise_title) ?? 0;
    bucket.counts.set(set.exercise_title, current + 1);
  }

  const entries = sortByTimestamp(Array.from(grouped.entries()).map(([key, val]) => ({
    key,
    timestamp: val.timestamp,
    label: val.label,
    counts: val.counts,
  })));

  return entries.map(entry => {
    const result: ExerciseTimeEntry = {
      date: entry.label,
      dateFormatted: entry.label,
      timestamp: entry.timestamp,
    };
    for (const name of topExerciseNames) {
      result[name] = entry.counts.get(name) ?? 0;
    }
    return result;
  });
};

export interface PRTimeEntry {
  count: number;
  timestamp: number;
  dateFormatted: string;
}

export const getPrsOverTime = (
  data: WorkoutSet[], 
  mode: 'daily' | 'weekly' | 'monthly' = 'monthly'
): PRTimeEntry[] => {
  const period: TimePeriod = mode === 'monthly' ? 'monthly' : (mode === 'weekly' ? 'weekly' : 'daily');
  const grouped = new Map<string, PRTimeEntry>();

  for (const set of data) {
    if (!set.parsedDate || !set.isPr) continue;
    if (isWarmupSet(set)) continue;
    
    const { key, timestamp, label } = getDateKey(set.parsedDate, period);
    
    let entry = grouped.get(key);
    if (!entry) {
      entry = { count: 0, timestamp, dateFormatted: label };
      grouped.set(key, entry);
    }
    entry.count += 1;
  }

  return sortByTimestamp(Array.from(grouped.values()));
};
