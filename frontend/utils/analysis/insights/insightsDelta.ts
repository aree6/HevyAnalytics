import { endOfDay, isWithinInterval, startOfDay, subDays } from 'date-fns';
import { WorkoutSet } from '../../../types';
import { formatDeltaPercentage, getDeltaFormatPreset } from '../../format/deltaFormat';
import { getSessionKey } from '../../date/dateUtils';
import { isWarmupSet } from '../classification/setClassification';

export interface PeriodStats {
  totalVolume: number;
  totalSets: number;
  totalWorkouts: number;
  totalPRs: number;
  avgSetsPerWorkout: number;
  avgVolumePerWorkout: number;
}

export interface DeltaResult {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  formattedPercent: string;
  direction: 'up' | 'down' | 'same';
}

export const calculatePeriodStats = (data: WorkoutSet[], startDate: Date, endDate: Date): PeriodStats => {
  const filtered = data.filter(s => {
    if (!s.parsedDate) return false;
    return isWithinInterval(s.parsedDate, { start: startDate, end: endDate });
  });

  const sessions = new Set<string>();
  let totalVolume = 0;
  let totalPRs = 0;
  let totalSets = 0;

  for (const set of filtered) {
    if (isWarmupSet(set)) continue;

    const sessionKey = getSessionKey(set);
    if (sessionKey) sessions.add(sessionKey);
    totalSets += 1;
    totalVolume += (set.weight_kg || 0) * (set.reps || 0);
    if (set.isPr) totalPRs++;
  }

  const totalWorkouts = sessions.size;

  return {
    totalVolume,
    totalSets,
    totalWorkouts,
    totalPRs,
    avgSetsPerWorkout: totalWorkouts > 0 ? Math.round(totalSets / totalWorkouts) : 0,
    avgVolumePerWorkout: totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0,
  };
};

export const calculateDelta = (current: number, previous: number): DeltaResult => {
  const delta = Number((current - previous).toFixed(2));
  const deltaPercent = previous > 0 ? Math.round((delta / previous) * 100) : current > 0 ? 100 : 0;
  const direction: 'up' | 'down' | 'same' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
  const formattedPercent = formatDeltaPercentage(deltaPercent, getDeltaFormatPreset('badge'));

  return {
    current: Number(current.toFixed(2)),
    previous: Number(previous.toFixed(2)),
    delta,
    deltaPercent,
    formattedPercent,
    direction,
  };
};

export interface WeeklyComparison {
  volume: DeltaResult;
  sets: DeltaResult;
  workouts: DeltaResult;
  prs: DeltaResult;
}

export interface RollingWindowComparison {
  windowDays: 7 | 30 | 365;
  eligible: boolean;
  minWorkoutsRequired: number;
  current: PeriodStats;
  previous: PeriodStats;
  volume: DeltaResult | null;
  sets: DeltaResult | null;
  workouts: DeltaResult | null;
  prs: DeltaResult | null;
}

const getRollingWindowRange = (now: Date, windowDays: 7 | 30 | 365) => {
  const currentStart = startOfDay(subDays(now, windowDays - 1));
  const currentEnd = now;

  const previousStart = startOfDay(subDays(currentStart, windowDays));
  const previousEnd = endOfDay(subDays(currentStart, 1));

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
  };
};

export const getRollingWindowComparison = (
  data: WorkoutSet[],
  windowDays: 7 | 30 | 365,
  now: Date = new Date(0),
  minWorkoutsRequired: number = 2
): RollingWindowComparison => {
  const range = getRollingWindowRange(now, windowDays);
  const current = calculatePeriodStats(data, range.current.start, range.current.end);
  const previous = calculatePeriodStats(data, range.previous.start, range.previous.end);

  const eligible = current.totalWorkouts >= minWorkoutsRequired && previous.totalWorkouts >= minWorkoutsRequired;

  return {
    windowDays,
    eligible,
    minWorkoutsRequired,
    current,
    previous,
    volume: eligible ? calculateDelta(current.totalVolume, previous.totalVolume) : null,
    sets: eligible ? calculateDelta(current.totalSets, previous.totalSets) : null,
    workouts: eligible ? calculateDelta(current.totalWorkouts, previous.totalWorkouts) : null,
    prs: eligible ? calculateDelta(current.totalPRs, previous.totalPRs) : null,
  };
};
