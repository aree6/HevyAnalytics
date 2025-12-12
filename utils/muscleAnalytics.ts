import { WorkoutSet } from '../types';
import type { ExerciseAsset } from './exerciseAssets';
import { getDateKey, TimePeriod, sortByTimestamp } from './dateUtils';
import { roundTo } from './formatters';

/**
 * Normalized muscle group type for CSV-based muscle data.
 * Used for aggregating muscle volume from exercise primary/secondary muscle data.
 */
export type NormalizedMuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Cardio' | 'Full Body' | 'Other';

const MUSCLE_GROUP_PATTERNS: ReadonlyArray<[NormalizedMuscleGroup, ReadonlyArray<string>]> = [
  ['Chest', ['chest', 'pec']],
  ['Back', ['lat', 'upper back', 'back', 'lower back']],
  ['Shoulders', ['shoulder', 'delto']],
  ['Arms', ['bicep', 'tricep', 'forearm', 'arms']],
  ['Legs', ['quad', 'hamstring', 'glute', 'calv', 'thigh', 'hip', 'adductor', 'abductor']],
  ['Core', ['abdom', 'core', 'waist']],
  ['Cardio', ['cardio']],
  ['Full Body', ['full body', 'full-body']],
];

const muscleGroupCache = new Map<string, NormalizedMuscleGroup>();

export const normalizeMuscleGroup = (m?: string): NormalizedMuscleGroup => {
  if (!m) return 'Other';
  const key = String(m).trim().toLowerCase();
  if (key === 'none' || key === '') return 'Other';
  
  const cached = muscleGroupCache.get(key);
  if (cached) return cached;
  
  for (const [group, patterns] of MUSCLE_GROUP_PATTERNS) {
    for (const pattern of patterns) {
      if (key.includes(pattern) || key === pattern) {
        muscleGroupCache.set(key, group);
        return group;
      }
    }
  }
  
  muscleGroupCache.set(key, 'Other');
  return 'Other';
};

const FULL_BODY_GROUPS: readonly NormalizedMuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

let cachedLowerMap: Map<string, ExerciseAsset> | null = null;
let cachedAssetsMapRef: Map<string, ExerciseAsset> | null = null;

const getLowerMap = (assetsMap: Map<string, ExerciseAsset>): Map<string, ExerciseAsset> => {
  if (cachedAssetsMapRef === assetsMap && cachedLowerMap) return cachedLowerMap;
  
  cachedLowerMap = new Map<string, ExerciseAsset>();
  assetsMap.forEach((v, k) => cachedLowerMap!.set(k.toLowerCase(), v));
  cachedAssetsMapRef = assetsMap;
  return cachedLowerMap;
};

const lookupAsset = (
  name: string, 
  assetsMap: Map<string, ExerciseAsset>, 
  lowerMap: Map<string, ExerciseAsset>
): ExerciseAsset | undefined => {
  return assetsMap.get(name) ?? lowerMap.get(name.toLowerCase());
};

interface MuscleContribution {
  muscle: string;
  sets: number;
}

const extractMuscleContributions = (
  asset: ExerciseAsset,
  useGroups: boolean
): MuscleContribution[] => {
  const contributions: MuscleContribution[] = [];
  const primaryRaw = String(asset.primary_muscle ?? '').trim();
  
  if (!primaryRaw || /cardio/i.test(primaryRaw)) return contributions;
  
  const primary = useGroups ? normalizeMuscleGroup(primaryRaw) : primaryRaw;
  
  if (primary === 'Full Body' && useGroups) {
    for (const grp of FULL_BODY_GROUPS) {
      contributions.push({ muscle: grp, sets: 1.0 });
    }
    return contributions;
  }
  
  if (/full\s*body/i.test(primaryRaw) && !useGroups) {
    return contributions;
  }
  
  contributions.push({ muscle: primary, sets: 1.0 });
  
  const secondaryRaw = String(asset.secondary_muscle ?? '').trim();
  if (secondaryRaw && !/none/i.test(secondaryRaw)) {
    const secondaries = secondaryRaw.split(',');
    for (const s of secondaries) {
      const trimmed = s.trim();
      if (!trimmed || /cardio/i.test(trimmed) || /full\s*body/i.test(trimmed)) continue;
      const secondary = useGroups ? normalizeMuscleGroup(trimmed) : trimmed;
      if (secondary === 'Cardio') continue;
      contributions.push({ muscle: secondary, sets: 0.5 });
    }
  }
  
  return contributions;
};

