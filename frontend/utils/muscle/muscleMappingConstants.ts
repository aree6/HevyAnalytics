/**
 * Centralized muscle mapping constants.
 * Single source of truth for all muscle-related mappings across the application.
 */

import type { NormalizedMuscleGroup } from './muscleAnalytics';

export const HEADLESS_MUSCLE_IDS = [
  'chest',
  'biceps',
  'triceps',
  'forearms',
  'shoulders',
  'traps',
  'lats',
  'lowerback',
  'abdominals',
  'obliques',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
] as const;

export type HeadlessMuscleId = typeof HEADLESS_MUSCLE_IDS[number];

export const HEADLESS_MUSCLE_NAMES: Readonly<Record<HeadlessMuscleId, string>> = {
  chest: 'Chest',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  shoulders: 'Shoulders',
  traps: 'Traps',
  lats: 'Lats',
  lowerback: 'Lower Back',
  abdominals: 'Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  adductors: 'Adductors',
};

const roundToOneDecimal = (n: number): number => Math.round(n * 10) / 10;

/** Build radar chart series from headless volume map: order by value descending (highest first), rounded values. */
export function getHeadlessRadarSeries(headlessVolumes: Map<string, number>): { subject: string; value: number }[] {
  const raw = HEADLESS_MUSCLE_IDS.map((id) => ({
    subject: HEADLESS_MUSCLE_NAMES[id],
    value: roundToOneDecimal(headlessVolumes.get(id) ?? 0),
  }));
  return [...raw].sort((a, b) => b.value - a.value);
}

export const DETAILED_SVG_ID_TO_HEADLESS_ID: Readonly<Record<string, HeadlessMuscleId>> = {
  // Chest
  'mid-lower-pectoralis': 'chest',
  'upper-pectoralis': 'chest',

  // Arms
  'long-head-bicep': 'biceps',
  'short-head-bicep': 'biceps',
  'medial-head-triceps': 'triceps',
  'long-head-triceps': 'triceps',
  'lateral-head-triceps': 'triceps',
  'wrist-extensors': 'forearms',
  'wrist-flexors': 'forearms',

  // Shoulders
  // Shoulders- unified
  'anterior-deltoid': 'shoulders',
  'lateral-deltoid': 'shoulders',
  'posterior-deltoid': 'shoulders',

  // Back
  'upper-trapezius': 'traps',
  'lower-trapezius': 'traps',
  'traps-middle': 'traps',
  lats: 'lats',
  lowerback: 'lowerback',

  // Core
  'lower-abdominals': 'abdominals',
  'upper-abdominals': 'abdominals',
  obliques: 'obliques',

  // Legs
  'outer-quadricep': 'quads',
  'rectus-femoris': 'quads',
  'inner-quadricep': 'quads',
  'medial-hamstrings': 'hamstrings',
  'lateral-hamstrings': 'hamstrings',
  'gluteus-maximus': 'glutes',
  'gluteus-medius': 'glutes',
  gastrocnemius: 'calves',
  soleus: 'calves',
  tibialis: 'calves',
  // Note: 'inner-thigh' intentionally has no headless target (not present in group SVG).
};

export const HEADLESS_ID_TO_DETAILED_SVG_IDS: Readonly<Record<HeadlessMuscleId, readonly string[]>> = {
  chest: ['mid-lower-pectoralis', 'upper-pectoralis'],
  biceps: ['long-head-bicep', 'short-head-bicep'],
  triceps: ['medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps'],
  forearms: ['wrist-extensors', 'wrist-flexors'],
  shoulders: ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid'],
  traps: ['upper-trapezius', 'lower-trapezius', 'traps-middle'],
  lats: ['lats'],
  lowerback: ['lowerback'],
  abdominals: ['lower-abdominals', 'upper-abdominals'],
  obliques: ['obliques'],
  quads: ['outer-quadricep', 'rectus-femoris', 'inner-quadricep'],
  hamstrings: ['medial-hamstrings', 'lateral-hamstrings'],
  glutes: ['gluteus-maximus', 'gluteus-medius'],
  calves: ['gastrocnemius', 'soleus', 'tibialis'],
  adductors: ['adductor-longus', 'adductor-magnus', 'gracilis'],
};

export const getHeadlessIdForDetailedSvgId = (svgId: string): HeadlessMuscleId | null => {
  return DETAILED_SVG_ID_TO_HEADLESS_ID[svgId] ?? null;
};

export const getDetailedSvgIdsForHeadlessId = (headlessId: string): readonly string[] => {
  return (HEADLESS_ID_TO_DETAILED_SVG_IDS as any)[headlessId] ?? [];
};

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
  'shoulders',
  'traps',
  'back',
  'lats',
  'lowerback',
  'obliques',
  'adductors',
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
  'shoulders': 'Shoulders',
  'rear-shoulders': 'Shoulders',
  'traps': 'Back',
  'back': 'Back',
  'hands': 'Arms',
};

