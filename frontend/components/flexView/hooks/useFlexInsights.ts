import { useMemo } from 'react';

import type { ExerciseStats, WorkoutSet } from '../../../types';
import { calculatePRInsights, calculateStreakInfo, type PRInsights, type StreakInfo } from '../../../utils/analysis/insights';
import { getExerciseStats } from '../../../utils/analysis/core';
import { convertWeight } from '../../../utils/format/units';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { ExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import type { FlexTopPRExercise } from '../utils/flexViewTypes';

interface UseFlexInsightsArgs {
  data: WorkoutSet[];
  effectiveNow: Date;
  weightUnit: WeightUnit;
  assetLookup: ExerciseAssetLookup;
  exerciseStats?: ExerciseStats[];
}

interface UseFlexInsightsResult {
  streakInfo: StreakInfo;
  prInsights: PRInsights;
  topPRExercises: FlexTopPRExercise[];
}

export const useFlexInsights = ({
  data,
  effectiveNow,
  weightUnit,
  assetLookup,
  exerciseStats,
}: UseFlexInsightsArgs): UseFlexInsightsResult => {
  const streakInfo = useMemo(() => calculateStreakInfo(data, effectiveNow), [data, effectiveNow]);

  const prInsights = useMemo(() => calculatePRInsights(data, effectiveNow), [data, effectiveNow]);

  const topPRExercises = useMemo(() => {
    const stats = exerciseStats ?? getExerciseStats(data);
    return stats
      .filter((s) => s.prCount > 0)
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 3)
      .map((s) => {
        const asset = assetLookup.getAsset(s.name);
        return {
          name: s.name,
          weight: convertWeight(s.maxWeight, weightUnit),
          thumbnail: asset?.thumbnail,
        };
      });
  }, [data, weightUnit, assetLookup, exerciseStats]);

  return { streakInfo, prInsights, topPRExercises };
};
