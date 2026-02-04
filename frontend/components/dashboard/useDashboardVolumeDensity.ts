import { useMemo } from 'react';
import { format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import type { DailySummary } from '../../types';
import { calculateDelta } from '../../utils/analysis/insights';
import {
  formatDayContraction,
  formatDayYearContraction,
  formatLastRollingWindow,
  formatMonthYearContraction,
  formatVsPrevRollingWindow,
  formatWeekContraction,
  getRollingWindowDaysForMode,
  getRollingWindowStartForMode,
  DEFAULT_CHART_MAX_POINTS,
  pickChartAggregation,
} from '../../utils/date/dateUtils';
import { getDisplayVolume } from '../../utils/format/volumeDisplay';
import { computationCache } from '../../utils/storage/computationCache';
import type { TimeFilterMode, WeightUnit } from '../../utils/storage/localStorage';

export const useDashboardVolumeDensity = (args: {
  dailyData: DailySummary[];
  rangeMode: TimeFilterMode;
  smartMode: 'all' | 'weekly' | 'monthly';
  weightUnit: WeightUnit;
  effectiveNow: Date;
  dashboardInsights: any;
}): {
  volumeDurationData: any;
  volumeDensityTrend: any;
} => {
  const { dailyData, rangeMode, smartMode, weightUnit, effectiveNow, dashboardInsights } = args;

  const pickAutoMode = (data: DailySummary[], preferred: 'all' | 'weekly' | 'monthly'): 'all' | 'weekly' | 'monthly' => {
    if (data.length <= 0) return preferred;

    let minTs = Number.POSITIVE_INFINITY;
    let maxTs = Number.NEGATIVE_INFINITY;
    for (const d of data) {
      const ts = d.timestamp;
      if (!Number.isFinite(ts) || ts <= 0) continue;
      if (ts < minTs) minTs = ts;
      if (ts > maxTs) maxTs = ts;
    }

    const prefAgg: 'daily' | 'weekly' | 'monthly' = preferred === 'all' ? 'daily' : preferred;
    const agg =
      Number.isFinite(minTs) && Number.isFinite(maxTs) && maxTs > minTs
        ? pickChartAggregation({ minTs, maxTs, preferred: prefAgg, maxPoints: DEFAULT_CHART_MAX_POINTS })
        : prefAgg;

    return agg === 'daily' ? 'all' : agg;
  };

  const volumeDurationData = useMemo(() => {
    const windowStartTs = getRollingWindowStartForMode(rangeMode, effectiveNow)?.getTime() ?? null;
    const source = windowStartTs ? dailyData.filter((d) => d.timestamp >= windowStartTs) : dailyData;

    const baseMode: 'all' | 'weekly' | 'monthly' =
      rangeMode === 'all'
        ? smartMode === 'all'
          ? 'all'
          : smartMode
        : rangeMode === 'yearly'
          ? 'weekly'
          : 'all';

    const mode = pickAutoMode(source, baseMode);

    return computationCache.getOrCompute(
      `volumeDurationData:${rangeMode}:${mode}:${weightUnit}:${effectiveNow.getTime()}`,
      dailyData,
      () => {
        if (mode === 'all') {
          return source.map((d) => ({
            ...d,
            dateFormatted: formatDayContraction(new Date(d.timestamp)),
            tooltipLabel: formatDayYearContraction(new Date(d.timestamp)),
            volumePerSet: d.sets > 0 ? getDisplayVolume(d.totalVolume / d.sets, weightUnit, { round: 'int' }) : 0,
          }));
        }

        if (mode === 'weekly') {
          const weeklyData: Record<string, { volSum: number; setSum: number; count: number; timestamp: number }> = {};
          source.forEach((d) => {
            const weekStart = startOfWeek(new Date(d.timestamp), { weekStartsOn: 1 });
            const weekKey = `wk-${format(weekStart, 'yyyy-MM-dd')}`;
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = { volSum: 0, setSum: 0, count: 0, timestamp: weekStart.getTime() };
            }
            weeklyData[weekKey].volSum += d.totalVolume;
            weeklyData[weekKey].setSum += d.sets;
            weeklyData[weekKey].count += 1;
          });
          return Object.values(weeklyData)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((w) => {
              const isCurrent = w.timestamp === startOfWeek(effectiveNow, { weekStartsOn: 1 }).getTime();
              const totalVol = w.volSum;
              const totalSets = w.setSum;
              const volumePerSetKg = totalSets > 0 ? totalVol / totalSets : 0;
              return {
                timestamp: w.timestamp,
                dateFormatted: formatWeekContraction(new Date(w.timestamp)),
                tooltipLabel: `${formatDayYearContraction(new Date(w.timestamp))}${isCurrent ? ' (to date)' : ''}`,
                totalVolume: getDisplayVolume(totalVol, weightUnit, { round: 'int' }),
                sets: totalSets,
                volumePerSet: getDisplayVolume(volumePerSetKg, weightUnit, { round: 'int' }),
              };
            });
        }

        {
          // Manual aggregation for monthly view
          const monthlyData: Record<string, { volSum: number; setSum: number; count: number; timestamp: number }> = {};
          source.forEach((d) => {
            const monthKey = format(new Date(d.timestamp), 'yyyy-MM');
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                volSum: 0,
                setSum: 0,
                count: 0,
                timestamp: startOfMonth(new Date(d.timestamp)).getTime(),
              };
            }
            monthlyData[monthKey].volSum += d.totalVolume;
            monthlyData[monthKey].setSum += d.sets;
            monthlyData[monthKey].count += 1;
          });
          return Object.values(monthlyData)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((m) => {
              const isCurrent = m.timestamp === startOfMonth(effectiveNow).getTime();
              const totalVol = m.volSum;
              const totalSets = m.setSum;
              return {
                timestamp: m.timestamp,
                dateFormatted: formatMonthYearContraction(new Date(m.timestamp)),
                tooltipLabel: `${formatMonthYearContraction(new Date(m.timestamp))}${isCurrent ? ' (to date)' : ''}`,
                totalVolume: getDisplayVolume(totalVol, weightUnit, { round: 'int' }),
                sets: totalSets,
                volumePerSet: totalSets > 0 ? getDisplayVolume(totalVol / totalSets, weightUnit, { round: 'int' }) : 0,
              };
            });
        }
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [dailyData, rangeMode, smartMode, weightUnit, effectiveNow]);

  const volumeDensityTrend = useMemo(() => {
    const days = getRollingWindowDaysForMode(rangeMode) ?? 30;
    const d =
      days === 7
        ? dashboardInsights?.rolling7d
        : days === 365
          ? dashboardInsights?.rolling365d
          : dashboardInsights?.rolling30d;
    if (!d) return null;
    if (!d.eligible || !d.volume || !d.sets) return null;
    const curr = d.current.totalSets > 0 ? d.current.totalVolume / d.current.totalSets : 0;
    const prev = d.previous.totalSets > 0 ? d.previous.totalVolume / d.previous.totalSets : 0;
    const delta = calculateDelta(curr, prev);
    return { label: formatLastRollingWindow(days), delta, delta4: null, meta: formatVsPrevRollingWindow(days) };
  }, [dashboardInsights, rangeMode]);

  return { volumeDurationData, volumeDensityTrend };
};
