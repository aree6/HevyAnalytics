import { startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';
import type { WorkoutSet } from '../../../types';
import { formatWeekContraction, getEffectiveNowFromWorkoutData } from '../../date/dateUtils';
import { isUnilateralSet } from '../../analysis/classification';
import { CSV_TO_SVG_MUSCLE_MAP_LOWERCASE, getSvgIdsForCsvMuscleName } from '../mapping/muscleCsvMappings';
import { ALL_SVG_MUSCLES, SVG_MUSCLE_NAMES } from '../mapping/muscleSvgLabels';
import type { ExerciseMuscleData } from '../mapping/exerciseMuscleData';
import { lookupExerciseMuscleData } from '../mapping/exerciseMuscleData';
import { FULL_BODY_MUSCLES } from './muscleVolumeUtils';

export interface MuscleVolumeEntry {
  muscle: string;
  svgId: string;
  sets: number;
  exercises: Map<string, { sets: number; primarySets: number; secondarySets: number }>;
}

export interface WeeklyMuscleVolume {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  muscles: Map<string, MuscleVolumeEntry>;
  totalSets: number;
}

export const calculateMuscleVolume = async (
  data: WorkoutSet[],
  exerciseMuscleData: Map<string, ExerciseMuscleData>
): Promise<Map<string, MuscleVolumeEntry>> => {
  const muscleVolume = new Map<string, MuscleVolumeEntry>();

  // Initialize all muscles
  for (const svgId of ALL_SVG_MUSCLES) {
    muscleVolume.set(svgId, {
      muscle: SVG_MUSCLE_NAMES[svgId],
      svgId,
      sets: 0,
      exercises: new Map(),
    });
  }

  for (const set of data) {
    if (!set.exercise_title || !set.parsedDate) continue;

    // Use fuzzy lookup for better matching across different CSV sources
    const exerciseData = lookupExerciseMuscleData(set.exercise_title, exerciseMuscleData);
    if (!exerciseData) continue;

    const primaryMuscle = exerciseData.primary_muscle;
    const secondaryMuscles = String(exerciseData.secondary_muscle ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m && m.toLowerCase() !== 'none');
    const primaryKey = String(primaryMuscle ?? '').trim().toLowerCase();

    // Skip Cardio entirely
    if (primaryKey === 'cardio') continue;

    // Handle Full Body - add 1 set to every muscle group (0.5 for L/R sets)
    if (primaryKey === 'full body' || primaryKey === 'full-body') {
      // L/R sets count as 0.5 each (pair = 1 set)
      const setIncrement = isUnilateralSet(set) ? 0.5 : 1;
      for (const muscleName of FULL_BODY_MUSCLES) {
        const svgIds = getSvgIdsForCsvMuscleName(muscleName);
        if (svgIds.length === 0) continue;
        for (const svgId of svgIds) {
          const entry = muscleVolume.get(svgId);
          if (!entry) continue;
          entry.sets += setIncrement;
          const exerciseEntry = entry.exercises.get(set.exercise_title) || { sets: 0, primarySets: 0, secondarySets: 0 };
          exerciseEntry.sets += setIncrement;
          exerciseEntry.primarySets += setIncrement;
          entry.exercises.set(set.exercise_title, exerciseEntry);
        }
      }
      continue;
    }

    // Handle primary muscle (counts as 1 set, or 0.5 for L/R sets)
    // L/R sets count as 0.5 each so a L+R pair = 1 bilateral set equivalent
    const setIncrement = isUnilateralSet(set) ? 0.5 : 1;
    const primarySvgIds = CSV_TO_SVG_MUSCLE_MAP_LOWERCASE[primaryKey] ?? [];
    for (const svgId of primarySvgIds) {
      const entry = muscleVolume.get(svgId);
      if (!entry) continue;
      entry.sets += setIncrement;
      const exerciseEntry = entry.exercises.get(set.exercise_title) || { sets: 0, primarySets: 0, secondarySets: 0 };
      exerciseEntry.sets += setIncrement;
      exerciseEntry.primarySets += setIncrement;
      entry.exercises.set(set.exercise_title, exerciseEntry);
    }

    // Handle secondary muscles (each counts as 0.5 sets, or 0.25 for L/R sets)
    const secondaryIncrement = isUnilateralSet(set) ? 0.25 : 0.5;
    for (const secondaryMuscle of secondaryMuscles) {
      const secondaryKey = secondaryMuscle.toLowerCase();
      const secondarySvgIds = CSV_TO_SVG_MUSCLE_MAP_LOWERCASE[secondaryKey] ?? [];
      if (secondarySvgIds.length === 0) continue;
      for (const svgId of secondarySvgIds) {
        const entry = muscleVolume.get(svgId);
        if (!entry) continue;
        entry.sets += secondaryIncrement;
        const exerciseEntry = entry.exercises.get(set.exercise_title) || { sets: 0, primarySets: 0, secondarySets: 0 };
        exerciseEntry.sets += secondaryIncrement;
        exerciseEntry.secondarySets += secondaryIncrement;
        entry.exercises.set(set.exercise_title, exerciseEntry);
      }
    }
  }

  return muscleVolume;
};

export const computeWeeklyMuscleVolume = async (
  data: WorkoutSet[],
  exerciseMuscleData: Map<string, ExerciseMuscleData>,
  weeksBack: number = 12,
  now?: Date
): Promise<WeeklyMuscleVolume[]> => {
  const effectiveNow = now ?? getEffectiveNowFromWorkoutData(data);
  const startDate = subWeeks(startOfWeek(effectiveNow, { weekStartsOn: 1 }), weeksBack - 1);
  const endDate = endOfWeek(effectiveNow, { weekStartsOn: 1 });

  const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });

  const weeklyData: WeeklyMuscleVolume[] = [];

  for (const weekStart of weeks) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekLabel = formatWeekContraction(weekStart);

    // Filter data for this week
    const weekData = data.filter((set) => {
      if (!set.parsedDate) return false;
      return set.parsedDate >= weekStart && set.parsedDate <= weekEnd;
    });

    const muscles = await calculateMuscleVolume(weekData, exerciseMuscleData);

    let totalSets = 0;
    muscles.forEach((entry) => {
      totalSets += entry.sets;
    });

    weeklyData.push({
      weekStart,
      weekEnd,
      weekLabel,
      muscles,
      totalSets,
    });
  }

  return weeklyData;
};
