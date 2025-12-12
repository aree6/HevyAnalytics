/**
 * Centralized muscle mapping constants.
 * Single source of truth for all muscle-related mappings across the application.
 */

import type { NormalizedMuscleGroup } from './muscleAnalytics';

/** All interactive muscle SVG IDs in the body map (detailed muscle view) */
export const INTERACTIVE_MUSCLE_IDS = [
  'upper-trapezius',
  'gastrocnemius',
  'tibialis',
  'soleus',
  'outer-quadricep',
  'rectus-femoris',
  'inner-quadricep',
  'inner-thigh',
  'wrist-extensors',
  'wrist-flexors',
  'long-head-bicep',
  'short-head-bicep',
  'obliques',
  'lower-abdominals',
  'upper-abdominals',
  'mid-lower-pectoralis',
  'upper-pectoralis',
  'anterior-deltoid',
  'lateral-deltoid',
  'medial-hamstrings',
  'lateral-hamstrings',
  'gluteus-maximus',
  'gluteus-medius',
  'lowerback',
  'lats',
  'medial-head-triceps',
  'long-head-triceps',
  'lateral-head-triceps',
  'posterior-deltoid',
  'lower-trapezius',
  'traps-middle',
  // Group view IDs (simplified muscle groups used in group SVGs)
  'calves',
  'quads',
  'hamstrings',
  'glutes',
  'abdominals',
  'chest',
  'biceps',
  'triceps',
  'forearms',
  'front-shoulders',
  'rear-shoulders',
  'traps',
  'back',
  'hands',
] as const;

export type InteractiveMuscleId = typeof INTERACTIVE_MUSCLE_IDS[number];

/** Mapping from SVG muscle ID to normalized muscle group */
export const SVG_TO_MUSCLE_GROUP: Readonly<Record<string, NormalizedMuscleGroup>> = {
  // Detailed muscle IDs
  'mid-lower-pectoralis': 'Chest',
  'upper-pectoralis': 'Chest',
  'lats': 'Back',
  'lowerback': 'Back',
  'upper-trapezius': 'Back',
  'lower-trapezius': 'Back',
  'traps-middle': 'Back',
  'anterior-deltoid': 'Shoulders',
  'lateral-deltoid': 'Shoulders',
  'posterior-deltoid': 'Shoulders',
  'long-head-bicep': 'Arms',
  'short-head-bicep': 'Arms',
  'medial-head-triceps': 'Arms',
  'long-head-triceps': 'Arms',
  'lateral-head-triceps': 'Arms',
  'wrist-extensors': 'Arms',
  'wrist-flexors': 'Arms',
  'outer-quadricep': 'Legs',
  'rectus-femoris': 'Legs',
  'inner-quadricep': 'Legs',
  'medial-hamstrings': 'Legs',
  'lateral-hamstrings': 'Legs',
  'gluteus-maximus': 'Legs',
  'gluteus-medius': 'Legs',
  'gastrocnemius': 'Legs',
  'soleus': 'Legs',
  'tibialis': 'Legs',
  'inner-thigh': 'Legs',
  'lower-abdominals': 'Core',
  'upper-abdominals': 'Core',
  'obliques': 'Core',
  'neck': 'Other',
  // Group view IDs (simplified)
  'calves': 'Legs',
  'quads': 'Legs',
  'hamstrings': 'Legs',
  'glutes': 'Legs',
  'abdominals': 'Core',
  'chest': 'Chest',
  'biceps': 'Arms',
  'triceps': 'Arms',
  'forearms': 'Arms',
  'front-shoulders': 'Shoulders',
  'rear-shoulders': 'Shoulders',
  'traps': 'Back',
  'back': 'Back',
  'hands': 'Arms',
};

/** Mapping from muscle group to all SVG IDs in that group (includes both detailed and group view IDs) */
export const MUSCLE_GROUP_TO_SVG_IDS: Readonly<Record<NormalizedMuscleGroup, readonly string[]>> = {
  Chest: ['mid-lower-pectoralis', 'upper-pectoralis', 'chest'],
  Back: ['lats', 'lowerback', 'upper-trapezius', 'lower-trapezius', 'traps-middle', 'traps', 'back'],
  Shoulders: ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid', 'front-shoulders', 'rear-shoulders'],
  Arms: [
    'long-head-bicep',
    'short-head-bicep',
    'medial-head-triceps',
    'long-head-triceps',
    'lateral-head-triceps',
    'wrist-extensors',
    'wrist-flexors',
    'biceps',
    'triceps',
    'forearms',
    'hands',
  ],
  Legs: [
    'outer-quadricep',
    'rectus-femoris',
    'inner-quadricep',
    'medial-hamstrings',
    'lateral-hamstrings',
    'gluteus-maximus',
    'gluteus-medius',
    'gastrocnemius',
    'soleus',
    'tibialis',
    'inner-thigh',
    'calves',
    'quads',
    'hamstrings',
    'glutes',
  ],
  Core: ['lower-abdominals', 'upper-abdominals', 'obliques', 'abdominals'],
  Cardio: [],
  'Full Body': [],
  Other: ['neck'],
};

/** Ordered list of primary muscle groups for display */
export const MUSCLE_GROUP_ORDER: readonly NormalizedMuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
];

/** Full body exercise targets all these muscle groups */
export const FULL_BODY_TARGET_GROUPS: readonly string[] = [
  'Chest',
  'Shoulders',
  'Triceps',
  'Biceps',
  'Forearms',
  'Lats',
  'Upper Back',
  'Lower Back',
  'Traps',
  'Abdominals',
  'Obliques',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
];

/** Get all SVG IDs belonging to a muscle group */
export const getSvgIdsForGroup = (group: NormalizedMuscleGroup): readonly string[] => {
  return MUSCLE_GROUP_TO_SVG_IDS[group] ?? [];
};

/** Get the muscle group for an SVG ID */
export const getGroupForSvgId = (svgId: string): NormalizedMuscleGroup => {
  return SVG_TO_MUSCLE_GROUP[svgId] ?? 'Other';
};

/** Get all SVG IDs that should be highlighted when hovering a muscle in group mode */
export const getGroupHighlightIds = (svgId: string): string[] => {
  const group = SVG_TO_MUSCLE_GROUP[svgId];
  if (!group || group === 'Other') return [svgId];
  return [...(MUSCLE_GROUP_TO_SVG_IDS[group] ?? [])];
};
