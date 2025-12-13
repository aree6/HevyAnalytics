/**
 * Rolling Volume Calculator
 * 
 * Computes biologically-meaningful training volume metrics using rolling windows
 * rather than calendar boundaries. This approach eliminates calendar artifacts
 * and provides accurate weekly set counts that can be compared against
 * hypertrophy recommendations (typically 10-20 sets per muscle per week).
 * 
 * Key concepts:
 * - Rolling 7-day window: Sums sets from the preceding 7 days for any given day
 * - Break detection: Periods >7 consecutive days without workouts are excluded
 * - Average weekly sets: Monthly/yearly metrics show average weekly volume, not totals
 * 
 * Set counting rules:
 * - Primary muscle: 1 set
 * - Secondary muscle: 0.5 sets
 * - Cardio: Ignored entirely
 * - Full Body: Adds 1 set to each major muscle group
 */

import { WorkoutSet } from '../types';
import type { ExerciseAsset } from './exerciseAssets';
import { startOfDay, differenceInDays, startOfMonth, startOfYear, format } from 'date-fns';
import { roundTo } from './formatters';

// ============================================================================
// Constants
// ============================================================================

/** Days in a rolling week window */
const ROLLING_WINDOW_DAYS = 7;

/** Consecutive days without workouts that constitutes a training break */
const BREAK_THRESHOLD_DAYS = 7;

/** Muscle groups that receive sets from Full Body exercises */
const FULL_BODY_TARGET_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;

// ============================================================================
// Types
// ============================================================================

/** Represents daily muscle volume for a single workout day */
export interface DailyMuscleVolume {
  readonly date: Date;
  readonly dateKey: string;
  readonly muscles: ReadonlyMap<string, number>;
}

/** Rolling 7-day volume snapshot for a specific day */
export interface RollingWeeklyVolume {
  readonly date: Date;
  readonly dateKey: string;
  readonly muscles: ReadonlyMap<string, number>;
  readonly totalSets: number;
  readonly isInBreak: boolean;
}

/** Aggregated volume for a time period (month/year) */
export interface PeriodAverageVolume {
  readonly periodKey: string;
  readonly periodLabel: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly avgWeeklySets: ReadonlyMap<string, number>;
  readonly totalAvgSets: number;
  readonly trainingDaysCount: number;
  readonly weeksIncluded: number;
}

/** Time series entry for charting */
export interface VolumeTimeSeriesEntry {
  readonly timestamp: number;
  readonly dateFormatted: string;
  readonly [muscle: string]: number | string;
}

/** Result of time series computation */
export interface VolumeTimeSeriesResult {
  readonly data: VolumeTimeSeriesEntry[];
  readonly keys: string[];
}

type MuscleVolumeMap = Map<string, number>;

// ============================================================================
// Muscle Contribution Extraction
// ============================================================================

/** Cache for normalized muscle group mappings */
const muscleGroupNormalizationCache = new Map<string, string>();

/** Patterns to identify muscle groups from exercise data */
const MUSCLE_GROUP_PATTERNS: ReadonlyArray<[string, ReadonlyArray<string>]> = [
  ['Chest', ['chest', 'pec']],
  ['Back', ['lat', 'upper back', 'back', 'lower back']],
  ['Shoulders', ['shoulder', 'delto']],
  ['Arms', ['bicep', 'tricep', 'forearm', 'arms']],
  ['Legs', ['quad', 'hamstring', 'glute', 'calv', 'thigh', 'hip', 'adductor', 'abductor']],
  ['Core', ['abdom', 'core', 'waist', 'oblique']],
];

/**
 * Normalizes a raw muscle name to a standard muscle group.
 * Uses caching for performance on repeated lookups.
 */
function normalizeMuscleToGroup(rawMuscle: string | undefined): string | null {
  if (!rawMuscle) return null;
  
  const key = rawMuscle.trim().toLowerCase();
  if (!key || key === 'none') return null;
  
  // Check cache first
  const cached = muscleGroupNormalizationCache.get(key);
  if (cached !== undefined) return cached || null;
  
  // Skip cardio entirely
  if (key.includes('cardio')) {
    muscleGroupNormalizationCache.set(key, '');
    return null;
  }
  
  // Match against patterns
  for (const [group, patterns] of MUSCLE_GROUP_PATTERNS) {
    for (const pattern of patterns) {
      if (key.includes(pattern)) {
        muscleGroupNormalizationCache.set(key, group);
        return group;
      }
    }
  }
  
  // Unrecognized muscle - use as-is for detailed view
  muscleGroupNormalizationCache.set(key, rawMuscle.trim());
  return rawMuscle.trim();
}

