import { useMemo } from 'react';
import type { WorkoutSet } from '../../../types';
import { computationCache } from '../../../utils/storage/computationCache';
import { computeWeeklySetsDashboardData, type WeeklySetsWindow } from '../../../utils/muscle/analytics';
import { toHeadlessVolumeMap } from '../../../utils/muscle/mapping';
import { MUSCLE_GROUP_ORDER, SVG_TO_MUSCLE_GROUP, getHeadlessRadarSeries } from '../../../utils/muscle/mapping';
import type { NormalizedMuscleGroup } from '../../../utils/muscle/analytics';
import { resolveSelectedSubjectKeys } from '../utils/selectedSubjectKeys';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import type { QuickFilterCategory } from './useMuscleSelection';
import { muscleCacheKeys } from '../../../utils/storage/cacheKeys';

interface UseMuscleHeatmapDataParams {
  data: WorkoutSet[];
  assetsMap: Map<string, ExerciseAsset> | null;
  windowStart: Date | null;
  effectiveNow: Date;
  weeklySetsWindow: WeeklySetsWindow;
  viewMode: 'muscle' | 'group' | 'headless';
  selectedMuscle: string | null;
  activeQuickFilter: QuickFilterCategory | null;
  filterCacheKey: string;
}

export const useMuscleHeatmapData = ({
  data,
  assetsMap,
  windowStart,
  effectiveNow,
  weeklySetsWindow,
  viewMode,
  selectedMuscle,
  activeQuickFilter,
  filterCacheKey,
}: UseMuscleHeatmapDataParams) => {
  const weeklySetsDashboardMuscles = useMemo(() => {
    if (!assetsMap) return null;

    const window: WeeklySetsWindow = weeklySetsWindow === 'all' ? 'all' : weeklySetsWindow;
    const cacheKey = muscleCacheKeys.weeklySets(filterCacheKey, window, 'muscles');
    return computationCache.getOrCompute(
      cacheKey,
      data,
      () => computeWeeklySetsDashboardData(data, assetsMap, effectiveNow, window, 'muscles'),
      { ttl: 10 * 60 * 1000 }
    );
  }, [assetsMap, data, effectiveNow, weeklySetsWindow, filterCacheKey]);

  const weeklySetsDashboardGroups = useMemo(() => {
    if (!assetsMap) return null;

    const window: WeeklySetsWindow = weeklySetsWindow === 'all' ? 'all' : weeklySetsWindow;
    const cacheKey = muscleCacheKeys.weeklySets(filterCacheKey, window, 'groups');
    return computationCache.getOrCompute(
      cacheKey,
      data,
      () => computeWeeklySetsDashboardData(data, assetsMap, effectiveNow, window, 'groups'),
      { ttl: 10 * 60 * 1000 }
    );
  }, [assetsMap, data, effectiveNow, weeklySetsWindow, filterCacheKey]);

  const windowedHeatmapData = useMemo(() => {
    if (!assetsMap || !windowStart) return { volumes: new Map<string, number>(), maxVolume: 1 };

    if (viewMode === 'group') {
      return weeklySetsDashboardGroups?.heatmap ?? { volumes: new Map<string, number>(), maxVolume: 1 };
    }

    const heatmap = weeklySetsDashboardMuscles?.heatmap ?? { volumes: new Map<string, number>(), maxVolume: 1 };
    if (viewMode !== 'headless') return heatmap;

    const headlessVolumes = toHeadlessVolumeMap(heatmap.volumes);
    const headlessMaxVolume = Math.max(1, ...(Array.from(headlessVolumes.values()) as number[]));
    return { volumes: headlessVolumes, maxVolume: headlessMaxVolume };
  }, [assetsMap, windowStart, viewMode, weeklySetsDashboardGroups, weeklySetsDashboardMuscles]);

  const muscleVolumes = useMemo(() => windowedHeatmapData.volumes, [windowedHeatmapData]);
  const maxVolume = useMemo(() => Math.max(windowedHeatmapData.maxVolume, 1), [windowedHeatmapData]);

  const windowedGroupVolumes = useMemo(() => {
    const groupVolumes = new Map<NormalizedMuscleGroup, number>();
    MUSCLE_GROUP_ORDER.forEach((g) => groupVolumes.set(g, 0));

    if (!assetsMap || !windowStart) return groupVolumes;

    const weeklyRatesBySubject = weeklySetsDashboardGroups?.weeklyRatesBySubject;
    if (!weeklyRatesBySubject) return groupVolumes;

    for (const [subject, value] of weeklyRatesBySubject.entries()) {
      const group = subject as NormalizedMuscleGroup;
      if (MUSCLE_GROUP_ORDER.includes(group)) groupVolumes.set(group, value);
    }

    return groupVolumes;
  }, [assetsMap, windowStart, weeklySetsDashboardGroups]);

  const groupedBodyMapVolumes = useMemo(() => {
    const volumes = new Map<string, number>();
    Object.entries(SVG_TO_MUSCLE_GROUP).forEach(([svgId, group]) => {
      if (group !== 'Other') {
        volumes.set(svgId, windowedGroupVolumes.get(group) || 0);
      }
    });
    return volumes;
  }, [windowedGroupVolumes]);

  const maxGroupVolume = useMemo(() => {
    let max = 0;
    windowedGroupVolumes.forEach((v) => {
      if (v > max) max = v;
    });
    return Math.max(max, 1);
  }, [windowedGroupVolumes]);

  const selectedSubjectKeys = useMemo(() => {
    return resolveSelectedSubjectKeys({ viewMode, selectedMuscle, activeQuickFilter });
  }, [activeQuickFilter, selectedMuscle, viewMode]);

  const groupWeeklyRatesBySubject = useMemo(() => {
    if (!assetsMap || !windowStart) return null;
    return weeklySetsDashboardGroups?.weeklyRatesBySubject ?? null;
  }, [assetsMap, windowStart, weeklySetsDashboardGroups]);

  const headlessRatesMap = useMemo(() => {
    if (!assetsMap || !windowStart) return new Map<string, number>();
    const heatmap = weeklySetsDashboardMuscles?.heatmap;
    if (!heatmap) return new Map<string, number>();

    return toHeadlessVolumeMap(heatmap.volumes);
  }, [assetsMap, windowStart, weeklySetsDashboardMuscles]);

  const radarData = useMemo(() => getHeadlessRadarSeries(headlessRatesMap), [headlessRatesMap]);

  return {
    weeklySetsDashboardMuscles,
    weeklySetsDashboardGroups,
    windowedHeatmapData,
    muscleVolumes,
    maxVolume,
    windowedGroupVolumes,
    groupedBodyMapVolumes,
    maxGroupVolume,
    selectedSubjectKeys,
    groupWeeklyRatesBySubject,
    headlessRatesMap,
    radarData,
  };
};
