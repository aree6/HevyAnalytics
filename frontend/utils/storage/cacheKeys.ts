/**
 * Standardized Cache Keys
 * 
 * This file defines consistent cache key patterns across the application.
 * All cache keys follow the format: {feature}:{version}:{filterKey}:{params}
 * 
 * This ensures:
 * 1. Automatic cache invalidation when filters change
 * 2. Consistent sharing between Dashboard and Muscle Analysis
 * 3. Predictable cache key structure
 */

import type { WeeklySetsWindow, WeeklySetsGrouping } from '../muscle/analytics';

const VERSION = 'v2';

/**
 * Core data aggregations (computed in useAppDerivedData)
 */
export const cacheKeys = {
  dailySummaries: (filterKey: string) => `dailySummaries:${VERSION}:${filterKey}`,
  
  exerciseStats: (filterKey: string) => `exerciseStats:${VERSION}:${filterKey}`,
};

/**
 * Dashboard-specific computations
 */
export const dashboardCacheKeys = {
  weeklySets: (filterKey: string, window: WeeklySetsWindow, grouping: WeeklySetsGrouping) =>
    `weeklySets:${VERSION}:${filterKey}:${window}:${grouping}`,
  
  muscleSeries: (filterKey: string, mode: 'groups' | 'muscles') =>
    `muscleSeries:${VERSION}:${filterKey}:${mode}`,
  
  muscleTrendInsight: (filterKey: string, grouping: string, period: string) =>
    `muscleTrendInsight:${VERSION}:${filterKey}:${grouping}:${period}`,
  
  plateauAnalysis: (filterKey: string) => `plateauAnalysis:${VERSION}:${filterKey}`,
  
  prTrend: (filterKey: string, rangeMode: string, aggregationMode: string) => 
    `prTrend:${VERSION}:${filterKey}:${rangeMode}:${aggregationMode}`,
  
  intensityEvolution: (filterKey: string, rangeMode: string, aggregationMode: string) => 
    `intensityEvolution:${VERSION}:${filterKey}:${rangeMode}:${aggregationMode}`,
  
  intensityInsight: (filterKey: string, rangeMode: string) => 
    `intensityInsight:${VERSION}:${filterKey}:${rangeMode}`,
  
  topExercisesBar: (filterKey: string, mode: string) => 
    `topExercisesBar:${VERSION}:${filterKey}:${mode}`,
  
  topExercisesInsight: (filterKey: string, mode: string, barKey: string) => 
    `topExercisesInsight:${VERSION}:${filterKey}:${mode}:${barKey}`,
  
  topExercisesOverTime: (filterKey: string, rangeMode: string, aggregationMode: string, namesKey: string) => 
    `topExercisesOverTime:${VERSION}:${filterKey}:${rangeMode}:${aggregationMode}:${namesKey}`,
  
  volumeDensity: (filterKey: string, rangeMode: string, weightUnit: string) => 
    `volumeDensity:${VERSION}:${filterKey}:${rangeMode}:${weightUnit}`,
  
  dashboardInsights: (filterKey: string) => `dashboardInsights:${VERSION}:${filterKey}`,
  
  windowedWorkoutSets: (filterKey: string, rangeMode: string) =>
    `windowedWorkoutSets:${VERSION}:${filterKey}:${rangeMode}`,
};

/**
 * Muscle Analysis computations (shares keys with Dashboard)
 */
export const muscleCacheKeys = {
  // Shares dashboardCacheKeys.weeklySets - intentional for cache sharing
  weeklySets: dashboardCacheKeys.weeklySets,
  
  muscleSeries: dashboardCacheKeys.muscleSeries,
  
  muscleTrendInsight: dashboardCacheKeys.muscleTrendInsight,
};

/**
 * Flex View computations
 */
export const flexCacheKeys = {
  streakInfo: (filterKey: string) => `streakInfo:${VERSION}:${filterKey}`,
  
  prInsights: (filterKey: string) => `prInsights:${VERSION}:${filterKey}`,
  
  flexStats: (filterKey: string) => `flexStats:${VERSION}:${filterKey}`,
  
  headlessHeatmap: (filterKey: string) => `headlessHeatmap:${VERSION}:${filterKey}`,
};

/**
 * Helper to generate a base key with filter key included
 * Use this for any custom cache keys that need filter-based invalidation
 */
export const createCacheKey = (feature: string, filterKey: string, ...params: string[]) => {
  const parts = [feature, VERSION, filterKey, ...params];
  return parts.join(':');
};
