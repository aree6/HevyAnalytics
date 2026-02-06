import { ExerciseStats, PrType } from '../../../types';
import {
  formatDayContraction,
  getDateKey,
  getRollingWindowStartForMode,
  DEFAULT_CHART_MAX_POINTS,
  pickChartAggregation,
  TimePeriod,
} from '../../../utils/date/dateUtils';
import { ExerciseSessionEntry } from '../../../utils/analysis/exerciseTrend';
import { convertWeight } from '../../../utils/format/units';
import { TimeFilterMode, WeightUnit } from '../../../utils/storage/localStorage';

export interface ExerciseChartDataPoint {
  timestamp: number;
  date: string;
  weight?: number;
  oneRepMax?: number;
  reps?: number;
  sets?: number;
  volume?: number;
  isPr?: boolean;
  prTypes?: PrType[];
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
  let globalMaxOneRm = -Infinity;
  let globalMaxVolume = -Infinity;
  for (const h of history) {
    if (Number.isFinite(h.weight)) globalMaxWeight = Math.max(globalMaxWeight, h.weight);
    if (Number.isFinite(h.maxReps)) globalMaxReps = Math.max(globalMaxReps, h.maxReps);
    if (Number.isFinite(h.oneRepMax)) globalMaxOneRm = Math.max(globalMaxOneRm, h.oneRepMax);
    if (Number.isFinite(h.volume)) globalMaxVolume = Math.max(globalMaxVolume, h.volume);
  }
  const eps = 1e-9;

  const windowStart = getRollingWindowStartForMode(viewMode, effectiveNow);
  const source = windowStart ? history.filter((h) => h.date >= windowStart) : history;

  let minTs = Number.POSITIVE_INFINITY;
  let maxTs = Number.NEGATIVE_INFINITY;
  for (const h of source) {
    const ts = h.date.getTime();
    if (!Number.isFinite(ts)) continue;
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  }

  const preferred: 'daily' | 'weekly' | 'monthly' =
    viewMode === 'all' ? allAggregationMode : viewMode === 'yearly' ? 'weekly' : 'daily';

  const agg: 'daily' | 'weekly' | 'monthly' =
    Number.isFinite(minTs) && Number.isFinite(maxTs) && maxTs > minTs
      ? pickChartAggregation({ minTs, maxTs, preferred, maxPoints: DEFAULT_CHART_MAX_POINTS })
      : preferred;

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
          prTypes: Set<PrType>;
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
            prTypes: new Set(),
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

        // Aggregate PR types
        if (h.prTypes) {
          h.prTypes.forEach((type) => b!.prTypes.add(type));
        }
      });

      return Array.from(buckets.values())
        .sort((a, b) => a.ts - b.ts)
        .map((b) => {
          const prTypes = Array.from(b.prTypes);
          const isPr = prTypes.length > 0;

          const point: ExerciseChartDataPoint = {
            timestamp: b.ts,
            date: b.label,
            sets: b.sets,
            isPr,
            prTypes,
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
        // Track which PR types correspond to the max values
        weightPrTypes: Set<PrType>;
        oneRmPrTypes: Set<PrType>;
      }
    >();

    source.forEach((h) => {
      const { key, timestamp, label } = getDateKey(h.date, period);
      let b = buckets.get(key);
      if (!b) {
        b = { 
          ts: timestamp, 
          label, 
          oneRmMax: 0, 
          weightMax: 0, 
          repsMax: 0, 
          sets: 0, 
          weightPrTypes: new Set(),
          oneRmPrTypes: new Set(),
        };
        buckets.set(key, b);
      }
      
      // Check BEFORE updating max values
      const isNewWeightMax = h.weight > b.weightMax;
      const isNewOneRmMax = h.oneRepMax > b.oneRmMax;
      
      // Update max values
      b.oneRmMax = Math.max(b.oneRmMax, h.oneRepMax);
      b.weightMax = Math.max(b.weightMax, h.weight);
      b.repsMax = Math.max(b.repsMax, h.maxReps);
      b.sets += h.sets;

      // Only add PR types if they correspond to the max value in this bucket
      if (h.prTypes) {
        // Weight PR: only if this session achieved the new max weight
        if (isNewWeightMax) {
          h.prTypes.forEach((type) => {
            if (type === 'weight' || type === 'volume') {
              b!.weightPrTypes.add(type);
            }
          });
        }
        
        // 1RM PR: only if this session achieved the new max 1RM
        if (isNewOneRmMax && h.prTypes.includes('oneRm')) {
          b!.oneRmPrTypes.add('oneRm');
        }
      }
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.ts - b.ts)
      .map((b) => {
        // Combine PR types from both weight and 1RM
        const allPrTypes = new Set([...b.weightPrTypes, ...b.oneRmPrTypes]);
        const prTypes = Array.from(allPrTypes);
        const isPr = prTypes.length > 0;

        return {
          timestamp: b.ts,
          date: b.label,
          oneRepMax: convertWeight(Number(b.oneRmMax.toFixed(1)), weightUnit),
          weight: convertWeight(Number(b.weightMax.toFixed(1)), weightUnit),
          reps: b.repsMax,
          sets: b.sets,
          isPr,
          prTypes,
          // Also store separately for accurate filtering
          weightPrTypes: Array.from(b.weightPrTypes),
          oneRmPrTypes: Array.from(b.oneRmPrTypes),
        };
      });
  };

  if (viewMode === 'yearly') {
    return buildBucketedSeries(agg === 'monthly' ? 'monthly' : 'weekly');
  }

  if (viewMode === 'weekly' || viewMode === 'monthly') {
    // Always bucket within the window so multiple sessions per day don't become multiple points.
    return buildBucketedSeries(agg === 'monthly' ? 'monthly' : agg === 'weekly' ? 'weekly' : 'daily');
  }

  if (viewMode === 'all') {
    return buildBucketedSeries(agg === 'monthly' ? 'monthly' : agg === 'weekly' ? 'weekly' : 'daily');
  }

  return [];
};
