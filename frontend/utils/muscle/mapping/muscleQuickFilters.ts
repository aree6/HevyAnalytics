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
