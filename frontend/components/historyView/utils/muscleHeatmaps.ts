import { WorkoutSet } from '../../../types';
import { isWarmupSet } from '../../../utils/analysis/masterAlgorithm';
import { isUnilateralSet } from '../../../utils/analysis/classification';
import {
  ExerciseMuscleData,
  getExerciseMuscleVolumes,
  getSvgIdsForCsvMuscleName,
  lookupExerciseMuscleData,
} from '../../../utils/muscle/mapping';

/**
 * Muscle group mappings - maps a group display name to all its SVG part IDs.
 * Used to ensure consistent counting across session and exercise levels.
 */
const MUSCLE_GROUPS: Record<string, string[]> = {
  'Shoulders': ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid'],
  'Traps': ['upper-trapezius', 'lower-trapezius', 'traps-middle'],
  'Biceps': ['long-head-bicep', 'short-head-bicep'],
  'Triceps': ['medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps'],
  'Chest': ['mid-lower-pectoralis', 'upper-pectoralis'],
  'Quadriceps': ['outer-quadricep', 'rectus-femoris', 'inner-quadricep'],
  'Hamstrings': ['medial-hamstrings', 'lateral-hamstrings'],
  'Glutes': ['gluteus-maximus', 'gluteus-medius'],
  'Calves': ['gastrocnemius', 'soleus', 'tibialis'],
  'Abdominals': ['lower-abdominals', 'upper-abdominals'],
  'Forearms': ['wrist-extensors', 'wrist-flexors'],
};

/**
 * Reverse mapping from SVG ID to its muscle group name
 */
const SVG_ID_TO_GROUP: Record<string, string> = {};
for (const [group, parts] of Object.entries(MUSCLE_GROUPS)) {
  for (const part of parts) {
    SVG_ID_TO_GROUP[part] = group;
  }
}

export const buildSessionMuscleHeatmap = (
  sets: WorkoutSet[],
  exerciseMuscleData: Map<string, ExerciseMuscleData>
): { volumes: Map<string, number>; maxVolume: number } => {
  // Track volumes at the MUSCLE GROUP level to match exercise-level behavior.
  // This ensures that if Lever Seated Shoulder Press shows "3 sets" for Shoulders,
  // and Lever Lateral Raise shows "3 sets" for Shoulders, the session total
  // correctly shows "6 sets" for Shoulders.
  const groupVolumes = new Map<string, { primary: number; secondary: number }>();
  
  // For muscles that don't belong to any group (e.g., lats, lowerback)
  const standaloneVolumes = new Map<string, number>();

  for (const set of sets) {
    if (!set.exercise_title) continue;
    if (isWarmupSet(set)) continue;
    const ex = lookupExerciseMuscleData(set.exercise_title, exerciseMuscleData);
    if (!ex) continue;

    // Parse primary and secondary muscles
    let primaries = String(ex.primary_muscle ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m && m.toLowerCase() !== 'none' && m.toLowerCase() !== 'cardio');
    
    let secondaries = String(ex.secondary_muscle || '')
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m && m.toLowerCase() !== 'none');

    // Handle case where primary is empty but secondary has muscles
    if (primaries.length === 0 && secondaries.length > 0) {
      primaries.push(secondaries[0]);
      secondaries = secondaries.slice(1);
    }

    if (primaries.length === 0) continue;

    // Handle Full Body
    if (primaries.some((p) => /^full[\s-]*body$/i.test(p))) {
      const setIncrement = isUnilateralSet(set) ? 0.5 : 1;
      for (const groupName of Object.keys(MUSCLE_GROUPS)) {
        const entry = groupVolumes.get(groupName) || { primary: 0, secondary: 0 };
        entry.primary += setIncrement;
        groupVolumes.set(groupName, entry);
      }
      continue;
    }

    const setIncrement = isUnilateralSet(set) ? 0.5 : 1;
    const secondaryIncrement = isUnilateralSet(set) ? 0.25 : 0.5;

    // Track which groups this set affects (to avoid double-counting within same set)
    const affectedGroupsPrimary = new Set<string>();
    const affectedGroupsSecondary = new Set<string>();

    // Process primary muscles
    for (const primary of primaries) {
      const primarySvgIds = getSvgIdsForCsvMuscleName(primary);
      for (const svgId of primarySvgIds) {
        const group = SVG_ID_TO_GROUP[svgId];
        if (group) {
          affectedGroupsPrimary.add(group);
        } else {
          // Standalone muscle (not part of a group)
          const current = standaloneVolumes.get(svgId) || 0;
          standaloneVolumes.set(svgId, current + setIncrement);
        }
      }
    }

    // Process secondary muscles
    for (const secondary of secondaries) {
      const secondarySvgIds = getSvgIdsForCsvMuscleName(secondary);
      for (const svgId of secondarySvgIds) {
        const group = SVG_ID_TO_GROUP[svgId];
        if (group) {
          // Only count as secondary if not already counted as primary for this set
          if (!affectedGroupsPrimary.has(group)) {
            affectedGroupsSecondary.add(group);
          }
        } else {
          // Standalone muscle - only add if not already hit as primary
          if (!standaloneVolumes.has(svgId)) {
            standaloneVolumes.set(svgId, secondaryIncrement);
          } else {
            // Already exists, add secondary contribution
            const current = standaloneVolumes.get(svgId) || 0;
            standaloneVolumes.set(svgId, current + secondaryIncrement);
          }
        }
      }
    }

    // Add increments to affected groups
    for (const group of affectedGroupsPrimary) {
      const entry = groupVolumes.get(group) || { primary: 0, secondary: 0 };
      entry.primary += setIncrement;
      groupVolumes.set(group, entry);
    }
    for (const group of affectedGroupsSecondary) {
      const entry = groupVolumes.get(group) || { primary: 0, secondary: 0 };
      entry.secondary += secondaryIncrement;
      groupVolumes.set(group, entry);
    }
  }

  // Convert group volumes to SVG ID volumes
  // Each SVG ID in a group gets the total (primary + secondary) for that group
  const volumes = new Map<string, number>();
  let maxVolume = 0;

  for (const [group, { primary, secondary }] of groupVolumes.entries()) {
    const total = primary + secondary;
    if (total <= 0) continue;
    
    const parts = MUSCLE_GROUPS[group];
    if (parts) {
      for (const svgId of parts) {
        volumes.set(svgId, total);
        if (total > maxVolume) maxVolume = total;
      }
    }
  }

  // Add standalone muscles
  for (const [svgId, vol] of standaloneVolumes.entries()) {
    volumes.set(svgId, vol);
    if (vol > maxVolume) maxVolume = vol;
  }

  return { volumes, maxVolume: Math.max(maxVolume, 1) };
};

export const buildExerciseMuscleHeatmap = (
  sets: WorkoutSet[],
  exerciseData: ExerciseMuscleData | undefined
): { volumes: Map<string, number>; maxVolume: number } => {
  // Count working sets with L/R sets as 0.5 each
  let workingSetCount = 0;
  for (const s of sets) {
    if (isWarmupSet(s)) continue;
    workingSetCount += isUnilateralSet(s) ? 0.5 : 1;
  }
  
  const base = getExerciseMuscleVolumes(exerciseData);
  const volumes = new Map<string, number>();
  let maxVolume = 0;

  if (workingSetCount <= 0 || base.volumes.size === 0) {
    return { volumes, maxVolume: 1 };
  }

  base.volumes.forEach((w, svgId) => {
    const v = w * workingSetCount;
    volumes.set(svgId, v);
    if (v > maxVolume) maxVolume = v;
  });

  return { volumes, maxVolume: Math.max(maxVolume, 1) };
};
