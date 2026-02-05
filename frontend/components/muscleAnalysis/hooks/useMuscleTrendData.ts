import { useMemo } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import type { WorkoutSet } from '../../../types';
import { computeWeeklySetsSummary, computeWeeklySetsDelta } from '../utils/weeklySetsMetrics';
import type { WeeklySetsWindow } from '../../../utils/muscle/analytics';
import { bucketRollingWeeklySeriesToWeeks } from '../../../utils/muscle/analytics';
import { getMuscleVolumeTimeSeriesRolling, getSvgMuscleVolumeTimeSeriesRolling } from '../../../utils/muscle/volume';
import { HEADLESS_ID_TO_DETAILED_SVG_IDS, MUSCLE_GROUP_ORDER } from '../../../utils/muscle/mapping';
import { computeWindowedExerciseBreakdown } from '../../../utils/muscle/volume';
import { isWarmupSet } from '../../../utils/analysis/classification';
import type { NormalizedMuscleGroup } from '../../../utils/muscle/analytics';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';

interface UseMuscleTrendDataParams {
  data: WorkoutSet[];
  assetsMap: Map<string, ExerciseAsset> | null;
  windowStart: Date | null;
  effectiveNow: Date;
  allTimeWindowStart: Date | null;
  weeklySetsWindow: WeeklySetsWindow;
  viewMode: 'muscle' | 'group' | 'headless';
  selectedSubjectKeys: string[];
  groupWeeklyRatesBySubject: Map<string, number> | null;
  headlessRatesMap: Map<string, number>;
  muscleVolume: Map<string, { sets: number }>;
  windowedGroupVolumes: Map<NormalizedMuscleGroup, number>;
  muscleVolumes: Map<string, number>;
}

