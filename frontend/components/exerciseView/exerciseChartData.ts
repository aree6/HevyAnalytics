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

export interface ExerciseChartDataPoint {
  timestamp: number;
  date: string;
  weight?: number;
  oneRepMax?: number;
  reps?: number;
  sets?: number;
  volume?: number;
  isPr?: boolean;
  // For unilateral exercises - separate L/R values
  leftOneRepMax?: number;
  leftWeight?: number;
  leftReps?: number;
  rightOneRepMax?: number;
  rightWeight?: number;
  rightReps?: number;
}

export const buildExerciseChartData = (args: {
  selectedStats?: ExerciseStats;
  selectedSessions: ExerciseSessionEntry[];
  viewMode: TimeFilterMode;
  allAggregationMode: 'daily' | 'weekly' | 'monthly';
  weightUnit: WeightUnit;
  effectiveNow: Date;
  isBodyweightLike: boolean;
}): ExerciseChartDataPoint[] => {
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

  // Check if this exercise has unilateral data
  const hasUnilateralData = selectedStats.hasUnilateralData ?? false;
  const hasLeftData = selectedSessions.some((s) => s.side === 'left');
  const hasRightData = selectedSessions.some((s) => s.side === 'right');
  const showSeparateSides = hasUnilateralData && (hasLeftData || hasRightData);

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

  // For unilateral exercises, group by timestamp and merge L/R data
  const buildUnilateralData = (entries: ExerciseSessionEntry[]): ExerciseChartDataPoint[] => {
    const byTimestamp = new Map<number, ExerciseChartDataPoint>();

    for (const h of entries) {
      const ts = h.date.getTime();
      const dateStr = formatDayContraction(h.date);

      let point = byTimestamp.get(ts);
      if (!point) {
        point = {
          timestamp: ts,
          date: dateStr,
          sets: 0,
          volume: 0,
        };
        byTimestamp.set(ts, point);
      }

      point.sets = (point.sets || 0) + h.sets;
      point.volume = (point.volume || 0) + h.volume;

      if (h.side === 'left') {
        point.leftOneRepMax = convertWeight(h.oneRepMax, weightUnit);
        point.leftWeight = convertWeight(h.weight, weightUnit);
        point.leftReps = h.maxReps;
      } else if (h.side === 'right') {
        point.rightOneRepMax = convertWeight(h.oneRepMax, weightUnit);
        point.rightWeight = convertWeight(h.weight, weightUnit);
        point.rightReps = h.maxReps;
      } else {
        // Bilateral or no side specified - use as combined
        point.oneRepMax = convertWeight(h.oneRepMax, weightUnit);
        point.weight = convertWeight(h.weight, weightUnit);
        point.reps = h.maxReps;
      }

      // Calculate combined PR
      const isPr = isBodyweightLike
        ? Number.isFinite(globalMaxReps) && h.maxReps >= globalMaxReps - eps
        : Number.isFinite(globalMaxWeight) && h.weight >= globalMaxWeight - eps;
      if (isPr) point.isPr = true;
    }

    return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp);
  };

  if (viewMode === 'weekly' || viewMode === 'monthly') {
    if (showSeparateSides) {
      return buildUnilateralData(source);
    }

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

  const buildBucketedSeries = (period: TimePeriod): ExerciseChartDataPoint[] => {
    if (showSeparateSides) {
      // For unilateral, track L/R separately in buckets
      const buckets = new Map<
        string,
        {
          ts: number;
          label: string;
          leftOneRmMax: number;
          leftWeightMax: number;
          leftRepsMax: number;
          rightOneRmMax: number;
          rightWeightMax: number;
          rightRepsMax: number;
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
          b = {
            ts: timestamp,
            label,
            leftOneRmMax: 0,
            leftWeightMax: 0,
            leftRepsMax: 0,
            rightOneRmMax: 0,
            rightWeightMax: 0,
            rightRepsMax: 0,
            oneRmMax: 0,
            weightMax: 0,
            repsMax: 0,
            sets: 0,
          };
          buckets.set(key, b);
        }

        if (h.side === 'left') {
          b.leftOneRmMax = Math.max(b.leftOneRmMax, h.oneRepMax);
          b.leftWeightMax = Math.max(b.leftWeightMax, h.weight);
          b.leftRepsMax = Math.max(b.leftRepsMax, h.maxReps);
        } else if (h.side === 'right') {
          b.rightOneRmMax = Math.max(b.rightOneRmMax, h.oneRepMax);
          b.rightWeightMax = Math.max(b.rightWeightMax, h.weight);
          b.rightRepsMax = Math.max(b.rightRepsMax, h.maxReps);
        } else {
          b.oneRmMax = Math.max(b.oneRmMax, h.oneRepMax);
          b.weightMax = Math.max(b.weightMax, h.weight);
          b.repsMax = Math.max(b.repsMax, h.maxReps);
        }
        b.sets += h.sets;
      });

      return Array.from(buckets.values())
        .sort((a, b) => a.ts - b.ts)
        .map((b) => {
          const isPr = isBodyweightLike
            ? Number.isFinite(globalMaxReps) && Math.max(b.leftRepsMax, b.rightRepsMax, b.repsMax) >= globalMaxReps - eps
            : Number.isFinite(globalMaxWeight) && Math.max(b.leftWeightMax, b.rightWeightMax, b.weightMax) >= globalMaxWeight - eps;

          const point: ExerciseChartDataPoint = {
            timestamp: b.ts,
            date: b.label,
            sets: b.sets,
            isPr,
          };

          if (b.leftOneRmMax > 0) {
            point.leftOneRepMax = convertWeight(Number(b.leftOneRmMax.toFixed(1)), weightUnit);
            point.leftWeight = convertWeight(Number(b.leftWeightMax.toFixed(1)), weightUnit);
            point.leftReps = b.leftRepsMax;
          }
          if (b.rightOneRmMax > 0) {
            point.rightOneRepMax = convertWeight(Number(b.rightOneRmMax.toFixed(1)), weightUnit);
            point.rightWeight = convertWeight(Number(b.rightWeightMax.toFixed(1)), weightUnit);
            point.rightReps = b.rightRepsMax;
          }
          if (b.oneRmMax > 0) {
            point.oneRepMax = convertWeight(Number(b.oneRmMax.toFixed(1)), weightUnit);
            point.weight = convertWeight(Number(b.weightMax.toFixed(1)), weightUnit);
            point.reps = b.repsMax;
          }

          return point;
        });
    }

    // Standard bilateral bucketing
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
