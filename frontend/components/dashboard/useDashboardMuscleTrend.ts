import { useMemo } from 'react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import type { WorkoutSet } from '../../types';
import type { ExerciseAsset } from '../../utils/data/exerciseAssets';
import { isWarmupSet } from '../../utils/analysis/setClassification';
import { calculateDelta } from '../../utils/analysis/insights';
import { DEFAULT_CHART_MAX_POINTS, getRollingWindowStartForMode, getSessionKey, formatLastRollingWindow } from '../../utils/date/dateUtils';
import { getMuscleVolumeTimeSeries, getMuscleVolumeTimeSeriesDetailed } from '../../utils/muscle/muscleAnalytics';
import { getMuscleContributionsFromAsset } from '../../utils/muscle/muscleContributions';
import { bucketRollingWeeklySeriesToMonths, bucketRollingWeeklySeriesToWeeks } from '../../utils/muscle/rollingSeriesBucketing';
import { computationCache } from '../../utils/storage/computationCache';

export type DashboardMuscleGrouping = 'groups' | 'muscles';
export type DashboardMusclePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface MuscleTrendInsight {
  label: string;
  totalDelta: ReturnType<typeof calculateDelta>;
  biggestMover: { k: string; deltaPercent: number; direction: ReturnType<typeof calculateDelta>['direction'] };
}

