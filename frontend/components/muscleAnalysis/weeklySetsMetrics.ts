import { differenceInCalendarDays, subDays } from 'date-fns';
import type { WorkoutSet } from '../../types';
import type { ExerciseAsset } from '../../utils/data/exerciseAssets';
import type { WeeklySetsWindow } from '../../utils/muscle/dashboardWeeklySets';
import {
  computeDailyMuscleVolumes,
  computeDailySvgMuscleVolumes,
} from '../../utils/muscle/rollingVolumeCalculator';
import { formatDeltaPercentage, getDeltaFormatPreset } from '../../utils/format/deltaFormat';

export type MuscleAnalysisViewMode = 'muscle' | 'group';

export const computeWeeklySetsSummary = (args: {
  assetsMap: Map<string, ExerciseAsset> | null;
  windowStart: Date | null;
  selectedSubjectKeys: string[];
  viewMode: MuscleAnalysisViewMode;
  data: WorkoutSet[];
  effectiveNow: Date;
  groupWeeklyRatesBySubject: Map<string, number> | null;
}): number | null => {
  const {
    assetsMap,
    windowStart,
    selectedSubjectKeys,
    viewMode,
    data,
    effectiveNow,
    groupWeeklyRatesBySubject,
  } = args;

  if (!assetsMap) return null;
  if (!windowStart) return null;

  // In group view, reuse the same windowed weekly-rate totals as the dashboard.
  if (viewMode === 'group' && groupWeeklyRatesBySubject) {
    if (selectedSubjectKeys.length > 0) {
      let sum = 0;
      for (const k of selectedSubjectKeys) sum += groupWeeklyRatesBySubject.get(k) ?? 0;
      return Math.round(sum * 10) / 10;
    }

    let sum = 0;
    for (const v of groupWeeklyRatesBySubject.values()) sum += v;
    return Math.round(sum * 10) / 10;
  }

  const daily =
    viewMode === 'group'
      ? computeDailyMuscleVolumes(data, assetsMap, true)
      : computeDailySvgMuscleVolumes(data, assetsMap);

  const getDaySum = (day: { muscles: ReadonlyMap<string, number> }) => {
    if (selectedSubjectKeys.length > 0) {
      let sum = 0;
      for (const k of selectedSubjectKeys) sum += (day.muscles.get(k) ?? 0) as number;
      return sum;
    }

    let sum = 0;
    for (const v of day.muscles.values()) sum += v;
    return sum;
  };

  const total = daily.reduce((acc, day) => {
    if (day.date < windowStart || day.date > effectiveNow) return acc;
    return acc + getDaySum(day);
  }, 0);

  const days = Math.max(1, differenceInCalendarDays(effectiveNow, windowStart) + 1);
  const weeks = Math.max(1, days / 7);
  return Math.round((total / weeks) * 10) / 10;
};

export interface WeeklySetsDeltaResult {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  formattedPercent: string;
  direction: 'up' | 'down' | 'same';
}

export const computeWeeklySetsDelta = (args: {
  assetsMap: Map<string, ExerciseAsset> | null;
  windowStart: Date | null;
  weeklySetsWindow: WeeklySetsWindow;
  selectedSubjectKeys: string[];
  viewMode: MuscleAnalysisViewMode;
  data: WorkoutSet[];
  effectiveNow: Date;
  allTimeWindowStart: Date | null;
}): WeeklySetsDeltaResult | null => {
  const {
    assetsMap,
    windowStart,
    weeklySetsWindow,
    selectedSubjectKeys,
    viewMode,
    data,
    effectiveNow,
    allTimeWindowStart,
  } = args;

  if (!assetsMap) return null;
  if (!windowStart) return null;
  if (weeklySetsWindow === 'all') return null;

  const previousNow = windowStart;
  const previousStart =
    weeklySetsWindow === '7d'
      ? subDays(previousNow, 7)
      : weeklySetsWindow === '30d'
        ? subDays(previousNow, 30)
        : subDays(previousNow, 365);

  const clampedPreviousStart = allTimeWindowStart && allTimeWindowStart > previousStart ? allTimeWindowStart : previousStart;

  const daily =
    viewMode === 'group'
      ? computeDailyMuscleVolumes(data, assetsMap, true)
      : computeDailySvgMuscleVolumes(data, assetsMap);

  const sumInRange = (start: Date, end: Date) => {
    const total = daily.reduce((acc, day) => {
      if (day.date < start || day.date > end) return acc;
      if (selectedSubjectKeys.length > 0) {
        let sum = 0;
        for (const k of selectedSubjectKeys) sum += (day.muscles.get(k) ?? 0) as number;
        return acc + sum;
      }

      let sum = 0;
      for (const v of day.muscles.values()) sum += v;
      return acc + sum;
    }, 0);

    const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
    const weeks = Math.max(1, days / 7);
    return total / weeks;
  };

  const current = sumInRange(windowStart, effectiveNow);
  const previous = sumInRange(clampedPreviousStart, previousNow);

  if (previous <= 0) return null;

  const delta = current - previous;
  const deltaPercent = Math.round((delta / previous) * 100);
  const formattedPercent = formatDeltaPercentage(deltaPercent, getDeltaFormatPreset('badge'));

  return {
    current: Math.round(current * 10) / 10,
    previous: Math.round(previous * 10) / 10,
    delta: Math.round(delta * 10) / 10,
    deltaPercent,
    formattedPercent,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
  };
};
