import { ExerciseStats } from '../../types';
import {
  formatDayContraction,
  getDateKey,
  getRollingWindowStartForMode,
  TimePeriod,
} from '../../utils/date/dateUtils';
import { ExerciseSessionEntry } from '../../utils/analysis/exerciseTrend';
import { convertWeight } from '../../utils/format/units';
import { TimeFilterMode, WeightUnit } from '../../utils/storage/localStorage';

export const buildExerciseChartData = (args: {
  selectedStats?: ExerciseStats;
  selectedSessions: ExerciseSessionEntry[];
  viewMode: TimeFilterMode;
  allAggregationMode: 'daily' | 'weekly' | 'monthly';
  weightUnit: WeightUnit;
  effectiveNow: Date;
  isBodyweightLike: boolean;
}): any[] => {
  const {
    selectedStats,
    selectedSessions,
    viewMode,
    allAggregationMode,
    weightUnit,
    effectiveNow,
    isBodyweightLike,
  } = args;

  if (!selectedStats || selectedSessions.length === 0) return [];

  const history = [...selectedSessions].sort((a, b) => a.date.getTime() - b.date.getTime());

  let globalMaxWeight = -Infinity;
  let globalMaxReps = -Infinity;
  for (const h of history) {
    if (Number.isFinite(h.weight)) globalMaxWeight = Math.max(globalMaxWeight, h.weight);
    if (Number.isFinite(h.maxReps)) globalMaxReps = Math.max(globalMaxReps, h.maxReps);
  }
  const eps = 1e-9;

  const windowStart = getRollingWindowStartForMode(viewMode, effectiveNow);
  const source = windowStart ? history.filter((h) => h.date >= windowStart) : history;

  if (viewMode === 'weekly' || viewMode === 'monthly') {
    return source.map((h) => {
      const isPr = isBodyweightLike
        ? Number.isFinite(globalMaxReps) && h.maxReps >= globalMaxReps - eps
        : Number.isFinite(globalMaxWeight) && h.weight >= globalMaxWeight - eps;

      return {
        timestamp: h.date.getTime(),
        date: formatDayContraction(h.date),
        weight: convertWeight(h.weight, weightUnit),
        oneRepMax: convertWeight(h.oneRepMax, weightUnit),
        reps: h.maxReps,
        sets: h.sets,
        volume: h.volume,
        isPr,
      };
    });
  }

  const buildBucketedSeries = (period: TimePeriod) => {
    const buckets = new Map<
      string,
      {
        ts: number;
        label: string;
        oneRmMax: number;
        weightMax: number;
        repsMax: number;
        sets: number;
      }
    >();

    source.forEach((h) => {
      const { key, timestamp, label } = getDateKey(h.date, period);
      let b = buckets.get(key);
      if (!b) {
        b = { ts: timestamp, label, oneRmMax: 0, weightMax: 0, repsMax: 0, sets: 0 };
        buckets.set(key, b);
      }
      b.oneRmMax = Math.max(b.oneRmMax, h.oneRepMax);
      b.weightMax = Math.max(b.weightMax, h.weight);
      b.repsMax = Math.max(b.repsMax, h.maxReps);
      b.sets += h.sets;
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.ts - b.ts)
      .map((b) => {
        const isPr = isBodyweightLike
          ? Number.isFinite(globalMaxReps) && b.repsMax >= globalMaxReps - eps
          : Number.isFinite(globalMaxWeight) && b.weightMax >= globalMaxWeight - eps;

        return {
          timestamp: b.ts,
          date: b.label,
          oneRepMax: convertWeight(Number(b.oneRmMax.toFixed(1)), weightUnit),
          weight: convertWeight(Number(b.weightMax.toFixed(1)), weightUnit),
          reps: b.repsMax,
          sets: b.sets,
          isPr,
        };
      });
  };

  if (viewMode === 'yearly') {
    return buildBucketedSeries('weekly');
  }

  if (viewMode === 'all') {
    if (allAggregationMode === 'daily') {
      return buildBucketedSeries('daily');
    }

    return buildBucketedSeries(allAggregationMode === 'weekly' ? 'weekly' : 'monthly');
  }

  return [];
};
