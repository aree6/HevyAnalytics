import { useMemo } from 'react';
import { getMonth } from 'date-fns';

import type { DailySummary, WorkoutSet } from '../../../types';
import { getDailySummaries } from '../../../utils/analysis/core';
import { countSets, isWarmupSet } from '../../../utils/analysis/classification';
import { getSessionKey } from '../../../utils/date/dateUtils';
import { getDisplayVolume } from '../../../utils/format/volumeDisplay';
import { normalizeMuscleGroup, type NormalizedMuscleGroup } from '../../../utils/muscle/analytics';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { ExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import type { FlexStats } from '../utils/flexViewTypes';

interface UseFlexStatsArgs {
  data: WorkoutSet[];
  weightUnit: WeightUnit;
  dailySummaries?: DailySummary[];
  assetLookup: ExerciseAssetLookup;
  effectiveNow: Date;
}

export const useFlexStats = ({
  data,
  weightUnit,
  dailySummaries,
  assetLookup,
  effectiveNow,
}: UseFlexStatsArgs): FlexStats =>
  useMemo(() => {
    let totalVolumeKg = 0;
    let totalReps = 0;
    let totalDuration = 0;
    const sessions = new Set<string>();
    const exerciseCounts = new Map<string, number>();
    const muscleGroups = new Map<NormalizedMuscleGroup, number>();

    for (const set of data) {
      if (isWarmupSet(set)) continue;
      totalVolumeKg += (set.weight_kg || 0) * (set.reps || 0);
      totalReps += set.reps || 0;

      const sessionKey = getSessionKey(set);
      if (sessionKey) sessions.add(sessionKey);

      const exerciseName = set.exercise_title || '';
      if (exerciseName) {
        exerciseCounts.set(exerciseName, (exerciseCounts.get(exerciseName) || 0) + 1);
      }

      if (set.parsedDate) {
        const asset = assetLookup.getAsset(exerciseName);
        if (asset) {
          const primaryMuscle = normalizeMuscleGroup(asset.primary_muscle);
          if (primaryMuscle !== 'Cardio') {
            if (primaryMuscle === 'Full Body') {
              const groups: NormalizedMuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
              for (const g of groups) {
                muscleGroups.set(g, (muscleGroups.get(g) || 0) + 1);
              }
            } else {
              muscleGroups.set(primaryMuscle, (muscleGroups.get(primaryMuscle) || 0) + 1);
            }
          }
          const secondary = asset.secondary_muscle;
          if (secondary && secondary !== 'None') {
            for (const s of secondary.split(',')) {
              const secGroup = normalizeMuscleGroup(s.trim());
              if (secGroup !== 'Cardio' && secGroup !== 'Other' && secGroup !== 'Full Body') {
                muscleGroups.set(secGroup, (muscleGroups.get(secGroup) || 0) + 0.5);
              }
            }
          }
        }
      }
    }

    const effectiveSummaries = dailySummaries ?? getDailySummaries(data);
    totalDuration = effectiveSummaries.reduce((sum, d) => sum + d.durationMinutes, 0);

    const topExercises = Array.from(exerciseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => {
        const asset = assetLookup.getAsset(name);
        return {
          name,
          count,
          thumbnail: asset?.thumbnail,
        };
      });

    const selectedYear = effectiveNow.getFullYear();
    const monthlyWorkoutsByYear = new Map<number, Map<number, Set<string>>>();

    for (const set of data) {
      if (isWarmupSet(set)) continue;

      const sessionKey = getSessionKey(set);
      if (sessionKey && set.parsedDate) {
        const year = set.parsedDate.getFullYear();
        const month = getMonth(set.parsedDate);

        if (!monthlyWorkoutsByYear.has(year)) {
          monthlyWorkoutsByYear.set(year, new Map());
        }
        const yearMap = monthlyWorkoutsByYear.get(year)!;

        if (!yearMap.has(month)) {
          yearMap.set(month, new Set());
        }
        yearMap.get(month)!.add(sessionKey);
      }
    }

    const currentYearMonthlyWorkouts = monthlyWorkoutsByYear.get(selectedYear) || new Map();
    const monthlyData = Array.from({ length: 12 }, (_, idx) => ({
      month: idx,
      workouts: currentYearMonthlyWorkouts.get(idx)?.size || 0,
    }));

    const muscleData = Array.from(muscleGroups.entries()).map(([group, sets]) => ({
      group,
      sets: Math.round(sets),
    }));

    return {
      totalVolume: getDisplayVolume(totalVolumeKg, weightUnit, { round: 'int' }),
      totalVolumeKg,
      totalSets: countSets(data),
      totalReps,
      totalDuration,
      totalWorkouts: sessions.size,
      topExercises,
      monthlyData,
      muscleData,
    };
  }, [data, weightUnit, dailySummaries, assetLookup, effectiveNow]);
