import { differenceInCalendarDays, subDays } from 'date-fns';
import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../data/exerciseAssets';
import { MUSCLE_GROUP_TO_SVG_IDS, SVG_TO_MUSCLE_GROUP } from '../mapping/muscleMappingConstants';
import { getSvgIdsForCsvMuscleName } from '../mapping/muscleMapping';
import { getMuscleContributionsFromAsset } from './muscleContributions';
import { normalizeMuscleGroup } from './muscleNormalization';
import { isWarmupSet } from '../../analysis/classification';
import { createExerciseAssetLookup } from '../../exercise/exerciseAssetLookup';

export type WeeklySetsWindow = 'all' | '7d' | '30d' | '365d';
export type WeeklySetsGrouping = 'groups' | 'muscles';

export interface WeeklySetsHeatmapResult {
  volumes: Map<string, number>;
  maxVolume: number;
}

export interface WeeklySetsDashboardResult {
  heatmap: WeeklySetsHeatmapResult;
  weeklyRatesBySubject: Map<string, number>;
  weeks: number;
  windowStart: Date;
}

const getWindowStart = (data: WorkoutSet[], now: Date, window: WeeklySetsWindow): Date | null => {
  // Earliest known workout date across all sets.
  // We use this to avoid diluting averages for users with <1y history.
  let earliest: Date | null = null;
  for (const s of data) {
    const d = s.parsedDate;
    if (!d) continue;
    if (!earliest || d < earliest) earliest = d;
  }
  if (!earliest) return null;

  if (window === 'all') return earliest;

  const candidate =
    window === '7d'
      ? subDays(now, 7)
      : window === '30d'
        ? subDays(now, 30)
        : subDays(now, 365);

  // Clamp to the user's first workout date so we don't include pre-history empty time.
  return earliest > candidate ? earliest : candidate;
};

export const computeWeeklySetsDashboardData = (
  data: WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>,
  now: Date,
  window: WeeklySetsWindow,
  grouping: WeeklySetsGrouping
): WeeklySetsDashboardResult => {
  const windowStart = getWindowStart(data, now, window);
  if (!windowStart) {
    return {
      heatmap: { volumes: new Map(), maxVolume: 1 },
      weeklyRatesBySubject: new Map(),
      weeks: 1,
      windowStart: now,
    };
  }

  const lookup = createExerciseAssetLookup(assetsMap);

  const totals = new Map<string, number>();
  for (const s of data) {
    if (isWarmupSet(s)) continue;
    const d = s.parsedDate;
    if (!d) continue;
    if (d < windowStart || d > now) continue;

    const name = s.exercise_title || '';
    const asset = lookup.getAsset(name);
    if (!asset) continue;

    const primaryGroup = normalizeMuscleGroup(asset.primary_muscle);
    const useGroups = grouping === 'groups' || primaryGroup === 'Full Body';
    const contributions = getMuscleContributionsFromAsset(asset, useGroups);
    if (contributions.length === 0) continue;

    for (const c of contributions) {
      totals.set(c.muscle, (totals.get(c.muscle) ?? 0) + c.sets);
    }
  }

  const days = Math.max(1, differenceInCalendarDays(now, windowStart) + 1);
  const weeks = Math.max(1, days / 7);

  const weeklyRates = new Map<string, number>();
  for (const [k, v] of totals.entries()) {
    weeklyRates.set(k, Number((v / weeks).toFixed(1)));
  }

  const volumes = new Map<string, number>();
  let maxVolume = 0;

  if (grouping === 'groups') {
    for (const [group, val] of weeklyRates.entries()) {
      const svgIds = (MUSCLE_GROUP_TO_SVG_IDS as any)[group] as readonly string[] | undefined;
      if (!svgIds || svgIds.length === 0) continue;
      for (const svgId of svgIds) {
        volumes.set(svgId, val);
      }
      if (val > maxVolume) maxVolume = val;
    }
  } else {
    for (const [muscleName, val] of weeklyRates.entries()) {
      const svgIds = getSvgIdsForCsvMuscleName(muscleName);
      if (svgIds.length === 0) continue;
      for (const svgId of svgIds) {
        // Multiple distinct subject keys can map to the same SVG id (e.g. synonyms like
        // "Lats" vs "Latissimus Dorsi"). Accumulate so the heatmap reflects all work.
        volumes.set(svgId, (volumes.get(svgId) ?? 0) + val);
      }
      // maxVolume is based on the final per-svg value after any accumulation.
      for (const svgId of svgIds) {
        const next = volumes.get(svgId) ?? 0;
        if (next > maxVolume) maxVolume = next;
      }
    }
  }

  // Ensure all interactive ids used by the bodymap resolve to a group label when in group view.
  // This keeps hover labels stable for IDs like 'chest' / 'back'.
  if (grouping === 'groups') {
    for (const [svgId, group] of Object.entries(SVG_TO_MUSCLE_GROUP)) {
      if (volumes.has(svgId)) continue;
      const groupVal = weeklyRates.get(group) ?? 0;
      if (groupVal > 0) volumes.set(svgId, groupVal);
    }
  }

  return {
    heatmap: { volumes, maxVolume: Math.max(maxVolume, 1) },
    weeklyRatesBySubject: weeklyRates,
    weeks,
    windowStart,
  };
};
