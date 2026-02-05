import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../data/exerciseAssets';
import { formatDayContraction } from '../../date/dateUtils';
import { computeDailyMuscleVolumes, computeDailySvgMuscleVolumes } from './rollingVolumeDaily';
import { identifyBreakPeriods } from './rollingVolumeBreaks';
import { computeRollingWeeklyVolumes } from './rollingVolumeWeekly';
import { computePeriodAverageVolumes } from './rollingVolumePeriods';
import type { VolumeTimeSeriesEntry, VolumeTimeSeriesResult } from './rollingVolumeTypes';

/**
 * Builds a time series of rolling weekly volumes for charting.
 * Each point represents the rolling 7-day volume as of that training day.
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @param useGroups - Use muscle groups (true) or detailed muscles (false)
 * @returns Time series data and keys for charting
 */
export function buildRollingWeeklyTimeSeries(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  useGroups: boolean
): VolumeTimeSeriesResult {
  const dailyVolumes = computeDailyMuscleVolumes(data, assetsMap, useGroups);
  const breakDates = identifyBreakPeriods(dailyVolumes);
  const rollingVolumes = computeRollingWeeklyVolumes(dailyVolumes, breakDates);

  // Collect all muscle keys
  const keysSet = new Set<string>();
  for (const rv of rollingVolumes) {
    for (const muscle of rv.muscles.keys()) {
      keysSet.add(muscle);
    }
  }
  const keys = Array.from(keysSet);

  // Build time series entries
  const seriesData: VolumeTimeSeriesEntry[] = rollingVolumes
    .filter((rv) => !rv.isInBreak) // Exclude break recovery days from display
    .map((rv) => {
      const entry: Record<string, number | string> = {
        timestamp: rv.date.getTime(),
        dateFormatted: formatDayContraction(rv.date),
      };

      for (const k of keys) {
        entry[k] = rv.muscles.get(k) ?? 0;
      }

      return entry as VolumeTimeSeriesEntry;
    });

  return { data: seriesData, keys };
}

/**
 * Builds a time series of period-averaged volumes for charting.
 * Monthly/yearly views show average weekly sets per muscle.
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @param periodType - 'monthly' or 'yearly'
 * @param useGroups - Use muscle groups (true) or detailed muscles (false)
 * @returns Time series data and keys for charting
 */
export function buildPeriodAverageTimeSeries(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  periodType: 'monthly' | 'yearly',
  useGroups: boolean
): VolumeTimeSeriesResult {
  const dailyVolumes = computeDailyMuscleVolumes(data, assetsMap, useGroups);
  const breakDates = identifyBreakPeriods(dailyVolumes);
  const rollingVolumes = computeRollingWeeklyVolumes(dailyVolumes, breakDates);
  const periodAverages = computePeriodAverageVolumes(rollingVolumes, periodType);

  // Collect all muscle keys
  const keysSet = new Set<string>();
  for (const pa of periodAverages) {
    for (const muscle of pa.avgWeeklySets.keys()) {
      keysSet.add(muscle);
    }
  }
  const keys = Array.from(keysSet);

  // Build time series entries
  const seriesData: VolumeTimeSeriesEntry[] = periodAverages.map((pa) => {
    const entry: Record<string, number | string> = {
      timestamp: pa.startDate.getTime(),
      dateFormatted: pa.periodLabel,
    };

    for (const k of keys) {
      entry[k] = pa.avgWeeklySets.get(k) ?? 0;
    }

    return entry as VolumeTimeSeriesEntry;
  });

  return { data: seriesData, keys };
}

/**
 * Builds a time series of rolling weekly volumes for charting, keyed by SVG muscle IDs.
 * Each point represents the rolling 7-day volume as of that training day.
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @returns Time series data and keys for charting
 */
export function buildRollingWeeklySvgMuscleTimeSeries(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>
): VolumeTimeSeriesResult {
  const dailyVolumes = computeDailySvgMuscleVolumes(data, assetsMap);
  const breakDates = identifyBreakPeriods(dailyVolumes);
  const rollingVolumes = computeRollingWeeklyVolumes(dailyVolumes, breakDates);

  // Collect all muscle keys
  const keysSet = new Set<string>();
  for (const rv of rollingVolumes) {
    for (const muscle of rv.muscles.keys()) {
      keysSet.add(muscle);
    }
  }
  const keys = Array.from(keysSet);

  // Build time series entries
  const seriesData: VolumeTimeSeriesEntry[] = rollingVolumes
    .filter((rv) => !rv.isInBreak) // Exclude break recovery days from display
    .map((rv) => {
      const entry: Record<string, number | string> = {
        timestamp: rv.date.getTime(),
        dateFormatted: formatDayContraction(rv.date),
      };

      for (const k of keys) {
        entry[k] = rv.muscles.get(k) ?? 0;
      }

      return entry as VolumeTimeSeriesEntry;
    });

  return { data: seriesData, keys };
}

/**
 * Builds a time series of period-averaged volumes for charting, keyed by SVG muscle IDs.
 * Monthly/yearly views show average weekly sets per muscle.
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @param periodType - 'monthly' or 'yearly'
 * @returns Time series data and keys for charting
 */
export function buildPeriodAverageSvgMuscleTimeSeries(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  periodType: 'monthly' | 'yearly'
): VolumeTimeSeriesResult {
  const dailyVolumes = computeDailySvgMuscleVolumes(data, assetsMap);
  const breakDates = identifyBreakPeriods(dailyVolumes);
  const rollingVolumes = computeRollingWeeklyVolumes(dailyVolumes, breakDates);
  const periodAverages = computePeriodAverageVolumes(rollingVolumes, periodType);

  // Collect all muscle keys
  const keysSet = new Set<string>();
  for (const pa of periodAverages) {
    for (const muscle of pa.avgWeeklySets.keys()) {
      keysSet.add(muscle);
    }
  }
  const keys = Array.from(keysSet);

  // Build time series entries
  const seriesData: VolumeTimeSeriesEntry[] = periodAverages.map((pa) => {
    const entry: Record<string, number | string> = {
      timestamp: pa.startDate.getTime(),
      dateFormatted: pa.periodLabel,
    };

    for (const k of keys) {
      entry[k] = pa.avgWeeklySets.get(k) ?? 0;
    }

    return entry as VolumeTimeSeriesEntry;
  });

  return { data: seriesData, keys };
}