export const useMuscleTrendData = ({
  data,
  assetsMap,
  windowStart,
  effectiveNow,
  allTimeWindowStart,
  weeklySetsWindow,
  viewMode,
  selectedSubjectKeys,
  groupWeeklyRatesBySubject,
  headlessRatesMap,
  muscleVolume,
  windowedGroupVolumes,
  muscleVolumes,
}: UseMuscleTrendDataParams) => {
  const weeklySetsSummary = useMemo(() => {
    if (viewMode === 'headless') {
      if (selectedSubjectKeys.length > 0) {
        let sum = 0;
        for (const k of selectedSubjectKeys) sum += headlessRatesMap.get(k) ?? 0;
        return Math.round(sum * 10) / 10;
      }

      let sum = 0;
      for (const v of headlessRatesMap.values()) sum += v;
      return Math.round(sum * 10) / 10;
    }

    return computeWeeklySetsSummary({
      assetsMap,
      windowStart,
      selectedSubjectKeys,
      viewMode,
      data,
      effectiveNow,
      groupWeeklyRatesBySubject,
    });
  }, [assetsMap, windowStart, selectedSubjectKeys, viewMode, data, effectiveNow, groupWeeklyRatesBySubject, headlessRatesMap]);

  const weeklySetsDelta = useMemo(() => {
    return computeWeeklySetsDelta({
      assetsMap,
      windowStart,
      weeklySetsWindow,
      selectedSubjectKeys,
      viewMode,
      data,
      effectiveNow,
      allTimeWindowStart,
    });
  }, [assetsMap, windowStart, weeklySetsWindow, selectedSubjectKeys, viewMode, data, effectiveNow, allTimeWindowStart]);

  const trendData = useMemo(() => {
    if (!assetsMap || data.length === 0) return [];
    if (!windowStart) return [];

    const isGroupMode = viewMode === 'group';
    const isAll = weeklySetsWindow === 'all';

    let chartPeriod: 'weekly' | 'monthly' = 'weekly';
    let shouldBucketToWeeks = false;

    if (isAll) {
      const spanDays = Math.max(1, differenceInCalendarDays(effectiveNow, windowStart) + 1);
      if (spanDays < 35) {
        chartPeriod = 'weekly';
      } else if (spanDays < 150) {
        chartPeriod = 'weekly';
        shouldBucketToWeeks = true;
      } else {
        chartPeriod = 'monthly';
      }
    } else if (weeklySetsWindow === '365d') {
      chartPeriod = 'weekly';
      shouldBucketToWeeks = true;
    } else {
      chartPeriod = 'weekly';
    }

    const baseSeries = isGroupMode
      ? getMuscleVolumeTimeSeriesRolling(data, assetsMap, chartPeriod, true)
      : getSvgMuscleVolumeTimeSeriesRolling(data, assetsMap, chartPeriod);

    const series = shouldBucketToWeeks
      ? bucketRollingWeeklySeriesToWeeks(baseSeries as any)
      : baseSeries;

    if (!series.data || series.data.length === 0) return [];

    const filtered = series.data.filter((row: any) => {
      const ts = typeof row.timestamp === 'number' ? row.timestamp : 0;
      if (!ts) return false;
      return ts >= windowStart.getTime() && ts <= effectiveNow.getTime();
    });

    const keys = selectedSubjectKeys;

    return filtered.map((row: any) => {
      const sumAll = () => (baseSeries.keys || []).reduce((acc, k) => acc + (typeof row[k] === 'number' ? row[k] : 0), 0);

      const sumHeadlessSelected = () => {
        if (keys.length === 0) return sumAll();
        let acc = 0;
        for (const headlessId of keys) {
          const detailed = (HEADLESS_ID_TO_DETAILED_SVG_IDS as any)[headlessId] as readonly string[] | undefined;
          if (!detailed) continue;
          for (const d of detailed) acc += (typeof row[d] === 'number' ? (row[d] as number) : 0);
        }
        return acc;
      };

      const v = viewMode === 'headless'
        ? sumHeadlessSelected()
        : keys.length > 0
          ? keys.reduce((acc, k) => acc + (typeof row[k] === 'number' ? row[k] : 0), 0)
          : sumAll();
      return {
        period: row.dateFormatted,
        timestamp: row.timestamp,
        sets: Math.round(Number(v) * 10) / 10,
      };
    });
  }, [assetsMap, data, windowStart, effectiveNow, weeklySetsWindow, viewMode, selectedSubjectKeys]);

  const windowedSelectionBreakdown = useMemo(() => {
    if (!assetsMap || !windowStart) return null;

    const grouping = viewMode === 'group' ? 'groups' : 'muscles';

    const selectedForBreakdown =
      viewMode === 'headless'
        ? selectedSubjectKeys.flatMap((h) => (HEADLESS_ID_TO_DETAILED_SVG_IDS as any)[h] ?? [])
        : selectedSubjectKeys;

    return computeWindowedExerciseBreakdown({
      data,
      assetsMap,
      start: windowStart,
      end: effectiveNow,
      grouping,
      selectedSubjects: selectedForBreakdown,
    });
  }, [assetsMap, windowStart, effectiveNow, viewMode, selectedSubjectKeys, data]);

  const contributingExercises = useMemo(() => {
    if (!windowedSelectionBreakdown) return [];
    const exercises: Array<{ name: string; sets: number; primarySets: number; secondarySets: number }> = [];
    windowedSelectionBreakdown.exercises.forEach((exData, name) => {
      exercises.push({ name, ...exData });
    });
    return exercises.sort((a, b) => b.sets - a.sets).slice(0, 8);
  }, [windowedSelectionBreakdown]);

  const totalSets = useMemo(() => {
    return data.reduce((acc, s) => (isWarmupSet(s) ? acc : acc + 1), 0);
  }, [data]);

  const musclesWorked = useMemo(() => {
    if (viewMode === 'muscle') {
      let count = 0;
      muscleVolume.forEach((entry) => { if (entry.sets > 0) count++; });
      return count;
    }

    if (viewMode === 'headless') {
      let count = 0;
      for (const v of muscleVolumes.values()) {
        if ((v ?? 0) > 0) count += 1;
      }
      return count;
    }

    let count = 0;
    for (const g of MUSCLE_GROUP_ORDER) {
      if ((windowedGroupVolumes.get(g) ?? 0) > 0) count += 1;
    }
    return count;
  }, [viewMode, windowedGroupVolumes, muscleVolumes, muscleVolume]);

  return {
    weeklySetsSummary,
    weeklySetsDelta,
    trendData,
    windowedSelectionBreakdown,
    contributingExercises,
    totalSets,
    musclesWorked,
  };
};
