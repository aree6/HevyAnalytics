import type { ExerciseStats, WorkoutSet } from '../../../types';
import { getDateKey, type TimePeriod, sortByTimestamp } from '../../date/dateUtils';
import { roundTo } from '../../format/formatters';
import { isWarmupSet, isLeftSet, isRightSet, isUnilateralSet } from '../classification/setClassification';

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

export interface ExerciseRadialEntry {
  name: string;
  count: number;
}

export const getTopExercisesRadial = (stats: ExerciseStats[]): ExerciseRadialEntry[] => {
  return [...stats]
    .sort((a, b) => b.totalSets - a.totalSets)
    .map((s) => ({ name: s.name, count: s.totalSets }));
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
    counts: Map<string, number>;
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

  return entries.map((entry) => {
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
