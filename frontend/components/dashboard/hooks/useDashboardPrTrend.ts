import { useMemo } from 'react';
import { startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import type { WorkoutSet } from '../../../types';
import { getPrsOverTime } from '../../../utils/analysis/core';
import {
  formatDayYearContraction,
  formatMonthYearContraction,
  getRollingWindowDaysForMode,
  DEFAULT_CHART_MAX_POINTS,
  pickChartAggregation,
} from '../../../utils/date/dateUtils';
import { computationCache } from '../../../utils/storage/computationCache';
import { dashboardCacheKeys } from '../../../utils/storage/cacheKeys';
import type { TimeFilterMode } from '../../../utils/storage/localStorage';
import { getWindowedWorkoutSets } from '../../../utils/analysis/classification';

export type PrsOverTimePoint = {
  count: number;
  dateFormatted: string;
  tooltipLabel?: string;
  timestamp?: number;
};

export const useDashboardPrTrend = (args: {
  fullData: WorkoutSet[];
  rangeMode: TimeFilterMode;
  allAggregationMode: 'daily' | 'weekly' | 'monthly';
  effectiveNow: Date;
  dashboardInsights: any;
  filterCacheKey: string;
}): {
  prsData: PrsOverTimePoint[];
  prTrendDelta: any;
  prTrendDelta7d: any;
} => {
  const { fullData, rangeMode, allAggregationMode, effectiveNow, dashboardInsights, filterCacheKey } = args;

  const prsData = useMemo<PrsOverTimePoint[]>(() => {
    const { filtered, minTs, maxTs } = getWindowedWorkoutSets(fullData, rangeMode, effectiveNow);

    const preferred: 'daily' | 'weekly' | 'monthly' =
      rangeMode === 'all' ? allAggregationMode : rangeMode === 'yearly' ? 'weekly' : 'daily';

    const mode =
      Number.isFinite(minTs) && Number.isFinite(maxTs) && maxTs > minTs
        ? pickChartAggregation({ minTs, maxTs, preferred, maxPoints: DEFAULT_CHART_MAX_POINTS })
        : preferred;

    const cacheKey = dashboardCacheKeys.prTrend(filterCacheKey, rangeMode, mode);
    return computationCache.getOrCompute(
      cacheKey,
      fullData,
      () => {
        const data = getPrsOverTime(filtered, mode as any) as PrsOverTimePoint[];

        // Add tooltip labels and mark the current (in-progress) bucket as "to date".
        const now = effectiveNow;
        const currentStart =
          mode === 'weekly'
            ? startOfWeek(now, { weekStartsOn: 1 })
            : mode === 'monthly'
              ? startOfMonth(now)
              : startOfDay(now);

        return data.map((p) => {
          const ts = p.timestamp ?? 0;
          const isCurrent = ts > 0 && ts === currentStart.getTime();
          const baseLabel =
            mode === 'weekly'
              ? `${formatDayYearContraction(new Date(ts))}`
              : mode === 'monthly'
                ? formatMonthYearContraction(new Date(ts))
                : formatDayYearContraction(new Date(ts));

          return {
            ...p,
            tooltipLabel: `${baseLabel}${isCurrent ? ' (to date)' : ''}`,
          };
        });
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, rangeMode, allAggregationMode, effectiveNow, filterCacheKey]);

  const prTrendDelta = useMemo(() => {
    const days = getRollingWindowDaysForMode(rangeMode) ?? 30;
    const d =
      days === 7
        ? dashboardInsights?.rolling7d
        : days === 365
          ? dashboardInsights?.rolling365d
          : dashboardInsights?.rolling30d;
    return d?.prs ? d.prs : null;
  }, [dashboardInsights, rangeMode]);

  const prTrendDelta7d = useMemo(() => {
    if (rangeMode === 'weekly') return null;
    const d = dashboardInsights?.rolling7d;
    return d?.prs ? d.prs : null;
  }, [dashboardInsights, rangeMode]);

  return { prsData, prTrendDelta, prTrendDelta7d };
};
