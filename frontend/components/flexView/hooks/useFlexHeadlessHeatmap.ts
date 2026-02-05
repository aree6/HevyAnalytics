import { useMemo } from 'react';

import type { WorkoutSet } from '../../../types';
import { isWarmupSet } from '../../../utils/analysis/classification';
import {
  getExerciseMuscleVolumes,
  lookupExerciseMuscleData,
  toHeadlessVolumeMap,
  type ExerciseMuscleData,
} from '../../../utils/muscle/mapping';
import type { FlexHeadlessHeatmap } from '../utils/flexViewTypes';

export const useFlexHeadlessHeatmap = (
  data: WorkoutSet[],
  effectiveNow: Date,
  exerciseMuscleData: Map<string, ExerciseMuscleData>
): FlexHeadlessHeatmap =>
  useMemo(() => {
    const ytdStart = new Date(effectiveNow.getFullYear(), 0, 1);

    const detailed = new Map<string, number>();
    const exerciseCache = new Map<string, ExerciseMuscleData | undefined>();

    const getExerciseData = (title: string): ExerciseMuscleData | undefined => {
      if (!title) return undefined;
      if (exerciseCache.has(title)) return exerciseCache.get(title);
      const exData = lookupExerciseMuscleData(title, exerciseMuscleData);
      exerciseCache.set(title, exData);
      return exData;
    };
    for (const s of data) {
      if (isWarmupSet(s)) continue;
      const d = s.parsedDate;
      if (!d) continue;
      if (d < ytdStart || d > effectiveNow) continue;

      const exerciseTitle = s.exercise_title || '';
      const exData = getExerciseData(exerciseTitle);
      const { volumes } = getExerciseMuscleVolumes(exData);

      volumes.forEach((w, svgId) => {
        detailed.set(svgId, (detailed.get(svgId) || 0) + w);
      });
    }

    const headlessVolumes = toHeadlessVolumeMap(detailed);
    const maxVolume = Math.max(1, ...Array.from(headlessVolumes.values()));
    return { volumes: headlessVolumes, maxVolume };
  }, [data, effectiveNow, exerciseMuscleData]);
