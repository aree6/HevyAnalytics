import { differenceInDays, subDays } from 'date-fns';
import { WorkoutSet } from '../../../types';
import { isWarmupSet } from '../classification/setClassification';

export interface RecentPR {
  date: Date;
  exercise: string;
  weight: number;
  reps: number;
  previousBest: number;
  improvement: number;
}

export interface PRInsights {
  daysSinceLastPR: number;
  lastPRDate: Date | null;
  lastPRExercise: string | null;
  prDrought: boolean;
  recentPRs: RecentPR[];
  prFrequency: number;
  totalPRs: number;
}

export const calculatePRInsights = (data: WorkoutSet[], now: Date = new Date(0)): PRInsights => {
  const sorted = [...data]
    .filter((s) => s.parsedDate && !isWarmupSet(s) && (s.weight_kg || 0) > 0)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const dt = (a.s.parsedDate!.getTime() || 0) - (b.s.parsedDate!.getTime() || 0);
      if (dt !== 0) return dt;
      return a.i - b.i;
    })
    .map(({ s }) => s);

  if (sorted.length === 0) {
    return {
      daysSinceLastPR: 0,
      lastPRDate: null,
      lastPRExercise: null,
      prDrought: false,
      recentPRs: [],
      prFrequency: 0,
      totalPRs: 0,
    };
  }

  const bestByExercise = new Map<string, number>();
  const prEvents: RecentPR[] = [];

  for (const set of sorted) {
    const key = set.exercise_title || 'Unknown';
    const bestSoFar = bestByExercise.get(key) ?? 0;
    const current = set.weight_kg || 0;

    if (current > bestSoFar) {
      const improvement = current - bestSoFar;
      prEvents.push({
        date: set.parsedDate!,
        exercise: key,
        weight: current,
        reps: set.reps || 0,
        previousBest: bestSoFar,
        improvement,
      });
      bestByExercise.set(key, current);
    }
  }

  if (prEvents.length === 0) {
    return {
      daysSinceLastPR: 0,
      lastPRDate: null,
      lastPRExercise: null,
      prDrought: false,
      recentPRs: [],
      prFrequency: 0,
      totalPRs: 0,
    };
  }

  const lastPR = prEvents[prEvents.length - 1];
  const daysSinceLastPR = differenceInDays(now, lastPR.date);

  const recentPRs: RecentPR[] = prEvents.slice(-5).reverse();

  const thirtyDaysAgo = subDays(now, 30);
  const recentPRCount = prEvents.filter((pr) => pr.date >= thirtyDaysAgo).length;
  const prFrequency = Math.round((recentPRCount / 4) * 10) / 10;

  return {
    daysSinceLastPR,
    lastPRDate: lastPR.date,
    lastPRExercise: lastPR.exercise,
    prDrought: daysSinceLastPR > 14,
    recentPRs,
    prFrequency,
    totalPRs: prEvents.length,
  };
};
