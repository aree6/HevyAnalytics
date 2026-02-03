import { useMemo } from 'react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import type { WorkoutSet } from '../../types';
import { getIntensityEvolution } from '../../utils/analysis/analytics';
import { calculateDelta } from '../../utils/analysis/insights';
import { isWarmupSet } from '../../utils/analysis/setClassification';
import {
  formatLastRollingWindow,
  getRollingWindowDaysForMode,
  DEFAULT_CHART_MAX_POINTS,
  pickChartAggregation,
} from '../../utils/date/dateUtils';
import { computationCache } from '../../utils/storage/computationCache';
import type { TimeFilterMode } from '../../utils/storage/localStorage';
import { getWindowedWorkoutSets } from '../../utils/analysis/windowedWorkoutSets';

const safePct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

export const useDashboardIntensityEvolution = (args: {
  fullData: WorkoutSet[];
  rangeMode: TimeFilterMode;
  allAggregationMode: 'daily' | 'weekly' | 'monthly';
  effectiveNow: Date;
}): {
  intensityData: any;
  intensityInsight: any;
} => {
  const { fullData, rangeMode, allAggregationMode, effectiveNow } = args;

  const intensityData = useMemo(() => {
    const { filtered, minTs, maxTs } = getWindowedWorkoutSets(fullData, rangeMode, effectiveNow);

    const preferred: 'daily' | 'weekly' | 'monthly' =
      rangeMode === 'all' ? allAggregationMode : rangeMode === 'yearly' ? 'weekly' : 'daily';

    const mode: 'daily' | 'weekly' | 'monthly' =
      Number.isFinite(minTs) && Number.isFinite(maxTs) && maxTs > minTs
        ? pickChartAggregation({ minTs, maxTs, preferred, maxPoints: DEFAULT_CHART_MAX_POINTS })
        : preferred;

    return computationCache.getOrCompute(
      `intensityEvolution:${rangeMode}:${mode}:${effectiveNow.getTime()}`,
      fullData,
      () => getIntensityEvolution(filtered, mode as any),
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, rangeMode, allAggregationMode, effectiveNow]);

  const intensityInsight = useMemo(() => {
    return computationCache.getOrCompute(
      `intensityInsight:${rangeMode}:${effectiveNow.getTime()}`,
      fullData,
      () => {
        const now = effectiveNow;
        const days = getRollingWindowDaysForMode(rangeMode) ?? 30;
        const currStart = startOfDay(subDays(now, days - 1));
        const prevStart = startOfDay(subDays(currStart, days));
        const prevEnd = endOfDay(subDays(currStart, 1));

        const countStyles = (start: Date, end: Date) => {
          const counts = { Strength: 0, Hypertrophy: 0, Endurance: 0 };
          for (const s of fullData) {
            if (isWarmupSet(s)) continue;
            const d = s.parsedDate;
            if (!d) continue;
            if (d < start || d > end) continue;
            const reps = s.reps || 8;
            if (reps <= 5) counts.Strength += 1;
            else if (reps <= 12) counts.Hypertrophy += 1;
            else counts.Endurance += 1;
          }
          return counts;
        };

        const last = countStyles(currStart, now);
        const prev = countStyles(prevStart, prevEnd);
        const lastTotal = last.Strength + last.Hypertrophy + last.Endurance;
        const prevTotal = prev.Strength + prev.Hypertrophy + prev.Endurance;
        if (lastTotal <= 0 || prevTotal <= 0) return null;

        const shares = {
          Strength: safePct(last.Strength, lastTotal),
          Hypertrophy: safePct(last.Hypertrophy, lastTotal),
          Endurance: safePct(last.Endurance, lastTotal),
        } as const;
        const prevShares = {
          Strength: safePct(prev.Strength, prevTotal),
          Hypertrophy: safePct(prev.Hypertrophy, prevTotal),
          Endurance: safePct(prev.Endurance, prevTotal),
        } as const;

        const entries = (Object.entries(shares) as Array<[keyof typeof shares, number]>).sort((a, b) => b[1] - a[1]);
        const dominant = entries[0];
        const secondary = entries[1];

        const all = (['Hypertrophy', 'Strength', 'Endurance'] as const).map((k) => {
          const short = k === 'Hypertrophy' ? 'HYP' : k === 'Strength' ? 'STR' : 'END';
          const pct = shares[k];
          const prevPct = prevShares[k];
          const delta = calculateDelta(pct, prevPct);
          return { k, short, pct, prevPct, delta };
        });

        return {
          all,
          dominant: {
            k: dominant[0],
            pct: dominant[1],
            delta: calculateDelta(dominant[1], prevShares[dominant[0]]),
          },
          secondary: {
            k: secondary[0],
            pct: secondary[1],
          },
          period: formatLastRollingWindow(days),
        };
      },
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, effectiveNow, rangeMode]);

  return { intensityData, intensityInsight };
};
