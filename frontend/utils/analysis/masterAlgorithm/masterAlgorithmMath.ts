import { roundTo } from '../../format/formatters';
import { EPLEY_FACTOR, MAX_REPS_FOR_1RM } from './masterAlgorithmConstants';

export const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val));

export const calculateEpley1RM = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  const effectiveReps = Math.min(reps, MAX_REPS_FOR_1RM);
  return Number((weight * (1 + effectiveReps / EPLEY_FACTOR)).toFixed(2));
};

export const predictReps = (oneRM: number, newWeight: number): number => {
  if (newWeight <= 0 || oneRM <= 0) return 0;
  if (newWeight >= oneRM) return 1;
  const predicted = EPLEY_FACTOR * ((oneRM / newWeight) - 1);
  return Math.max(1, roundTo(predicted, 1));
};

export const calculatePercentChange = (oldVal: number, newVal: number): number => {
  if (oldVal <= 0) return newVal > 0 ? 100 : 0;
  return Number((((newVal - oldVal) / oldVal) * 100).toFixed(1));
};

export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = clamp(p, 0, 1) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo == hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
};

export const adjustOneRMForRPE = (oneRM: number, rpe: number | null): number => {
  if (!oneRM || !Number.isFinite(oneRM)) return 0;
  if (rpe == null || !Number.isFinite(rpe)) return oneRM;
  if (rpe < 6 || rpe > 10) return oneRM;
  const boost = clamp((9 - rpe) * 0.02, 0, 0.1);
  return oneRM * (1 + boost);
};
