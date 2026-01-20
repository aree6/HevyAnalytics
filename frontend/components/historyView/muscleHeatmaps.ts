import { WorkoutSet } from '../../types';
import { isWarmupSet } from '../../utils/analysis/masterAlgorithm';
import {
  CSV_TO_SVG_MUSCLE_MAP,
  ExerciseMuscleData,
  FULL_BODY_MUSCLES,
  getExerciseMuscleVolumes,
  getSvgIdsForCsvMuscleName,
  lookupExerciseMuscleData,
} from '../../utils/muscle/muscleMapping';

export const buildSessionMuscleHeatmap = (
  sets: WorkoutSet[],
  exerciseMuscleData: Map<string, ExerciseMuscleData>
): { volumes: Map<string, number>; maxVolume: number } => {
  const volumes = new Map<string, number>();
  let maxVolume = 0;

  for (const set of sets) {
    if (!set.exercise_title) continue;
    if (isWarmupSet(set)) continue;
    const ex = lookupExerciseMuscleData(set.exercise_title, exerciseMuscleData);
    if (!ex) continue;

    const primary = ex.primary_muscle;
    if (primary === 'Cardio') continue;

    if (primary === 'Full Body') {
      for (const muscleName of FULL_BODY_MUSCLES) {
        const svgIds = CSV_TO_SVG_MUSCLE_MAP[muscleName] || [];
        for (const svgId of svgIds) {
          const next = (volumes.get(svgId) || 0) + 1;
          volumes.set(svgId, next);
          if (next > maxVolume) maxVolume = next;
        }
      }
      continue;
    }

    const primarySvgIds = getSvgIdsForCsvMuscleName(primary);
    for (const svgId of primarySvgIds) {
      const next = (volumes.get(svgId) || 0) + 1;
      volumes.set(svgId, next);
      if (next > maxVolume) maxVolume = next;
    }

    const secondaries = String(ex.secondary_muscle || '')
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m && m !== 'None');

    for (const secondary of secondaries) {
      const secondarySvgIds = getSvgIdsForCsvMuscleName(secondary);
      for (const svgId of secondarySvgIds) {
        const next = (volumes.get(svgId) || 0) + 0.5;
        volumes.set(svgId, next);
        if (next > maxVolume) maxVolume = next;
      }
    }
  }

  const muscleGroups: Record<string, string[]> = {
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

  for (const groupParts of Object.values(muscleGroups)) {
    let maxGroupVolume = 0;
    for (const part of groupParts) {
      const vol = volumes.get(part) || 0;
      if (vol > maxGroupVolume) maxGroupVolume = vol;
    }
    if (maxGroupVolume > 0) {
      for (const part of groupParts) {
        if (!volumes.has(part)) {
          volumes.set(part, maxGroupVolume);
        }
      }
      if (maxGroupVolume > maxVolume) maxVolume = maxGroupVolume;
    }
  }

  return { volumes, maxVolume: Math.max(maxVolume, 1) };
};

export const buildExerciseMuscleHeatmap = (
  sets: WorkoutSet[],
  exerciseData: ExerciseMuscleData | undefined
): { volumes: Map<string, number>; maxVolume: number } => {
  const workingSetCount = sets.filter((s) => !isWarmupSet(s)).length;
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
