import { format, startOfDay } from 'date-fns';
import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../data/exerciseAssets';
import { roundTo } from '../../format/formatters';
import { formatDayContraction } from '../../date/dateUtils';
import { getMuscleContributionsFromAsset } from './muscleContributions';
import { isWarmupSet } from '../../analysis/classification';
import { createExerciseNameResolver, type ExerciseNameResolver } from '../../exercise/exerciseNameResolver';
import type { MuscleTimeSeriesEntry, MuscleTimeSeriesResult } from './muscleAnalytics';

let assetLowerCache: Map<string, ExerciseAsset> | null = null;
let assetCacheRef: Map<string, ExerciseAsset> | null = null;
let assetResolverCache: ExerciseNameResolver | null = null;
let assetResolverRef: Map<string, ExerciseAsset> | null = null;

export function getLowerMap(assetsMap: Map<string, ExerciseAsset>): Map<string, ExerciseAsset> {
  if (assetCacheRef === assetsMap && assetLowerCache) return assetLowerCache;

  assetLowerCache = new Map();
  assetsMap.forEach((v, k) => assetLowerCache!.set(k.toLowerCase(), v));
  assetCacheRef = assetsMap;
  return assetLowerCache;
}

function getResolver(assetsMap: Map<string, ExerciseAsset>): ExerciseNameResolver {
  if (assetResolverRef === assetsMap && assetResolverCache) return assetResolverCache;

  const names = Array.from(assetsMap.keys());
  assetResolverCache = createExerciseNameResolver(names);
  assetResolverRef = assetsMap;
  return assetResolverCache;
}

export function lookupAsset(
  name: string,
  assetsMap: Map<string, ExerciseAsset>,
  lowerMap: Map<string, ExerciseAsset>
): ExerciseAsset | undefined {
  if (!name) return undefined;

  // Fast path: exact match
  const exact = assetsMap.get(name);
  if (exact) return exact;

  // Fast path: case-insensitive match
  const lower = lowerMap.get(name.toLowerCase());
  if (lower) return lower;

  // Fallback: fuzzy matching
  const resolver = getResolver(assetsMap);
  const resolution = resolver.resolve(name);

  if (resolution.method !== 'none' && resolution.name) {
    return assetsMap.get(resolution.name) ?? lowerMap.get(resolution.name.toLowerCase());
  }

  return undefined;
}

/**
 * Builds a simple daily time series (no rolling, just per-day totals).
 * Used for the 'daily' period option.
 */
export function buildSimpleDailyTimeSeries(
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  useGroups: boolean
): MuscleTimeSeriesResult {
  const lowerMap = getLowerMap(assetsMap);
  const grouped = new Map<string, {
    timestamp: number;
    label: string;
    volumes: Map<string, number>;
  }>();

  for (const set of data) {
    if (!set.parsedDate) continue;
    if (isWarmupSet(set)) continue;

    const name = set.exercise_title || '';
    const asset = lookupAsset(name, assetsMap, lowerMap);
    if (!asset) continue;

    const contributions = getMuscleContributionsFromAsset(asset, useGroups);
    if (contributions.length === 0) continue;

    const dayStart = startOfDay(set.parsedDate);
    const dateKey = format(dayStart, 'yyyy-MM-dd');
    const timestamp = dayStart.getTime();

    let bucket = grouped.get(dateKey);
    if (!bucket) {
      const label = formatDayContraction(dayStart);
      bucket = { timestamp, label, volumes: new Map() };
      grouped.set(dateKey, bucket);
    }

    for (const { muscle, sets } of contributions) {
      bucket.volumes.set(muscle, (bucket.volumes.get(muscle) ?? 0) + sets);
    }
  }

  // Sort by timestamp and extract keys
  const entries = Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp);
  const keysSet = new Set<string>();
  for (const e of entries) {
    for (const k of e.volumes.keys()) keysSet.add(k);
  }
  const keys = Array.from(keysSet);

  const series: MuscleTimeSeriesEntry[] = entries.map((e) => {
    const row: MuscleTimeSeriesEntry = {
      timestamp: e.timestamp,
      dateFormatted: e.label,
    };
    for (const k of keys) {
      row[k] = roundTo(e.volumes.get(k) ?? 0, 1);
    }
    return row;
  });

  return { data: series, keys };
}