export interface MuscleTimeSeriesEntry {
  timestamp: number;
  dateFormatted: string;
  [muscle: string]: number | string;
}

export interface MuscleTimeSeriesResult {
  data: MuscleTimeSeriesEntry[];
  keys: string[];
}

const buildMuscleTimeSeries = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: TimePeriod,
  useGroups: boolean
): MuscleTimeSeriesResult => {
  const lowerMap = getLowerMap(assetsMap);
  const grouped = new Map<string, { 
    timestamp: number; 
    label: string; 
    volumes: Map<string, number> 
  }>();

  for (const set of data) {
    if (!set.parsedDate) continue;
    
    const name = set.exercise_title || '';
    const asset = lookupAsset(name, assetsMap, lowerMap);
    if (!asset) continue;
    
    const contributions = extractMuscleContributions(asset, useGroups);
    if (contributions.length === 0) continue;

    const { key, timestamp, label } = getDateKey(set.parsedDate, period);
    
    let bucket = grouped.get(key);
    if (!bucket) {
      bucket = { timestamp, label, volumes: new Map() };
      grouped.set(key, bucket);
    }

    for (const { muscle, sets } of contributions) {
      const current = bucket.volumes.get(muscle) ?? 0;
      bucket.volumes.set(muscle, current + sets);
    }
  }

  const entries = sortByTimestamp(Array.from(grouped.values()));
  const keysSet = new Set<string>();
  for (const e of entries) {
    for (const k of e.volumes.keys()) {
      keysSet.add(k);
    }
  }
  const keys = Array.from(keysSet);

  const series: MuscleTimeSeriesEntry[] = entries.map(e => {
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
};

export const getMuscleVolumeTimeSeries = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'daily' | 'yearly' = 'weekly'
): MuscleTimeSeriesResult => {
  return buildMuscleTimeSeries(data, assetsMap, period, true);
};

export interface MuscleCompositionEntry {
  subject: string;
  value: number;
}

export interface MuscleCompositionResult {
  data: MuscleCompositionEntry[];
  label: string;
}

export const getDetailedMuscleCompositionLatest = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'yearly' = 'weekly'
): MuscleCompositionResult => {
  const lowerMap = getLowerMap(assetsMap);
  const buckets = new Map<string, { label: string; counts: Map<string, number> }>();

  for (const set of data) {
    if (!set.parsedDate) continue;
    
    const name = set.exercise_title || '';
    const asset = lookupAsset(name, assetsMap, lowerMap);
    if (!asset) continue;

    const contributions = extractMuscleContributions(asset, false);
    if (contributions.length === 0) continue;

    const { key, label } = getDateKey(set.parsedDate, period);
    
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label, counts: new Map() };
      buckets.set(key, bucket);
    }

    for (const { muscle, sets } of contributions) {
      const current = bucket.counts.get(muscle) ?? 0;
      bucket.counts.set(muscle, current + sets);
    }
  }

  const keys = Array.from(buckets.keys()).sort();
  if (keys.length === 0) return { data: [], label: '' };
  
  const latest = buckets.get(keys[keys.length - 1])!;
  const arr: MuscleCompositionEntry[] = Array.from(latest.counts.entries())
    .map(([subject, value]) => ({ subject, value: roundTo(value, 1) }))
    .sort((a, b) => b.value - a.value);
  
  return { data: arr, label: latest.label };
};

export const getMuscleVolumeTimeSeriesDetailed = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  period: 'weekly' | 'monthly' | 'daily' | 'yearly' = 'weekly'
): MuscleTimeSeriesResult => {
  return buildMuscleTimeSeries(data, assetsMap, period, false);
};
