import { startOfDay, format } from 'date-fns';
import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../data/exerciseAssets';
import { isWarmupSet } from '../../analysis/classification';
import { getMuscleContributionsFromAsset } from '../analytics/muscleContributions';
import { getSvgIdsForCsvMuscleName } from '../mapping/muscleMapping';
import { normalizeMuscleGroup } from '../analytics/muscleNormalization';
import { MUSCLE_GROUP_TO_SVG_IDS } from '../mapping/muscleMappingConstants';
import { getAssetLowerMap, lookupExerciseAsset } from './rollingVolumeAssets';
import type { DailyMuscleVolume, KeyedContribution } from './rollingVolumeTypes';

type MuscleVolumeMap = Map<string, number>;

/**
 * Groups workout sets by day and computes muscle volume for each day.
 *
 * This is the foundation for all rolling calculations - we first need to know
 * exactly how much volume was done on each individual training day.
 *
 * @param data - All workout sets
 * @param getContributions - Function to get contributions for each set
 * @returns Sorted array of daily volumes (ascending by date)
 */
export function computeDailyKeyedVolumes(
  data: readonly WorkoutSet[],
  getContributions: (set: WorkoutSet) => ReadonlyArray<KeyedContribution> | null | undefined
): DailyMuscleVolume[] {
  const dailyMap = new Map<string, { date: Date; muscles: MuscleVolumeMap }>();

  for (const set of data) {
    if (!set.parsedDate) continue;
    if (isWarmupSet(set)) continue;

    const contributions = getContributions(set);
    if (!contributions || contributions.length === 0) continue;

    // Normalize to start of day for grouping
    const dayStart = startOfDay(set.parsedDate);
    const dateKey = format(dayStart, 'yyyy-MM-dd');

    let dayEntry = dailyMap.get(dateKey);
    if (!dayEntry) {
      dayEntry = { date: dayStart, muscles: new Map() };
      dailyMap.set(dateKey, dayEntry);
    }

    // Accumulate set contributions
    for (const { key, sets } of contributions) {
      const current = dayEntry.muscles.get(key) ?? 0;
      dayEntry.muscles.set(key, current + sets);
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

  return computeDailyKeyedVolumes(data, (set) => {
    const exerciseName = set.exercise_title || '';
    const asset = lookupExerciseAsset(exerciseName, assetsMap, lowerMap);
    if (!asset) return null;

    const contributions = getMuscleContributionsFromAsset(asset, useGroups);
    if (contributions.length === 0) return null;

    return contributions.map((c) => ({ key: c.muscle, sets: c.sets }));
  });
}

/**
 * Groups workout sets by day and computes volumes keyed by SVG muscle IDs.
 *
 * This matches how the Muscle View selects muscles (SVG IDs like "upper-pectoralis")
 * while still using the asset-based contribution rules:
 * - Primary: 1 set
 * - Secondary: 0.5 sets
 * - Cardio: ignored
 * - Full Body: contributes 1 set to each major muscle group (then mapped to SVG IDs)
 */
export function computeDailySvgMuscleVolumes(
  data: readonly WorkoutSet[],
  assetsMap: Map<string, ExerciseAsset>
): DailyMuscleVolume[] {
  const lowerMap = getAssetLowerMap(assetsMap);

  return computeDailyKeyedVolumes(data, (set) => {
    const exerciseName = set.exercise_title || '';
    const asset = lookupExerciseAsset(exerciseName, assetsMap, lowerMap);
    if (!asset) return null;

    const primaryGroup = normalizeMuscleGroup(asset.primary_muscle);
    const useGroupsForContributions = primaryGroup === 'Full Body';

    const contributions = getMuscleContributionsFromAsset(asset, useGroupsForContributions);
    if (contributions.length === 0) return null;

    const out: KeyedContribution[] = [];
    for (const c of contributions) {
      let svgIds = getSvgIdsForCsvMuscleName(c.muscle);
      if (svgIds.length === 0) {
        const group = normalizeMuscleGroup(c.muscle);
        const groupSvgIds = (MUSCLE_GROUP_TO_SVG_IDS as any)[group] as readonly string[] | undefined;
        svgIds = groupSvgIds ? [...groupSvgIds] : [];
      }
      if (svgIds.length === 0) continue;
      for (const svgId of svgIds) {
        out.push({ key: svgId, sets: c.sets });
      }
    }

    return out;
  });
}
