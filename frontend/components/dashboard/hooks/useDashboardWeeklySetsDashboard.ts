import { useMemo } from 'react';
import type { WorkoutSet } from '../../../types';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import {
  computeWeeklySetsDashboardData,
  type WeeklySetsGrouping,
  type WeeklySetsWindow,
} from '../../../utils/muscle/analytics';
import { computationCache } from '../../../utils/storage/computationCache';
import { dashboardCacheKeys } from '../../../utils/storage/cacheKeys';

export const useDashboardWeeklySetsDashboard = (args: {
  assetsMap: Map<string, ExerciseAsset> | null;
  fullData: WorkoutSet[];
  effectiveNow: Date;
  muscleCompQuick: WeeklySetsWindow;
  compositionGrouping: WeeklySetsGrouping;
  filterCacheKey: string;
}): {
  weeklySetsDashboard: {
    heatmap: { volumes: Map<string, number>; maxVolume: number };
    windowStart: Date | null;
  };
} => {
  const { assetsMap, fullData, effectiveNow, muscleCompQuick, compositionGrouping, filterCacheKey } = args;

  const weeklySetsDashboard = useMemo(() => {
    if (!assetsMap) {
      return {
        heatmap: { volumes: new Map<string, number>(), maxVolume: 1 },
        windowStart: null as Date | null,
      };
    }

    const cacheKey = dashboardCacheKeys.weeklySets(filterCacheKey, muscleCompQuick, compositionGrouping);
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
  }, [assetsMap, fullData, effectiveNow, muscleCompQuick, compositionGrouping, filterCacheKey]);

  return { weeklySetsDashboard };
};
