import type { WorkoutSet } from '../../types';
import type { ExerciseNameResolver } from '../exercise/exerciseNameResolver';
import type { WeightUnit } from '../storage/localStorage';

// ============================================================================
// TYPES
// ============================================================================

export type Row = Record<string, unknown>;

export type SemanticField =
  | 'workoutTitle'
  | 'exercise'
  | 'startTime'
  | 'endTime'
  | 'duration'
  | 'setIndex'
  | 'setType'
  | 'weight'
  | 'weightUnit'
  | 'reps'
  | 'distance'
  | 'distanceUnit'
  | 'rpe'
  | 'rir'
  | 'notes'
  | 'workoutNotes'
  | 'supersetId'
  | 'restTime';

export interface SemanticConfig {
  synonyms: readonly string[];
  priority: number;
  validate?: (values: unknown[]) => number;
}

export interface FieldMatch {
  field: SemanticField;
  confidence: number;
  originalHeader: string;
  unitHint?: string;
}

export interface ParseOptions {
  userWeightUnit: WeightUnit;
  userDistanceUnit?: 'km' | 'miles' | 'meters';
  resolver?: ExerciseNameResolver;
}

export interface ParseResult {
  sets: WorkoutSet[];
  meta: {
    confidence: number;
    fieldMappings: Record<string, string>;
    unmatchedExercises?: string[];
    fuzzyMatches?: number;
    representativeMatches?: number;
    rowCount: number;
    warnings?: string[];
  };
}

export interface TransformStats {
  unmatched: Set<string>;
  fuzzyMatches: number;
  representativeMatches: number;
}

export interface TransformContext {
  fieldMappings: Map<string, FieldMatch>;
  options: ParseOptions;
  stats: TransformStats;
}
