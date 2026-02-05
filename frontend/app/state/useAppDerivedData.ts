import { useMemo } from 'react';
import { getDailySummaries, getExerciseStats } from '../../utils/analysis/core';
import { computationCache } from '../../utils/storage/computationCache';
import { getEffectiveNowFromWorkoutData } from '../../utils/date/dateUtils';
import { getDataAgeInfo } from '../../hooks/app';
import type { WorkoutSet } from '../../types';

interface AppDerivedDataArgs {
  parsedData: WorkoutSet[];
  filteredData: WorkoutSet[];
  filterCacheKey: string;
  dateMode: 'actual' | 'effective';
}

export const useAppDerivedData = ({ parsedData, filteredData, filterCacheKey, dateMode }: AppDerivedDataArgs) => {
  const filteredEffectiveNow = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(filteredData, new Date(0));
    return dateMode === 'actual' ? new Date() : dataBasedNow;
  }, [filteredData, dateMode]);

  const calendarEffectiveNow = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
    return dateMode === 'actual' ? new Date() : dataBasedNow;
  }, [parsedData, dateMode]);

  const dataAgeInfo = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
    return getDataAgeInfo(dataBasedNow);
  }, [parsedData]);

  const dailySummaries = useMemo(() => {
    const cacheKey = `dailySummaries:${filterCacheKey}`;
    return computationCache.getOrCompute(cacheKey, filteredData, () => getDailySummaries(filteredData), { ttl: 10 * 60 * 1000 });
  }, [filteredData, filterCacheKey]);

  const exerciseStats = useMemo(() => {
    const cacheKey = `exerciseStats:${filterCacheKey}`;
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
