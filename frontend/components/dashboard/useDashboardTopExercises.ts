import { useMemo } from 'react';
import { startOfDay, subDays } from 'date-fns';
import type { ExerciseStats, WorkoutSet } from '../../types';
import { getTopExercisesRadial, getTopExercisesOverTime } from '../../utils/analysis/analytics';
import { calculateDelta } from '../../utils/analysis/insights';
import { isWarmupSet } from '../../utils/analysis/setClassification';
import { getSessionKey } from '../../utils/date/dateUtils';
import { computationCache } from '../../utils/storage/computationCache';

const safePct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

export type DashboardTopExerciseMode = 'all' | 'weekly' | 'monthly' | 'yearly';

export interface TopExerciseCount {
  name: string;
  count: number;
}

export interface TopExercisesInsight {
  windowLabel: string;
  delta: ReturnType<typeof calculateDelta> | null;
  top?: TopExerciseCount;
  topShare: number;
  eligible?: boolean;
}

export const useDashboardTopExercises = (args: {
  fullData: WorkoutSet[];
  exerciseStats: ExerciseStats[];
  topExerciseMode: DashboardTopExerciseMode;
  allAggregationMode: 'daily' | 'weekly' | 'monthly';
  effectiveNow: Date;
}): {
  topExercisesBarData: TopExerciseCount[];
  topExercisesOverTimeData: any;
  topExerciseNames: string[];
  topExercisesInsight: TopExercisesInsight;
} => {
  const { fullData, exerciseStats, topExerciseMode, allAggregationMode, effectiveNow } = args;

  const topExercisesData = useMemo(() => getTopExercisesRadial(exerciseStats).slice(0, 4), [exerciseStats]);

  const topExercisesBarData = useMemo(() => {
    return computationCache.getOrCompute(
      `topExercisesBarData:${topExerciseMode}:${effectiveNow.getTime()}`,
      fullData,
      () => {
        const now = effectiveNow;
        let start: Date | null = null;
        if (topExerciseMode === 'monthly') start = subDays(now, 30);
        else if (topExerciseMode === 'weekly') start = subDays(now, 7);
        else if (topExerciseMode === 'yearly') start = subDays(now, 365);
        // 'all' => start stays null (use all)
        const counts = new Map<string, number>();
        for (const s of fullData) {
          if (isWarmupSet(s)) continue;
          const d = s.parsedDate;
          if (!d) continue;
          if (start && d < start) continue;
          if (d > now) continue;
          const name = s.exercise_title || 'Unknown';
          counts.set(name, (counts.get(name) || 0) + 1);
        }
        const arr = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
        arr.sort((a, b) => b.count - a.count);
        return arr.slice(0, 4);
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, topExerciseMode, effectiveNow]);

  const topExercisesInsight = useMemo(() => {
    const barKey = topExercisesBarData.map((x) => `${x.name}:${x.count}`).join('|');
    return computationCache.getOrCompute(
      `topExercisesInsight:${topExerciseMode}:${effectiveNow.getTime()}:${barKey}`,
      fullData,
      () => {
        const now = effectiveNow;
        const getSetCountBetween = (start: Date | null, end: Date) => {
          let count = 0;
          for (const s of fullData) {
            if (isWarmupSet(s)) continue;
            const d = s.parsedDate;
            if (!d) continue;
            if (d > end) continue;
            if (start && d < start) continue;
            count += 1;
          }
          return count;
        };

        const getWorkoutCountBetween = (start: Date | null, end: Date) => {
          const sessions = new Set<string>();
          for (const s of fullData) {
            if (isWarmupSet(s)) continue;
            const d = s.parsedDate;
            if (!d) continue;
            if (d > end) continue;
            if (start && d < start) continue;
            const key = getSessionKey(s);
            if (!key) continue;
            sessions.add(key);
          }
          return sessions.size;
        };

        const sumShown = topExercisesBarData.reduce((acc, x) => acc + (x.count || 0), 0);
        const top = topExercisesBarData[0];
        const topShare = sumShown > 0 && top ? safePct(top.count || 0, sumShown) : 0;

        if (topExerciseMode === 'all') {
          if (!top) return { windowLabel: 'All time', delta: null, top, topShare } as TopExercisesInsight;
          return { windowLabel: 'All time', delta: null, top, topShare } as TopExercisesInsight;
        }

        const windowDays = topExerciseMode === 'weekly' ? 7 : topExerciseMode === 'yearly' ? 365 : 30;
        const start = subDays(now, windowDays);
        const prevStart = subDays(now, windowDays * 2);
        const prevEnd = subDays(now, windowDays);

        const currentSets = getSetCountBetween(start, now);
        const prevSets = getSetCountBetween(prevStart, prevEnd);
        const currentWorkouts = getWorkoutCountBetween(start, now);
        const prevWorkouts = getWorkoutCountBetween(prevStart, prevEnd);

        const windowLabel = topExerciseMode === 'weekly' ? '7d' : topExerciseMode === 'yearly' ? '365d' : '30d';
        const eligible = currentWorkouts >= 2 && prevWorkouts >= 2;
        const delta = eligible ? calculateDelta(currentSets, prevSets) : null;
        return { windowLabel, delta, top, topShare, eligible } as TopExercisesInsight;
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, topExerciseMode, topExercisesBarData, effectiveNow]);

  const topExercisesOverTimeData = useMemo(() => {
    const names = (topExercisesBarData.length > 0 ? topExercisesBarData : topExercisesData).map((e) => e.name);
    const rangeMode = topExerciseMode;
    const mode: 'daily' | 'weekly' | 'monthly' =
      rangeMode === 'all' ? allAggregationMode : rangeMode === 'yearly' ? 'weekly' : 'daily';
    const windowStart =
      rangeMode === 'weekly'
        ? startOfDay(subDays(effectiveNow, 6))
        : rangeMode === 'monthly'
          ? startOfDay(subDays(effectiveNow, 29))
          : rangeMode === 'yearly'
            ? startOfDay(subDays(effectiveNow, 364))
            : null;
    const filtered =
      windowStart
        ? fullData.filter((s) => {
            const d = s.parsedDate;
            return !!d && d >= windowStart;
          })
        : fullData;
    const namesKey = names.join('|');
    return computationCache.getOrCompute(
      `topExercisesOverTime:${rangeMode}:${mode}:${namesKey}:${effectiveNow.getTime()}`,
      fullData,
      () => getTopExercisesOverTime(filtered, names, mode as any),
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, topExercisesBarData, topExercisesData, topExerciseMode, allAggregationMode, effectiveNow]);

  const topExerciseNames = useMemo(
    () => (topExercisesBarData.length > 0 ? topExercisesBarData : topExercisesData).map((e) => e.name),
    [topExercisesBarData, topExercisesData]
  );

  return {
    topExercisesBarData,
    topExercisesOverTimeData,
    topExerciseNames,
    topExercisesInsight,
  };
};
