import type { WorkoutSet } from '../../types';
import type { ExerciseAsset } from '../data/exerciseAssets';
import { isWarmupSet } from '../analysis/setClassification';
import { createExerciseAssetLookup } from '../exercise/exerciseAssetLookup';
import { parseMuscleFields } from './muscleContributions';
import { normalizeMuscleGroup, type NormalizedMuscleGroup } from './muscleNormalization';
import { getSvgIdsForCsvMuscleName } from './muscleMapping';
import { FULL_BODY_TARGET_GROUPS } from './muscleMappingConstants';

export type WindowedBreakdownGrouping = 'groups' | 'muscles';

export type WindowedExerciseBreakdown = {
  totalSetsInWindow: number;
  exercises: Map<string, { sets: number; primarySets: number; secondarySets: number }>;
};

type LookupAsset = (name: string) => ExerciseAsset | undefined;

const addExerciseInc = (
  exerciseMap: Map<string, { sets: number; primarySets: number; secondarySets: number }>,
  exerciseName: string,
  inc: { sets: number; primarySets: number; secondarySets: number }
) => {
  const prev = exerciseMap.get(exerciseName) || { sets: 0, primarySets: 0, secondarySets: 0 };
  prev.sets += inc.sets;
  prev.primarySets += inc.primarySets;
  prev.secondarySets += inc.secondarySets;
  exerciseMap.set(exerciseName, prev);
};

const toSelectedSet = (selected: readonly string[] | null | undefined): Set<string> | null => {
  if (!selected || selected.length === 0) return null;
  return new Set(selected.map((s) => String(s).toLowerCase()));
};

const isSelectedHit = (selected: Set<string> | null, key: string): boolean => {
  if (!selected) return true;
  return selected.has(String(key).toLowerCase());
};

const computeGroupHitsForAsset = (asset: ExerciseAsset) => {
  const { primaries, secondaries } = parseMuscleFields(asset.primary_muscle, asset.secondary_muscle);

  const primaryGroups = primaries
    .map((m) => normalizeMuscleGroup(m))
    .filter((g): g is NormalizedMuscleGroup => g !== 'Other' && g !== 'Cardio');
  const secondaryGroups = secondaries
    .map((m) => normalizeMuscleGroup(m))
    .filter((g): g is NormalizedMuscleGroup => g !== 'Other' && g !== 'Cardio');

  return { primaryGroups, secondaryGroups, isFullBody: primaries.some((m) => /full[\s-]*body/i.test(m)) };
};

const computeSvgHitsForAsset = (asset: ExerciseAsset) => {
  const { primaries, secondaries } = parseMuscleFields(asset.primary_muscle, asset.secondary_muscle);

  const isFullBody = primaries.some((m) => /full[\s-]*body/i.test(m));
  if (isFullBody) {
    const svgIds = FULL_BODY_TARGET_GROUPS.flatMap((g) => getSvgIdsForCsvMuscleName(g));
    return { primarySvgIds: svgIds, secondarySvgIds: [] as string[], isFullBody };
  }

  const primarySvgIds = primaries.flatMap((m) => getSvgIdsForCsvMuscleName(m));
  const secondarySvgIds = secondaries.flatMap((m) => getSvgIdsForCsvMuscleName(m));
  return { primarySvgIds, secondarySvgIds, isFullBody };
};

/**
 * Computes a windowed per-exercise breakdown for either:
 * - `groups`: Chest/Back/Legs/etc (normalized)
 * - `muscles`: individual SVG muscle ids (anterior-deltoid, lats, etc)
 *
 * Selection behavior:
 * - If `selectedSubjects` is empty/null: counts all subjects.
 * - If provided: only counts contributions that hit one of the selected subjects.
 */
export const computeWindowedExerciseBreakdown = (params: {
  data: WorkoutSet[];
  assetsMap: Map<string, ExerciseAsset>;
  start: Date;
  end: Date;
  grouping: WindowedBreakdownGrouping;
  selectedSubjects?: readonly string[] | null;
}): WindowedExerciseBreakdown => {
  const { data, assetsMap, start, end, grouping, selectedSubjects } = params;

  const lookup = createExerciseAssetLookup(assetsMap);
  const lookupAsset: LookupAsset = (name: string) => lookup.getAsset(name);
  const selected = toSelectedSet(selectedSubjects);

  const assetByName = new Map<string, ExerciseAsset | null>();
  const groupHitsByName = new Map<string, ReturnType<typeof computeGroupHitsForAsset>>();
  const svgHitsByName = new Map<string, ReturnType<typeof computeSvgHitsForAsset>>();

  let total = 0;
  const exercises = new Map<string, { sets: number; primarySets: number; secondarySets: number }>();

  for (const s of data) {
    if (isWarmupSet(s)) continue;
    const d = s.parsedDate;
    if (!d) continue;
    if (d < start || d > end) continue;

    const exerciseName = s.exercise_title || '';
    let asset = assetByName.get(exerciseName);
    if (asset === undefined) {
      asset = lookupAsset(exerciseName) ?? null;
      assetByName.set(exerciseName, asset);
    }
    if (!asset) continue;

    if (grouping === 'groups') {
      let hit = groupHitsByName.get(exerciseName);
      if (!hit) {
        hit = computeGroupHitsForAsset(asset);
        groupHitsByName.set(exerciseName, hit);
      }
      const { primaryGroups, secondaryGroups, isFullBody } = hit;

      let inc = 0;
      let pInc = 0;
      let sInc = 0;

      if (isFullBody) {
        for (const g of FULL_BODY_TARGET_GROUPS) {
          if (!isSelectedHit(selected, g)) continue;
          inc += 1;
          pInc += 1;
        }
      } else {
        for (const g of primaryGroups) {
          if (!isSelectedHit(selected, g)) continue;
          inc += 1;
          pInc += 1;
        }
        for (const g of secondaryGroups) {
          if (!isSelectedHit(selected, g)) continue;
          inc += 0.5;
          sInc += 0.5;
        }
      }

      if (inc <= 0) continue;
      total += inc;
      addExerciseInc(exercises, exerciseName, { sets: inc, primarySets: pInc, secondarySets: sInc });
      continue;
    }

    let hit = svgHitsByName.get(exerciseName);
    if (!hit) {
      hit = computeSvgHitsForAsset(asset);
      svgHitsByName.set(exerciseName, hit);
    }
    const { primarySvgIds, secondarySvgIds } = hit;

    let inc = 0;
    let pInc = 0;
    let sInc = 0;

    for (const svgId of primarySvgIds) {
      if (!isSelectedHit(selected, svgId)) continue;
      inc += 1;
      pInc += 1;
    }

    for (const svgId of secondarySvgIds) {
      if (!isSelectedHit(selected, svgId)) continue;
      inc += 0.5;
      sInc += 0.5;
    }

    if (inc <= 0) continue;

    total += inc;
    addExerciseInc(exercises, exerciseName, { sets: inc, primarySets: pInc, secondarySets: sInc });
  }

  return { totalSetsInWindow: total, exercises };
};
