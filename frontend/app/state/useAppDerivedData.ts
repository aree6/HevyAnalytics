import { useMemo } from 'react';
import { getDailySummaries, getExerciseStats } from '../../utils/analysis/core';
import { computationCache } from '../../utils/storage/computationCache';
import { cacheKeys } from '../../utils/storage/cacheKeys';
import { getEffectiveNowFromWorkoutData } from '../../utils/date/dateUtils';
import { getDataAgeInfo } from '../../hooks/app';
import type { WorkoutSet } from '../../types';

interface AppDerivedDataArgs {
  parsedData: WorkoutSet[];
  filteredData: WorkoutSet[];
  filterCacheKey: string;
}

export const useAppDerivedData = ({ parsedData, filteredData, filterCacheKey }: AppDerivedDataArgs) => {
  // When filter is active, use filtered data's latest date as "now"
  // Otherwise use actual current date
  const filteredEffectiveNow = useMemo(() => {
    const isFilterActive = filteredData.length !== parsedData.length || filterCacheKey !== 'all';
    if (isFilterActive) {
      return getEffectiveNowFromWorkoutData(filteredData, new Date(0));
    }
    return new Date(); // Actual current date
  }, [filteredData, parsedData, filterCacheKey]);

  // Calendar uses actual current date (or latest data date if no data)
  const calendarEffectiveNow = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
    return dataBasedNow.getTime() > 0 ? dataBasedNow : new Date();
  }, [parsedData]);

  const dataAgeInfo = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
    return getDataAgeInfo(dataBasedNow);
  }, [parsedData]);

  const dailySummaries = useMemo(() => {
    // Versioned shared key (was unversioned `dailySummaries:${filterCacheKey}`,
    // which never hit entries written under cacheKeys by prefetch/dashboard).
    const cacheKey = cacheKeys.dailySummaries(filterCacheKey);
    return computationCache.getOrCompute(cacheKey, filteredData, () => getDailySummaries(filteredData), { ttl: 10 * 60 * 1000 });
  }, [filteredData, filterCacheKey]);

  const exerciseStats = useMemo(() => {
    // Versioned shared key (was unversioned `exerciseStats:${filterCacheKey}`).
    const cacheKey = cacheKeys.exerciseStats(filterCacheKey);
    return computationCache.getOrCompute(cacheKey, filteredData, () => getExerciseStats(filteredData), { ttl: 10 * 60 * 1000 });
  }, [filteredData, filterCacheKey]);

  return {
    filteredEffectiveNow,
    calendarEffectiveNow,
    dataAgeInfo,
    dailySummaries,
    exerciseStats,
  };
};
