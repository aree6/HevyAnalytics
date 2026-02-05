import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../data/exerciseAssets';
import type { RollingWeeklyVolume, VolumePeriod, VolumeTimeSeriesResult } from './rollingVolumeTypes';
import { buildPeriodAverageSvgMuscleTimeSeries, buildPeriodAverageTimeSeries, buildRollingWeeklySvgMuscleTimeSeries, buildRollingWeeklyTimeSeries } from './rollingVolumeTimeSeries';
import { computeDailyMuscleVolumes, computeDailySvgMuscleVolumes } from './rollingVolumeDaily';
import { identifyBreakPeriods } from './rollingVolumeBreaks';
import { computeRollingWeeklyVolumes } from './rollingVolumeWeekly';

/**
 * Gets muscle volume time series for the specified period.
 *
 * This is the main entry point for volume calculations:
 * - Weekly: Rolling 7-day sums (true weekly volume per muscle)
 * - Monthly: Average weekly sets per muscle for each month
 * - Yearly: Average weekly sets per muscle for each year
 *
 * All calculations exclude break periods (>7 consecutive days without training).
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data for muscle lookups
 * @param period - 'weekly', 'monthly', or 'yearly'
 * @param useGroups - If true, aggregate to muscle groups; if false, use detailed muscles
 * @returns Time series data suitable for charting
 */
export function getMuscleVolumeTimeSeriesRolling(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: VolumePeriod = 'weekly',
  useGroups: boolean = true
): VolumeTimeSeriesResult {
  if (period === 'weekly') {
    return buildRollingWeeklyTimeSeries(data, assetsMap, useGroups);
  }

  return buildPeriodAverageTimeSeries(data, assetsMap, period, useGroups);
}

/**
 * Gets SVG-muscle volume time series for the specified period.
 *
 * This is the main entry point for volume calculations:
 * - Weekly: Rolling 7-day sums (true weekly volume per muscle)
 * - Monthly: Average weekly sets per muscle for each month
 * - Yearly: Average weekly sets per muscle for each year
 *
 * All calculations exclude break periods (>7 consecutive days without training).
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @param period - 'weekly', 'monthly', or 'yearly'
 * @returns Time series data suitable for charting
 */
export function getSvgMuscleVolumeTimeSeriesRolling(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: VolumePeriod = 'weekly'
): VolumeTimeSeriesResult {
  if (period === 'weekly') {
    return buildRollingWeeklySvgMuscleTimeSeries(data, assetsMap);
  }

  return buildPeriodAverageSvgMuscleTimeSeries(data, assetsMap, period);
}

/**
 * Gets the latest rolling weekly volume (most recent training day).
 * Useful for displaying current weekly muscle volume status.
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @param useGroups - Use muscle groups or detailed muscles
 * @returns Latest rolling weekly volume, or null if no data
 */
export function getLatestRollingWeeklyVolume(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  useGroups: boolean = true
): RollingWeeklyVolume | null {
  const dailyVolumes = computeDailyMuscleVolumes(data, assetsMap, useGroups);
  if (dailyVolumes.length === 0) return null;

  const breakDates = identifyBreakPeriods(dailyVolumes);
  const rollingVolumes = computeRollingWeeklyVolumes(dailyVolumes, breakDates);

  // Return the most recent non-break volume
  for (let i = rollingVolumes.length - 1; i >= 0; i--) {
    if (!rollingVolumes[i].isInBreak) {
      return rollingVolumes[i];
    }
  }

  // If all are in breaks, return the most recent anyway
  return rollingVolumes[rollingVolumes.length - 1] ?? null;
}

/**
 * Gets the latest rolling weekly volume keyed by SVG muscle IDs.
 *
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data
 * @returns Latest rolling weekly volume, or null if no data
 */
export function getLatestRollingWeeklySvgMuscleVolume(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>
): RollingWeeklyVolume | null {
  const dailyVolumes = computeDailySvgMuscleVolumes(data, assetsMap);
  if (dailyVolumes.length === 0) return null;

  const breakDates = identifyBreakPeriods(dailyVolumes);
  const rollingVolumes = computeRollingWeeklyVolumes(dailyVolumes, breakDates);

  for (let i = rollingVolumes.length - 1; i >= 0; i--) {
    if (!rollingVolumes[i].isInBreak) {
      return rollingVolumes[i];
    }
  }

  return rollingVolumes[rollingVolumes.length - 1] ?? null;
}
