import { WorkoutSet } from '../../../types';
import { calculateEpley1RM } from './masterAlgorithmMath';
import type { SetMetrics } from './masterAlgorithmTypes';

export const extractSetMetrics = (set: WorkoutSet): SetMetrics => ({
  weight: set.weight_kg,
  reps: set.reps,
  volume: set.weight_kg * set.reps,
  oneRM: calculateEpley1RM(set.weight_kg, set.reps),
  rpe: set.rpe ?? null,
});
