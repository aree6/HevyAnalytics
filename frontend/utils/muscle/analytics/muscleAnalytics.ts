/**
 * Muscle Analytics Module
 *
 * Provides biologically-meaningful training volume metrics using rolling windows.
 * This replaces calendar-based aggregation with true weekly volume calculations
 * that can be compared against hypertrophy recommendations (10-20 sets/muscle/week).
 */

import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../data/exerciseAssets';
import { buildTimeSeries } from '../../analysis/core';
import { getMuscleContributionsFromAsset } from './muscleContributions';
import { isWarmupSet } from '../../analysis/classification';
import {
  getMuscleVolumeTimeSeriesRolling,
  getLatestRollingWeeklyVolume,
  type VolumeTimeSeriesResult,
  type VolumeTimeSeriesEntry,
  type RollingWeeklyVolume,
  type VolumePeriod,
} from '../volume/rollingVolumeCalculator';
import type { TimePeriod } from '../../date/dateUtils';
import { buildSimpleDailyTimeSeries, getLowerMap, lookupAsset } from './muscleAnalyticsHelpers';

// ============================================================================
// Types (merged from muscleAnalyticsTypes.ts)
// ============================================================================

/** Legacy interface for backwards compatibility */
export interface MuscleTimeSeriesEntry {
  timestamp: number;
  dateFormatted: string;
  [muscle: string]: number | string;
}

/** Legacy interface for backwards compatibility */
export interface MuscleTimeSeriesResult {
  data: MuscleTimeSeriesEntry[];
  keys: string[];
}

export interface MuscleCompositionEntry {
  subject: string;
  value: number;
}

export interface MuscleCompositionResult {
  data: MuscleCompositionEntry[];
  label: string;
}

export type { NormalizedMuscleGroup } from './muscleNormalization';
export { normalizeMuscleGroup } from './muscleNormalization';

// ============================================================================
// Re-exports from Rolling Volume Calculator
// ============================================================================

export type { VolumeTimeSeriesResult, VolumeTimeSeriesEntry, RollingWeeklyVolume };
export type { VolumePeriod };



// ============================================================================
// Main API Functions
// ============================================================================

/**
 * Gets muscle volume time series aggregated by muscle groups.
 *
 * Period semantics (biologically meaningful):
 * - 'weekly': Rolling 7-day sum showing true weekly volume per muscle group
 * - 'monthly': Average weekly sets per muscle group for each month
 * - 'yearly': Average weekly sets per muscle group for each year
 * - 'daily': Raw daily volume (not rolling, for detailed analysis)
 *
 * Break periods (>7 days without training) are automatically excluded from averages.
 *
 * @param data - Workout set data
 * @param assetsMap - Exercise asset mappings for muscle lookups
 * @param period - Time period for aggregation
 * @returns Time series data with muscle group keys
 */
export const getMuscleVolumeTimeSeries = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'daily' | 'yearly' = 'weekly'
): MuscleTimeSeriesResult => {
  // Daily uses the old simple aggregation (no rolling needed)
  if (period === 'daily') {
    return buildSimpleDailyTimeSeries(data, assetsMap, true);
  }

  // Weekly/Monthly/Yearly use rolling window calculations
  return getMuscleVolumeTimeSeriesRolling(data, assetsMap, period as VolumePeriod, true);
};

/**
 * Gets muscle volume time series with detailed individual muscles.
 *
 * Same period semantics as getMuscleVolumeTimeSeries but returns
 * individual muscle names instead of aggregated groups.
 *
 * @param data - Workout set data
 * @param assetsMap - Exercise asset mappings
 * @param period - Time period for aggregation
 * @returns Time series data with individual muscle keys
 */
export const getMuscleVolumeTimeSeriesDetailed = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'daily' | 'yearly' = 'weekly'
): MuscleTimeSeriesResult => {
  if (period === 'daily') {
    return buildSimpleDailyTimeSeries(data, assetsMap, false);
  }

  return getMuscleVolumeTimeSeriesRolling(data, assetsMap, period as VolumePeriod, false);
};

export const getMuscleVolumeTimeSeriesCalendar = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'daily' | 'yearly' = 'weekly'
): MuscleTimeSeriesResult => {
  const lowerMap = getLowerMap(assetsMap);
  const result = buildTimeSeries<WorkoutSet>(data, period as TimePeriod, (set) => {
    if (isWarmupSet(set)) return {};
    const name = set.exercise_title || '';
    const asset = lookupAsset(name, assetsMap, lowerMap);
    if (!asset) return {};
    const contributions = getMuscleContributionsFromAsset(asset, true);
    if (contributions.length === 0) return {};
    const out: Record<string, number> = {};
    for (const c of contributions) {
      out[c.muscle] = (out[c.muscle] || 0) + c.sets;
    }
    return out;
  });
  return { data: result.data as MuscleTimeSeriesEntry[], keys: result.keys };
};

export const getMuscleVolumeTimeSeriesDetailedCalendar = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'daily' | 'yearly' = 'weekly'
): MuscleTimeSeriesResult => {
  const lowerMap = getLowerMap(assetsMap);
  const result = buildTimeSeries<WorkoutSet>(data, period as TimePeriod, (set) => {
    if (isWarmupSet(set)) return {};
    const name = set.exercise_title || '';
    const asset = lookupAsset(name, assetsMap, lowerMap);
    if (!asset) return {};
    const contributions = getMuscleContributionsFromAsset(asset, false);
    if (contributions.length === 0) return {};
    const out: Record<string, number> = {};
    for (const c of contributions) {
      out[c.muscle] = (out[c.muscle] || 0) + c.sets;
    }
    return out;
  });
  return { data: result.data as MuscleTimeSeriesEntry[], keys: result.keys };
};

/**
 * Gets the latest rolling weekly muscle composition.
 * Shows current 7-day volume per muscle, useful for radar/heatmap displays.
 *
 * @param data - Workout set data
 * @param assetsMap - Exercise asset mappings
 * @param period - Period hint (weekly recommended for meaningful comparison)
 * @returns Composition data sorted by volume (descending)
 */
export const getDetailedMuscleCompositionLatest = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'yearly' = 'weekly'
): MuscleCompositionResult => {
  const latestVolume = getLatestRollingWeeklyVolume(data, assetsMap, false);

  if (!latestVolume) {
    return { data: [], label: '' };
  }

  const arr: MuscleCompositionEntry[] = Array.from(latestVolume.muscles.entries())
    .map(([subject, value]) => ({ subject, value }))
    .sort((a, b) => b.value - a.value);

  return {
    data: arr,
    label: period === 'weekly' ? 'Last 7 days' : `Latest ${period}`,
  };
};
