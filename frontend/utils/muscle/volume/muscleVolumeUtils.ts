// Re-exports from related modules (merged from muscleVolume.ts)
export * from './muscleVolumeCalculations';

import { CSV_TO_SVG_MUSCLE_MAP, CSV_TO_SVG_MUSCLE_MAP_LOWERCASE } from '../mapping/muscleCsvMappings';
import { DETAILED_SVG_ID_TO_HEADLESS_ID, FULL_BODY_TARGET_GROUPS, HEADLESS_MUSCLE_NAMES } from '../mapping/muscleMappingConstants';
import type { ExerciseMuscleData } from '../mapping/exerciseMuscleData';

/** @deprecated Use FULL_BODY_TARGET_GROUPS from muscleMappingConstants.ts */
export const FULL_BODY_MUSCLES = FULL_BODY_TARGET_GROUPS;

// Get volume intensity color based on sets
export const getVolumeIntensity = (sets: number, maxSets: number): string => {
  if (sets === 0) return 'text-slate-600';
  const ratio = sets / Math.max(maxSets, 1);
  if (ratio >= 0.8) return 'text-red-500';
  if (ratio >= 0.6) return 'text-orange-500';
  if (ratio >= 0.4) return 'text-yellow-500';
  if (ratio >= 0.2) return 'text-emerald-500';
  return 'text-emerald-700';
};

export const getVolumeColor = (sets: number, maxSets: number): string => {
  // Zero-volume muscles should always render as pure white across all themes/views.
  if (sets === 0) return '#ffffff';

  const ratioRaw = sets / Math.max(maxSets, 1);
  const ratio = Math.max(0, Math.min(1, ratioRaw));
  const lightness = 84 - ratio * 64; // 84% → 20%

  return `hsl(var(--heatmap-hue), 75%, ${lightness}%)`;
};

// Generate muscle volumes for a specific exercise based on its primary/secondary muscles
export const getExerciseMuscleVolumes = (
  exerciseData: ExerciseMuscleData | undefined
): { volumes: Map<string, number>; maxVolume: number } => {
  const volumes = new Map<string, number>();

  if (!exerciseData) {
    return { volumes, maxVolume: 1 };
  }

  // Parse primary muscles (may be comma-separated, e.g., "biceps, brachialis")
  const primaries = String(exerciseData.primary_muscle ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m && m.toLowerCase() !== 'none');

  // Parse secondary muscles
  let secondaries = String(exerciseData.secondary_muscle ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m && m.toLowerCase() !== 'none');

  // Handle case where primary is empty but secondary has muscles
  // This is common in anatomical datasets where all muscles are listed together
  if (primaries.length === 0 && secondaries.length > 0) {
    // Use first secondary as primary, rest as secondary
    primaries.push(secondaries[0]);
    secondaries = secondaries.slice(1);
  }

  // Skip if no muscles at all
  if (primaries.length === 0) {
    return { volumes, maxVolume: 1 };
  }

  // Skip Cardio entirely
  if (primaries.some((p) => p.toLowerCase() === 'cardio')) {
    return { volumes, maxVolume: 1 };
  }

  // Handle Full Body - add 1 set to every muscle group
  if (primaries.some((p) => /^full[\s-]*body$/i.test(p))) {
    for (const muscleName of FULL_BODY_MUSCLES) {
      const svgIds = CSV_TO_SVG_MUSCLE_MAP[muscleName] || [];
      for (const svgId of svgIds) {
        volumes.set(svgId, 1);
      }
    }
    return { volumes, maxVolume: 1 };
  }

  // Primary muscles get 1
  for (const primary of primaries) {
    const primaryKey = primary.toLowerCase();
    const primarySvgIds = CSV_TO_SVG_MUSCLE_MAP_LOWERCASE[primaryKey] || [];
    for (const svgId of primarySvgIds) {
      volumes.set(svgId, 1);
    }
  }

  // Secondary muscles get 0.5
  for (const secondary of secondaries) {
    const secondarySvgIds = CSV_TO_SVG_MUSCLE_MAP_LOWERCASE[secondary.toLowerCase()] || [];
    for (const svgId of secondarySvgIds) {
      if (!volumes.has(svgId)) {
        volumes.set(svgId, 0.5);
      }
    }
  }

  // Propagate volume across muscle groups - if any part of a group is hit, all parts should light up
  // This ensures e.g. all 3 deltoid heads light up when any one is targeted
  const muscleGroups: Record<string, string[]> = {
    Shoulders: ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid'],
    Traps: ['upper-trapezius', 'lower-trapezius', 'traps-middle'],
    Biceps: ['long-head-bicep', 'short-head-bicep'],
    Triceps: ['medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps'],
    Chest: ['mid-lower-pectoralis', 'upper-pectoralis'],
    Quadriceps: ['outer-quadricep', 'rectus-femoris', 'inner-quadricep'],
    Hamstrings: ['medial-hamstrings', 'lateral-hamstrings'],
    Glutes: ['gluteus-maximus', 'gluteus-medius'],
    Calves: ['gastrocnemius', 'soleus', 'tibialis'],
    Abdominals: ['lower-abdominals', 'upper-abdominals'],
    Forearms: ['wrist-extensors', 'wrist-flexors'],
  };

  for (const groupParts of Object.values(muscleGroups)) {
    // Find max volume in this group
    let maxGroupVolume = 0;
    for (const part of groupParts) {
      const vol = volumes.get(part) || 0;
      if (vol > maxGroupVolume) maxGroupVolume = vol;
    }
    // If any part has volume, propagate to all parts
    if (maxGroupVolume > 0) {
      for (const part of groupParts) {
        if (!volumes.has(part)) {
          volumes.set(part, maxGroupVolume);
        }
      }
    }
  }

  return { volumes, maxVolume: 1 };
};

// Convert detailed muscle volumes to headless volumes.
// IMPORTANT: many upstream generators already propagate the same value across multiple
// detailed SVG parts for a single anatomical muscle (e.g. chest -> both pec heads).
// Summing would double-count and can push the value above maxVolume, producing invalid
// HSL lightness values (and visually black regions). For UI bodymaps, we want the
// per-muscle intensity, so we take the MAX across detailed parts.
export const toHeadlessVolumeMap = (volumes: Map<string, number>): Map<string, number> => {
  const headlessVolumes = new Map<string, number>();

  volumes.forEach((val, key) => {
    // If key is already a headless ID, use it directly (e.g. valid group IDs)
    // Otherwise try to map from detailed -> headless
    const headlessId = (HEADLESS_MUSCLE_NAMES as any)[key]
      ? key
      : DETAILED_SVG_ID_TO_HEADLESS_ID[key];

    if (!headlessId) return;

    const prev = headlessVolumes.get(headlessId) ?? 0;
    if (val > prev) headlessVolumes.set(headlessId, val);
  });

  return headlessVolumes;
};

// Sum-aggregation variant for cases where detailed SVG volumes represent independent
// contributions per head/part (i.e. not propagated duplicates).
export const toHeadlessVolumeMapSum = (volumes: Map<string, number>): Map<string, number> => {
  const headlessVolumes = new Map<string, number>();

  volumes.forEach((val, key) => {
    const headlessId = (HEADLESS_MUSCLE_NAMES as any)[key]
      ? key
      : DETAILED_SVG_ID_TO_HEADLESS_ID[key];

    if (!headlessId) return;

    headlessVolumes.set(headlessId, (headlessVolumes.get(headlessId) ?? 0) + val);
  });

  return headlessVolumes;
};
