import type { WorkoutSet } from '../../../types';
import { getDateKey, type TimePeriod, sortByTimestamp } from '../../date/dateUtils';
import { isWarmupSet } from '../classification/setClassification';

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