/** Mapping from muscle group to all SVG IDs in that group (includes both detailed and group view IDs) */
export const MUSCLE_GROUP_TO_SVG_IDS: Readonly<Record<NormalizedMuscleGroup, readonly string[]>> = {
  Chest: ['mid-lower-pectoralis', 'upper-pectoralis', 'chest'],
  Back: ['lats', 'lowerback', 'upper-trapezius', 'lower-trapezius', 'traps-middle', 'traps', 'back'],
  Shoulders: ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid', 'shoulders'],
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

// ─────────────────────────────────────────────────────────────────────────────
// Quick Filter Categories
// Reusable mappings for PUSH/PULL/LEGS, UPPER/LOWER, ANTERIOR/POSTERIOR filters
// ─────────────────────────────────────────────────────────────────────────────

/** Quick filter category type */
export type QuickFilterCategory =
  | 'PUS' | 'PUL' | 'LEG'
  | 'UPP' | 'LOW'
  | 'ANT' | 'POS';

/** Display labels for quick filter categories */
export const QUICK_FILTER_LABELS: Readonly<Record<QuickFilterCategory, string>> = {
  PUS: 'Push',
  PUL: 'Pull',
  LEG: 'Legs',
  UPP: 'Upper',
  LOW: 'Lower',
  ANT: 'Anterior',
  POS: 'Posterior',
};

/** Quick filter category groupings for UI display */
export const QUICK_FILTER_GROUPS: readonly { label: string; filters: QuickFilterCategory[] }[] = [
  { label: 'PPL', filters: ['PUS', 'PUL', 'LEG'] },
  { label: 'UL', filters: ['UPP', 'LOW'] },
  { label: 'AP', filters: ['ANT', 'POS'] },
];

/** SVG IDs for each quick filter category (detailed muscle view) */
export const QUICK_FILTER_SVG_IDS: Readonly<Record<QuickFilterCategory, readonly string[]>> = {
  // PUSH: Chest, Front/Lateral Delts, Triceps
  PUS: [
    'mid-lower-pectoralis', 'upper-pectoralis',
    'anterior-deltoid', 'lateral-deltoid',
    'medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps',
  ],
  // PULL: Back (Lats, Traps, Lower Back), Rear Delts, Biceps, Forearms
  PUL: [
    'lats', 'lowerback',
    'upper-trapezius', 'lower-trapezius', 'traps-middle',
    'posterior-deltoid',
    'long-head-bicep', 'short-head-bicep',
    'wrist-extensors', 'wrist-flexors',
  ],
  // LEGS: Quads, Hamstrings, Glutes, Calves, Adductors
  LEG: [
    'outer-quadricep', 'rectus-femoris', 'inner-quadricep',
    'medial-hamstrings', 'lateral-hamstrings',
    'gluteus-maximus', 'gluteus-medius',
    'gastrocnemius', 'soleus', 'tibialis',
    'inner-thigh',
  ],
  // UPPER: Everything above the waist
  UPP: [
    'mid-lower-pectoralis', 'upper-pectoralis',
    'lats', 'lowerback',
    'upper-trapezius', 'lower-trapezius', 'traps-middle',
    'anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid',
    'long-head-bicep', 'short-head-bicep',
    'medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps',
    'wrist-extensors', 'wrist-flexors',
    'lower-abdominals', 'upper-abdominals', 'obliques',
  ],
  // LOWER: Legs only
  LOW: [
    'outer-quadricep', 'rectus-femoris', 'inner-quadricep',
    'medial-hamstrings', 'lateral-hamstrings',
    'gluteus-maximus', 'gluteus-medius',
    'gastrocnemius', 'soleus', 'tibialis',
    'inner-thigh',
  ],
  // ANTERIOR: Front of body - Chest, Front Delts, Biceps, Abs, Quads, Tibialis
  ANT: [
    'mid-lower-pectoralis', 'upper-pectoralis',
    'anterior-deltoid', 'lateral-deltoid',
    'long-head-bicep', 'short-head-bicep',
    'lower-abdominals', 'upper-abdominals', 'obliques',
    'outer-quadricep', 'rectus-femoris', 'inner-quadricep',
    'tibialis', 'inner-thigh',
  ],
  // POSTERIOR: Back of body - Back, Rear Delts, Triceps, Glutes, Hamstrings, Calves
  POS: [
    'lats', 'lowerback',
    'upper-trapezius', 'lower-trapezius', 'traps-middle',
    'posterior-deltoid',
    'medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps',
    'gluteus-maximus', 'gluteus-medius',
    'medial-hamstrings', 'lateral-hamstrings',
    'gastrocnemius', 'soleus',
  ],
};

/** Get SVG IDs for a quick filter category */
export const getSvgIdsForQuickFilter = (category: QuickFilterCategory): readonly string[] => {
  return QUICK_FILTER_SVG_IDS[category] ?? [];
};
