import { useMemo } from 'react';
import type { WorkoutSet } from '../../types';
import type { ExerciseAsset } from '../../utils/data/exerciseAssets';
import {
  computeWeeklySetsDashboardData,
  type WeeklySetsGrouping,
  type WeeklySetsWindow,
} from '../../utils/muscle/dashboardWeeklySets';
import { computationCache } from '../../utils/storage/computationCache';

export const useDashboardWeeklySetsDashboard = (args: {
  assetsMap: Map<string, ExerciseAsset> | null;
  fullData: WorkoutSet[];
  effectiveNow: Date;
  muscleCompQuick: WeeklySetsWindow;
  compositionGrouping: WeeklySetsGrouping;
}): {
  weeklySetsDashboard: {
    heatmap: { volumes: Map<string, number>; maxVolume: number };
    windowStart: Date | null;
  };
} => {
  const { assetsMap, fullData, effectiveNow, muscleCompQuick, compositionGrouping } = args;

  const weeklySetsDashboard = useMemo(() => {
    if (!assetsMap) {
      return {
        heatmap: { volumes: new Map<string, number>(), maxVolume: 1 },
        windowStart: null as Date | null,
      };
    }

    const cacheKey = `weeklySetsDashboard:v2:${muscleCompQuick}:${compositionGrouping}`;
    return computationCache.getOrCompute(
      cacheKey,
      fullData,
      () => {
        const computed = computeWeeklySetsDashboardData(
          fullData,
          assetsMap,
          effectiveNow,
          muscleCompQuick,
          compositionGrouping
        );
        return {
          heatmap: computed.heatmap,
          windowStart: computed.windowStart,
        };
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [assetsMap, fullData, effectiveNow, muscleCompQuick, compositionGrouping]);

  return { weeklySetsDashboard };
};
