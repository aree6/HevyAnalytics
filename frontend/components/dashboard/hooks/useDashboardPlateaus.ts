import { useMemo } from 'react';
import { subDays } from 'date-fns';
import type { ExerciseStats, WorkoutSet } from '../../../types';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import { computationCache } from '../../../utils/storage/computationCache';
import { detectPlateaus } from '../../../utils/analysis/insights';
import { MIN_SESSIONS_FOR_TREND, summarizeExerciseHistory } from '../../../utils/analysis/exerciseTrend';
import { dashboardCacheKeys } from '../../../utils/storage/cacheKeys';

export const useDashboardPlateaus = (args: {
  fullData: WorkoutSet[];
  exerciseStats: ExerciseStats[];
  weightUnit: WeightUnit;
  effectiveNow: Date;
  filterCacheKey: string;
}) => {
  const { fullData, exerciseStats, weightUnit, effectiveNow, filterCacheKey } = args;

  const plateauAnalysis = useMemo(() => {
    const cacheKey = dashboardCacheKeys.plateauAnalysis(filterCacheKey);
    return computationCache.getOrCompute(
      cacheKey,
      fullData,
      () => detectPlateaus(fullData, exerciseStats, weightUnit, 'reactive'),
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, exerciseStats, weightUnit, filterCacheKey]);

  const exerciseStatsMap = useMemo(() => {
    const m = new Map<string, ExerciseStats>();
    for (const s of exerciseStats) m.set(s.name, s);
    return m;
  }, [exerciseStats]);

  const summarizedHistoryByExercise = useMemo(() => {
    const m = new Map<string, ReturnType<typeof summarizeExerciseHistory>>();
    for (const stat of exerciseStats) {
      m.set(stat.name, summarizeExerciseHistory(stat.history));
    }
    return m;
  }, [exerciseStats]);

  const activePlateauExercises = useMemo(() => {
    const activeSince = subDays(effectiveNow, 60);
    return plateauAnalysis.plateauedExercises.filter((p) => {
      const stat = exerciseStatsMap.get(p.exerciseName);
      if (!stat) return false;
      const sessions = summarizedHistoryByExercise.get(p.exerciseName) ?? [];
      const lastDate = sessions[0]?.date ?? null;
      if (!lastDate) return false;
      if (sessions.length < MIN_SESSIONS_FOR_TREND) return false;
      return lastDate >= activeSince;
    });
  }, [plateauAnalysis.plateauedExercises, exerciseStatsMap, summarizedHistoryByExercise, effectiveNow]);

  return { activePlateauExercises };
};
