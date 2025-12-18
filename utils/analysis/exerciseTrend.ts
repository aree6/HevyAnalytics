import { format } from 'date-fns';
import { ExerciseHistoryEntry, ExerciseStats } from '../../types';

export type ExerciseTrendStatus = 'overload' | 'stagnant' | 'regression' | 'neutral' | 'new';

export const MIN_SESSIONS_FOR_TREND = 4;

export interface ExerciseSessionEntry {
  date: Date;
  weight: number;
  reps: number;
  oneRepMax: number;
  volume: number;
  sets: number;
  totalReps: number;
  maxReps: number;
}

export interface ExerciseTrendCoreResult {
  status: ExerciseTrendStatus;
  isBodyweightLike: boolean;
  diffPct?: number;
  plateau?: {
    weight: number;
    minReps: number;
    maxReps: number;
  };
}

export const WEIGHT_STATIC_EPSILON_KG = 0.5;
const MIN_SIGNAL_REPS = 2;
const REP_STATIC_EPSILON = 1;
const TREND_PCT_THRESHOLD = 2.5;
const TREND_MIN_ABS_1RM_KG = 0.25;
const TREND_MIN_ABS_REPS = 1;

const avg = (xs: number[]): number => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const summarizeExerciseHistory = (history: ExerciseHistoryEntry[]): ExerciseSessionEntry[] => {
  const bySession = new Map<string, ExerciseSessionEntry>();

  for (const h of history) {
    const d = h.date;
    if (!d) continue;

    const ts = d.getTime();
    const key = Number.isFinite(ts) ? String(ts) : format(d, 'yyyy-MM-dd');

    let entry = bySession.get(key);
    if (!entry) {
      entry = {
        date: d,
        weight: 0,
        reps: 0,
        oneRepMax: 0,
        volume: 0,
        sets: 0,
        totalReps: 0,
        maxReps: 0,
      };
      bySession.set(key, entry);
    }

    entry.sets += 1;
    entry.volume += h.volume || 0;
    entry.totalReps += h.reps || 0;
    entry.maxReps = Math.max(entry.maxReps, h.reps || 0);

    if ((h.oneRepMax || 0) >= (entry.oneRepMax || 0)) {
      entry.oneRepMax = h.oneRepMax || 0;
      entry.weight = h.weight || 0;
      entry.reps = h.reps || 0;
    }
  }

  return Array.from(bySession.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const analyzeExerciseTrendCore = (stats: ExerciseStats): ExerciseTrendCoreResult => {
  const history = summarizeExerciseHistory(stats.history);

  // No usable history yet.
  if (history.length === 0) {
    return {
      status: 'new',
      isBodyweightLike: false,
    };
  }

  const recent = history.slice(0, Math.min(4, history.length));
  const weights = recent.map(h => h.weight);
  const reps = recent.map(h => h.maxReps);
  // Safe max for short windows.
  const maxWeightInRecent = Math.max(0, ...weights);
  const maxRepsInRecent = Math.max(0, ...reps);
  const zeroWeightSessions = weights.filter(w => w <= 0.0001).length;
  const isBodyweightLike = zeroWeightSessions >= Math.ceil(recent.length * 0.75);

  const hasMeaningfulSignal = isBodyweightLike
    ? maxRepsInRecent >= MIN_SIGNAL_REPS
    : maxWeightInRecent > 0.0001;

  if (!hasMeaningfulSignal) {
    return {
      status: 'new',
      isBodyweightLike,
    };
  }

  // Not enough history to compare windows reliably.
  if (history.length < MIN_SESSIONS_FOR_TREND) {
    return {
      status: 'new',
      isBodyweightLike,
    };
  }

  const repsMetric = isBodyweightLike
    ? recent.map(h => h.maxReps)
    : recent.map(h => h.reps || (h.weight > 0 ? h.volume / h.weight : 0));
  const maxRepsMetric = Math.max(...repsMetric);
  const minRepsMetric = Math.min(...repsMetric);

  const isWeightStatic = weights.every(w => Math.abs(w - (weights[0] ?? 0)) < WEIGHT_STATIC_EPSILON_KG);
  const isRepStatic = (maxRepsMetric - minRepsMetric) <= REP_STATIC_EPSILON;

  if (isWeightStatic && isRepStatic) {
    return {
      status: 'stagnant',
      isBodyweightLike,
      plateau: {
        weight: weights[0] ?? 0,
        minReps: minRepsMetric,
        maxReps: maxRepsMetric,
      },
    };
  }

  // Trend: compare a recent window vs a previous window (3v3 if possible, else 2v2).
  const windowSize = history.length >= 6 ? 6 : 4;
  const window = history.slice(0, windowSize);

  const metric = isBodyweightLike
    ? window.map(h => h.maxReps)
    : window.map(h => h.oneRepMax);

  const half = windowSize / 2;
  const currentMetric = avg(metric.slice(0, half));
  const previousMetric = avg(metric.slice(half));
  const diffAbs = currentMetric - previousMetric;
  const diffPct = previousMetric > 0 ? (diffAbs / previousMetric) * 100 : 0;

  if (currentMetric <= 0 || previousMetric <= 0) {
    return {
      status: 'new',
      isBodyweightLike,
    };
  }

  const meetsOverload = isBodyweightLike
    ? diffAbs >= TREND_MIN_ABS_REPS && diffPct >= TREND_PCT_THRESHOLD
    : diffAbs >= TREND_MIN_ABS_1RM_KG && diffPct >= TREND_PCT_THRESHOLD;
  const meetsRegression = isBodyweightLike
    ? diffAbs <= -TREND_MIN_ABS_REPS && diffPct <= -TREND_PCT_THRESHOLD
    : diffAbs <= -TREND_MIN_ABS_1RM_KG && diffPct <= -TREND_PCT_THRESHOLD;

  if (meetsOverload) {
    return {
      status: 'overload',
      isBodyweightLike,
      diffPct,
    };
  }

  if (meetsRegression) {
    return {
      status: 'regression',
      isBodyweightLike,
      diffPct,
    };
  }

  return {
    status: 'neutral',
    isBodyweightLike,
    diffPct,
  };
};