/**
 * Checks if an exercise is a Full Body exercise.
 */
function isFullBodyExercise(primaryMuscle: string | undefined): boolean {
  if (!primaryMuscle) return false;
  return /full\s*body/i.test(primaryMuscle);
}

/**
 * Checks if an exercise is Cardio (should be ignored).
 */
function isCardioExercise(primaryMuscle: string | undefined): boolean {
  if (!primaryMuscle) return false;
  return /cardio/i.test(primaryMuscle);
}

/**
 * Extracts muscle contributions from an exercise asset.
 * 
 * @param asset - Exercise asset containing muscle data
 * @param useGroups - If true, normalize to muscle groups; if false, use detailed muscle names
 * @returns Array of muscle contributions with set values (1.0 for primary, 0.5 for secondary)
 */
function extractMuscleContributions(
  asset: ExerciseAsset,
  useGroups: boolean
): Array<{ muscle: string; sets: number }> {
  const contributions: Array<{ muscle: string; sets: number }> = [];
  const primaryRaw = String(asset.primary_muscle ?? '').trim();
  
  // Skip cardio exercises entirely
  if (isCardioExercise(primaryRaw)) return contributions;
  
  // Handle Full Body exercises - distribute 1 set to each major group
  if (isFullBodyExercise(primaryRaw)) {
    if (useGroups) {
      for (const group of FULL_BODY_TARGET_GROUPS) {
        contributions.push({ muscle: group, sets: 1.0 });
      }
    }
    // For detailed view, Full Body doesn't map to specific muscles
    return contributions;
  }
  
  // Process primary muscle (1.0 set)
  const primary = useGroups ? normalizeMuscleToGroup(primaryRaw) : primaryRaw;
  if (primary) {
    contributions.push({ muscle: primary, sets: 1.0 });
  }
  
  // Process secondary muscles (0.5 sets each)
  const secondaryRaw = String(asset.secondary_muscle ?? '').trim();
  if (secondaryRaw && !/none/i.test(secondaryRaw)) {
    const secondaries = secondaryRaw.split(',');
    for (const s of secondaries) {
      const trimmed = s.trim();
      if (!trimmed || isCardioExercise(trimmed) || isFullBodyExercise(trimmed)) continue;
      
      const secondary = useGroups ? normalizeMuscleToGroup(trimmed) : trimmed;
      if (secondary) {
        contributions.push({ muscle: secondary, sets: 0.5 });
      }
    }
  }
  
  return contributions;
}

// ============================================================================
// Daily Volume Computation
// ============================================================================

/** Cache for lowercase asset lookups */
let assetLowerCache: Map<string, ExerciseAsset> | null = null;
let assetCacheRef: Map<string, ExerciseAsset> | null = null;

/**
 * Gets or creates a lowercase-keyed version of the assets map for case-insensitive lookups.
 */
function getAssetLowerMap(assetsMap: Map<string, ExerciseAsset>): Map<string, ExerciseAsset> {
  if (assetCacheRef === assetsMap && assetLowerCache) return assetLowerCache;
  
  assetLowerCache = new Map();
  assetsMap.forEach((v, k) => assetLowerCache!.set(k.toLowerCase(), v));
  assetCacheRef = assetsMap;
  return assetLowerCache;
}

/**
 * Looks up an exercise asset by name (case-insensitive fallback).
 */
function lookupExerciseAsset(
  name: string,
  assetsMap: Map<string, ExerciseAsset>,
  lowerMap: Map<string, ExerciseAsset>
): ExerciseAsset | undefined {
  return assetsMap.get(name) ?? lowerMap.get(name.toLowerCase());
}

/**
 * Groups workout sets by day and computes muscle volume for each day.
 * 
 * This is the foundation for all rolling calculations - we first need to know
 * exactly how much volume was done on each individual training day.
 * 
 * @param data - All workout sets
 * @param assetsMap - Exercise asset data for muscle lookups
 * @param useGroups - Whether to group into muscle groups or use detailed muscles
 * @returns Sorted array of daily volumes (ascending by date)
 */
