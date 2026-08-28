import type { PrType, WorkoutSet } from '../../../types';
import { getDateKey, type TimePeriod, sortByTimestamp } from '../../date/dateUtils';
import { isWarmupSet } from '../classification/setClassification';
import {
  roundTo,
  detectGoldAndSilverPRs,
} from './prCalculation';

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

const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  return roundTo(weight * (1 + reps / 30), 2);
};

export interface PRTypeFlags {
  isWeightPr: boolean;
  isOneRmPr: boolean;
  isVolumePr: boolean;
}

const SILVER_PR_WINDOW_DAYS = 30;

interface PRMatchKey {
  exercise: string;
  timestamp: number;
  weight: number;
  reps: number;
}

const createPRMatchKey = (pr: { exercise: string; date: Date; weight: number; reps: number }): PRMatchKey => ({
  exercise: pr.exercise,
  timestamp: pr.date.getTime(),
  weight: pr.weight,
  reps: pr.reps,
});

const prMatchesSet = (key: PRMatchKey, set: WorkoutSet): boolean => {
  if (!set.parsedDate) return false;
  return (
    key.exercise === set.exercise_title &&
    key.timestamp === set.parsedDate.getTime() &&
    key.weight === set.weight_kg &&
    key.reps === set.reps
  );
};

export const identifyPersonalRecords = (data: WorkoutSet[], referenceDate?: Date): WorkoutSet[] => {
  const sorted = sortByParsedDate(data, true);
  
  // Calculate reference date from data if not provided
  // Use latest date in dataset, not actual current date
  const effectiveReferenceDate = referenceDate ?? (() => {
    let maxTs = -Infinity;
    for (const set of data) {
      if (set.parsedDate) {
        const ts = set.parsedDate.getTime();
        if (Number.isFinite(ts) && ts > maxTs) {
          maxTs = ts;
        }
      }
    }
    return Number.isFinite(maxTs) ? new Date(maxTs) : new Date();
  })();
  
  // Use centralized detection for both gold and silver PRs
  const { goldPRs, silverPRs } = detectGoldAndSilverPRs(
    sorted,
    SILVER_PR_WINDOW_DAYS,
    effectiveReferenceDate
  );
  
  // Index PRs by composite match key for O(1) candidate lookup, then verify
  // candidates with prMatchesSet so match semantics (incl. NaN handling) are
  // identical to the old nested scan. Was O(N×P) with a key alloc per inner
  // iteration; now O(N+P).
  const prKeyOf = (exercise: string, timestamp: number, weight: number, reps: number): string =>
    `${exercise}|${timestamp}|${weight}|${reps}`;
  const goldPRKeyMap = new Map<string, typeof goldPRs>();
  for (const pr of goldPRs) {
    if (pr.granularity === 'session') continue;
    const k = prKeyOf(pr.exercise, pr.date.getTime(), pr.weight, pr.reps);
    const arr = goldPRKeyMap.get(k);
    if (arr) arr.push(pr);
    else goldPRKeyMap.set(k, [pr]);
  }
  const silverPRKeyMap = new Map<string, typeof silverPRs>();
  for (const pr of silverPRs) {
    if (pr.granularity === 'session') continue;
    const k = prKeyOf(pr.exercise, pr.date.getTime(), pr.weight, pr.reps);
    const arr = silverPRKeyMap.get(k);
    if (arr) arr.push(pr);
    else silverPRKeyMap.set(k, [pr]);
  }

  // Create lookup maps using object pooling for efficiency
  const goldPRMap = new Map<number, PrType[]>();
  const silverPRMap = new Map<number, PrType[]>();

  // Single pass over sets with keyed lookup (was a nested loop per set).
  for (let i = 0; i < sorted.length; i++) {
    const set = sorted[i];
    if (!set.parsedDate || isWarmupSet(set)) continue;

    const k = prKeyOf(set.exercise_title, set.parsedDate.getTime(), set.weight_kg, set.reps);

    // Check for gold PR match
    const goldCandidates = goldPRKeyMap.get(k);
    if (goldCandidates) {
      const goldTypes: PrType[] = [];
      for (const pr of goldCandidates) {
        if (prMatchesSet(createPRMatchKey(pr), set)) {
          goldTypes.push(pr.type);
        }
      }
      if (goldTypes.length > 0) {
        goldPRMap.set(i, goldTypes);
      }
    }

    // Check for silver PR match
    const silverCandidates = silverPRKeyMap.get(k);
    if (silverCandidates) {
      const silverTypes: PrType[] = [];
      for (const pr of silverCandidates) {
        if (prMatchesSet(createPRMatchKey(pr), set)) {
          silverTypes.push(pr.type);
        }
      }
      if (silverTypes.length > 0) {
        silverPRMap.set(i, silverTypes);
      }
    }
  }

  // Identity index: sort copies the array, not the set objects, so object
  // identity is stable across sorts. Was O(N²) indexOf-in-map. First-wins
  // guard preserves indexOf semantics if an input ever aliases one object.
  const positionBySet = new Map<WorkoutSet, number>();
  for (let i = 0; i < sorted.length; i++) {
    if (!positionBySet.has(sorted[i])) positionBySet.set(sorted[i], i);
  }

  // Map PRs back to sets
  return sortByParsedDate(sorted, false).map((set) => {
    const originalIndex = positionBySet.get(set) ?? -1;
    const prTypes = goldPRMap.get(originalIndex) ?? [];
    const silverPrTypes = silverPRMap.get(originalIndex) ?? [];
    
    return {
      ...set,
      isPr: prTypes.length > 0,
      prTypes,
      isSilverPr: silverPrTypes.length > 0,
      silverPrTypes,
    };
  });
};

export const getPrTypeFlags = (prTypes?: PrType[]): PRTypeFlags => {
  return {
    isWeightPr: prTypes?.includes('weight') ?? false,
    isOneRmPr: prTypes?.includes('oneRm') ?? false,
    isVolumePr: prTypes?.includes('volume') ?? false,
  };
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