export const useDashboardMuscleTrend = (args: {
  fullData: WorkoutSet[];
  assetsMap: Map<string, ExerciseAsset> | null;
  assetsLowerMap: Map<string, ExerciseAsset> | null;
  muscleGrouping: DashboardMuscleGrouping;
  musclePeriod: DashboardMusclePeriod;
  effectiveNow: Date;
}): {
  trendData: any[];
  trendKeys: string[];
  muscleTrendInsight: MuscleTrendInsight | null;
  muscleVsLabel: string;
} => {
  const { fullData, assetsMap, assetsLowerMap, muscleGrouping, musclePeriod, effectiveNow } = args;

  const muscleSeriesGroups = useMemo(() => {
    if (!assetsMap) return { data: [], keys: [] as string[] } as { data: any[]; keys: string[] };
    const base = computationCache.getOrCompute(
      `muscleSeriesGroups:rollingWeekly:${assetsMap.size}`,
      fullData,
      () => getMuscleVolumeTimeSeries(fullData, assetsMap, 'weekly'),
      { ttl: 10 * 60 * 1000 }
    );

    if (musclePeriod === 'all') {
      const n = (base.data || []).length;
      return n > 140 ? bucketRollingWeeklySeriesToMonths(base as any) : bucketRollingWeeklySeriesToWeeks(base as any);
    }

    const windowStart = getRollingWindowStartForMode(
      musclePeriod === 'yearly' ? 'yearly' : musclePeriod === 'weekly' ? 'weekly' : 'monthly',
      effectiveNow
    );
    const windowStartTs = windowStart ? windowStart.getTime() : null;
    const windowed = {
      data: windowStartTs ? (base.data || []).filter((row: any) => (typeof row?.timestamp === 'number' ? row.timestamp : 0) >= windowStartTs) : (base.data || []),
      keys: base.keys || [],
    };

    // Base series is weekly (rolling). Bucket down only when needed.
    const maxPoints = DEFAULT_CHART_MAX_POINTS;
    if (windowed.data.length <= maxPoints) return windowed as any;
    return windowed.data.length > 140 ? bucketRollingWeeklySeriesToMonths(windowed as any) : bucketRollingWeeklySeriesToWeeks(windowed as any);
  }, [fullData, assetsMap, musclePeriod, effectiveNow]);

  const muscleSeriesMuscles = useMemo(() => {
    if (!assetsMap) return { data: [], keys: [] as string[] } as { data: any[]; keys: string[] };
    const base = computationCache.getOrCompute(
      `muscleSeriesMuscles:rollingWeekly:${assetsMap.size}`,
      fullData,
      () => getMuscleVolumeTimeSeriesDetailed(fullData, assetsMap, 'weekly'),
      { ttl: 10 * 60 * 1000 }
    );

    if (musclePeriod === 'all') {
      const n = (base.data || []).length;
      return n > 140 ? bucketRollingWeeklySeriesToMonths(base as any) : bucketRollingWeeklySeriesToWeeks(base as any);
    }

    const windowStart = getRollingWindowStartForMode(
      musclePeriod === 'yearly' ? 'yearly' : musclePeriod === 'weekly' ? 'weekly' : 'monthly',
      effectiveNow
    );
    const windowStartTs = windowStart ? windowStart.getTime() : null;
    const windowed = {
      data: windowStartTs ? (base.data || []).filter((row: any) => (typeof row?.timestamp === 'number' ? row.timestamp : 0) >= windowStartTs) : (base.data || []),
      keys: base.keys || [],
    };

    const maxPoints = DEFAULT_CHART_MAX_POINTS;
    if (windowed.data.length <= maxPoints) return windowed as any;
    return windowed.data.length > 140 ? bucketRollingWeeklySeriesToMonths(windowed as any) : bucketRollingWeeklySeriesToWeeks(windowed as any);
  }, [fullData, assetsMap, musclePeriod, effectiveNow]);

  const trendData = muscleGrouping === 'groups' ? muscleSeriesGroups.data : muscleSeriesMuscles.data;

  const trendKeys = useMemo(() => {
    const totals: Record<string, number> = {};
    const keys = muscleGrouping === 'groups' ? muscleSeriesGroups.keys : muscleSeriesMuscles.keys;
    trendData.forEach((row: any) => {
      keys.forEach((k) => {
        totals[k] = (totals[k] || 0) + (row[k] || 0);
      });
    });
    return [...keys].sort((a, b) => (totals[b] || 0) - (totals[a] || 0)).slice(0, 6);
  }, [trendData, muscleGrouping, muscleSeriesGroups.keys, muscleSeriesMuscles.keys]);

  const muscleTrendInsight = useMemo(() => {
    if (!assetsMap || !assetsLowerMap) return null;
    if (!trendKeys || trendKeys.length === 0) return null;

    const cacheKey = `muscleTrendInsight:${muscleGrouping}:${musclePeriod}:${trendKeys.join('|')}:${effectiveNow.getTime()}:${assetsMap.size}`;
    return computationCache.getOrCompute(
      cacheKey,
      fullData,
      () => {
        const now = effectiveNow;
        const days = musclePeriod === 'weekly' ? 7 : musclePeriod === 'yearly' ? 365 : 30;
        const currStart = startOfDay(subDays(now, days - 1));
        const prevStart = startOfDay(subDays(currStart, days));
        const prevEnd = endOfDay(subDays(currStart, 1));

        const getWorkoutCountBetween = (start: Date, end: Date) => {
          const sessions = new Set<string>();
          for (const s of fullData) {
            if (isWarmupSet(s)) continue;
            const d = s.parsedDate;
            if (!d) continue;
            if (d < start || d > end) continue;
            const key = getSessionKey(s);
            if (!key) continue;
            sessions.add(key);
          }
          return sessions.size;
        };

        const minWorkoutsRequired = 2;
        const currWorkouts = getWorkoutCountBetween(currStart, now);
        const prevWorkouts = getWorkoutCountBetween(prevStart, prevEnd);
        if (currWorkouts < minWorkoutsRequired || prevWorkouts < minWorkoutsRequired) return null;

        const useGroups = muscleGrouping === 'groups';

        const computeTotals = (start: Date, end: Date) => {
          const totals = new Map<string, number>();
          const add = (k: string, v: number) => totals.set(k, (totals.get(k) || 0) + v);

          for (const s of fullData) {
            if (isWarmupSet(s)) continue;
            const d = s.parsedDate;
            if (!d) continue;
            if (d < start || d > end) continue;
            const name = s.exercise_title || '';
            const asset = assetsMap.get(name) || assetsLowerMap.get(name.toLowerCase());
            if (!asset) continue;

            const contributions = getMuscleContributionsFromAsset(asset, useGroups);
            for (const c of contributions) {
              add(c.muscle, c.sets);
            }
          }

          return totals;
        };

        const currTotals = computeTotals(currStart, now);
        const prevTotals = computeTotals(prevStart, prevEnd);

        const totalLast = trendKeys.reduce((acc, k) => acc + (currTotals.get(k) || 0), 0);
        const totalPrev = trendKeys.reduce((acc, k) => acc + (prevTotals.get(k) || 0), 0);
        const totalDelta = calculateDelta(totalLast, totalPrev);
        const biggestMover = trendKeys
          .map((k) => {
            const curr = currTotals.get(k) || 0;
            const prev = prevTotals.get(k) || 0;
            const delta = calculateDelta(curr, prev);
            return { k, deltaPercent: delta.deltaPercent, direction: delta.direction };
          })
          .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent))[0];

        return { label: formatLastRollingWindow(days), totalDelta, biggestMover };
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [assetsMap, assetsLowerMap, fullData, effectiveNow, trendKeys, muscleGrouping, musclePeriod]);

  const muscleVsLabel =
    musclePeriod === 'weekly' ? 'vs prev wk' : musclePeriod === 'yearly' ? 'vs prev yr' : 'vs prev mo';

  return {
    trendData,
    trendKeys,
    muscleTrendInsight,
    muscleVsLabel,
  };
};