export function computeDailyMuscleVolumes(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  useGroups: boolean
): DailyMuscleVolume[] {
  const lowerMap = getAssetLowerMap(assetsMap);
  const dailyMap = new Map<string, { date: Date; muscles: MuscleVolumeMap }>();
  
  for (const set of data) {
    if (!set.parsedDate) continue;
    
    const exerciseName = set.exercise_title || '';
    const asset = lookupExerciseAsset(exerciseName, assetsMap, lowerMap);
    if (!asset) continue;
    
    const contributions = extractMuscleContributions(asset, useGroups);
    if (contributions.length === 0) continue;
    
    // Normalize to start of day for grouping
    const dayStart = startOfDay(set.parsedDate);
    const dateKey = format(dayStart, 'yyyy-MM-dd');
    
    let dayEntry = dailyMap.get(dateKey);
    if (!dayEntry) {
      dayEntry = { date: dayStart, muscles: new Map() };
      dailyMap.set(dateKey, dayEntry);
    }
    
    // Accumulate set contributions
    for (const { muscle, sets } of contributions) {
      const current = dayEntry.muscles.get(muscle) ?? 0;
      dayEntry.muscles.set(muscle, current + sets);
    }
  }
  
  // Convert to sorted array (ascending by date)
  const dailyVolumes: DailyMuscleVolume[] = Array.from(dailyMap.entries())
    .map(([dateKey, entry]) => ({
      date: entry.date,
      dateKey,
      muscles: entry.muscles as ReadonlyMap<string, number>,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return dailyVolumes;
}

// ============================================================================
// Break Detection
// ============================================================================

/**
 * Identifies training breaks in the workout history.
 * A break is defined as >7 consecutive days without any workouts.
 * 
 * @param dailyVolumes - Sorted daily volumes (ascending)
 * @returns Set of date keys that fall within a break period
 */
export function identifyBreakPeriods(
  dailyVolumes: readonly DailyMuscleVolume[]
): Set<string> {
  const breakDateKeys = new Set<string>();
  
  if (dailyVolumes.length < 2) return breakDateKeys;
  
  for (let i = 1; i < dailyVolumes.length; i++) {
    const prevDay = dailyVolumes[i - 1].date;
    const currDay = dailyVolumes[i].date;
    const gapDays = differenceInDays(currDay, prevDay);
    
    // If gap > 7 days, mark the first workout back as "returning from break"
    // The gap period itself has no workouts, so nothing to mark there
    if (gapDays > BREAK_THRESHOLD_DAYS) {
      // Mark the current day as coming out of a break
      // Rolling calculations for this day should be treated carefully
      breakDateKeys.add(dailyVolumes[i].dateKey);
    }
  }
  
  return breakDateKeys;
}

// ============================================================================
// Rolling 7-Day Window Calculation
// ============================================================================

/**
 * Computes rolling 7-day volume for each training day.
 * 
 * For each workout day, this sums all sets from that day and the preceding 6 days,
 * giving a true "weekly volume" snapshot that isn't affected by calendar boundaries.
 * 
 * @param dailyVolumes - Sorted daily volumes (ascending)
 * @param breakDates - Set of date keys that are affected by breaks
 * @returns Array of rolling weekly volumes for each training day
 */
export function computeRollingWeeklyVolumes(
  dailyVolumes: readonly DailyMuscleVolume[],
  breakDates: Set<string>
): RollingWeeklyVolume[] {
  const rollingVolumes: RollingWeeklyVolume[] = [];
  
  for (let i = 0; i < dailyVolumes.length; i++) {
    const currentDay = dailyVolumes[i];
    const windowStart = new Date(currentDay.date.getTime() - (ROLLING_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);
    
    // Accumulate sets from all days in the rolling window
    const muscleAccum = new Map<string, number>();
    let totalSets = 0;
    
    // Look back through daily volumes to find days within the window
    for (let j = i; j >= 0; j--) {
      const checkDay = dailyVolumes[j];
      
      // Stop if we've gone past the window
      if (checkDay.date < windowStart) break;
      
      // Add this day's contribution
      for (const [muscle, sets] of checkDay.muscles) {
        const current = muscleAccum.get(muscle) ?? 0;
        muscleAccum.set(muscle, current + sets);
        totalSets += sets;
      }
    }
    
    rollingVolumes.push({
      date: currentDay.date,
      dateKey: currentDay.dateKey,
      muscles: muscleAccum as ReadonlyMap<string, number>,
      totalSets: roundTo(totalSets, 1),
      isInBreak: breakDates.has(currentDay.dateKey),
    });
  }
  
  return rollingVolumes;
}

// ============================================================================
// Period Aggregation (Monthly/Yearly Averages)
// ============================================================================

type PeriodType = 'monthly' | 'yearly';

/**
 * Gets the period key for grouping (e.g., "2024-01" for monthly, "2024" for yearly).
 */
function getPeriodKey(date: Date, periodType: PeriodType): string {
  return periodType === 'monthly'
    ? format(date, 'yyyy-MM')
    : format(date, 'yyyy');
}

/**
 * Gets a human-readable label for the period.
 */
function getPeriodLabel(date: Date, periodType: PeriodType): string {
  return periodType === 'monthly'
    ? format(date, 'MMM yyyy')
    : format(date, 'yyyy');
}

/**
 * Gets the start date of the period.
 */
function getPeriodStart(date: Date, periodType: PeriodType): Date {
  return periodType === 'monthly' ? startOfMonth(date) : startOfYear(date);
}

/**
 * Aggregates rolling weekly volumes into monthly or yearly averages.
 * 
 * This computes the AVERAGE weekly sets per muscle for the period, which is
 * the biologically-meaningful metric for comparing against hypertrophy recommendations.
 * 
 * Key behaviors:
 * - Excludes rolling volumes from days returning from breaks (>7 day gaps)
 * - Averages are computed only from valid training weeks
 * - Empty periods are not included in results
 * 
 * @param rollingVolumes - Rolling weekly volumes for each training day
 * @param periodType - 'monthly' or 'yearly'
 * @returns Array of period averages sorted by date
 */
export function computePeriodAverageVolumes(
  rollingVolumes: readonly RollingWeeklyVolume[],
  periodType: PeriodType
): PeriodAverageVolume[] {
  // Group rolling volumes by period
  const periodGroups = new Map<string, {
    startDate: Date;
    label: string;
    volumes: RollingWeeklyVolume[];
  }>();
  
  for (const rv of rollingVolumes) {
    // Skip days returning from breaks - they have incomplete rolling windows
    if (rv.isInBreak) continue;
    
    const periodKey = getPeriodKey(rv.date, periodType);
    
    let group = periodGroups.get(periodKey);
    if (!group) {
      group = {
        startDate: getPeriodStart(rv.date, periodType),
        label: getPeriodLabel(rv.date, periodType),
        volumes: [],
      };
      periodGroups.set(periodKey, group);
    }
    
    group.volumes.push(rv);
  }
  
  // Compute averages for each period
  const periodAverages: PeriodAverageVolume[] = [];
  
  for (const [periodKey, group] of periodGroups) {
    if (group.volumes.length === 0) continue;
    
    // Collect all muscles seen in this period
    const allMuscles = new Set<string>();
    for (const rv of group.volumes) {
      for (const muscle of rv.muscles.keys()) {
        allMuscles.add(muscle);
      }
    }
    
    // Compute average for each muscle
    const avgMuscles = new Map<string, number>();
    let totalAvg = 0;
    
    for (const muscle of allMuscles) {
      let sum = 0;
      for (const rv of group.volumes) {
        sum += rv.muscles.get(muscle) ?? 0;
      }
      // Average across all sampled days
      const avg = sum / group.volumes.length;
      avgMuscles.set(muscle, roundTo(avg, 1));
      totalAvg += avg;
    }
    
    // Find date range
    const dates = group.volumes.map(v => v.date);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    periodAverages.push({
      periodKey,
      periodLabel: group.label,
      startDate: minDate,
      endDate: maxDate,
      avgWeeklySets: avgMuscles as ReadonlyMap<string, number>,
      totalAvgSets: roundTo(totalAvg, 1),
      trainingDaysCount: group.volumes.length,
      weeksIncluded: Math.ceil(group.volumes.length / 7), // Approximate weeks
    });
  }
  
  // Sort by period key (chronological)
  periodAverages.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
  
  return periodAverages;
}

// ============================================================================
// Time Series Builders (for Charts)
// ============================================================================

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
    .filter(rv => !rv.isInBreak) // Exclude break recovery days from display
    .map(rv => {
      const entry: Record<string, number | string> = {
        timestamp: rv.date.getTime(),
        dateFormatted: format(rv.date, 'MMM d'),
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
  const seriesData: VolumeTimeSeriesEntry[] = periodAverages.map(pa => {
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

// ============================================================================
// Public API - Main Entry Points
// ============================================================================

export type VolumePeriod = 'weekly' | 'monthly' | 'yearly';

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
