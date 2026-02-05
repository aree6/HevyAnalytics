/**
 * Maps granular SVG muscle IDs to their parent muscle group name for display.
 * When a user selects any part of a muscle group, the group name is shown.
 */
export const SVG_MUSCLE_GROUPS: Record<string, string> = {
  // Shoulders group
  'anterior-deltoid': 'Shoulders',
  'lateral-deltoid': 'Shoulders',
  'posterior-deltoid': 'Shoulders',
  // Chest group
  'mid-lower-pectoralis': 'Chest',
  'upper-pectoralis': 'Chest',
  // Biceps group
  'long-head-bicep': 'Biceps',
  'short-head-bicep': 'Biceps',
  // Triceps group
  'medial-head-triceps': 'Triceps',
  'long-head-triceps': 'Triceps',
  'lateral-head-triceps': 'Triceps',
  // Abs group
  'lower-abdominals': 'Abdominals',
  'upper-abdominals': 'Abdominals',
  // Quads group
  'outer-quadricep': 'Quadriceps',
  'rectus-femoris': 'Quadriceps',
  'inner-quadricep': 'Quadriceps',
  // Hamstrings group
  'medial-hamstrings': 'Hamstrings',
  'lateral-hamstrings': 'Hamstrings',
  // Glutes group
  'gluteus-maximus': 'Glutes',
  'gluteus-medius': 'Glutes',
  // Calves group
  'gastrocnemius': 'Calves',
  'soleus': 'Calves',
  'tibialis': 'Calves',
  // Traps group
  'upper-trapezius': 'Traps',
  'lower-trapezius': 'Traps',
  'traps-middle': 'Traps',
  // Forearms group
  'wrist-extensors': 'Forearms',
  'wrist-flexors': 'Forearms',
  // Single muscles
  'lats': 'Lats',
  'lowerback': 'Lower Back',
  'obliques': 'Obliques',
  'neck': 'Neck',
  'inner-thigh': 'Adductors',
};

/**
 * Maps SVG muscle IDs to human-readable display names.
 */
export const SVG_MUSCLE_NAMES: Record<string, string> = {
  // Calves
  'gastrocnemius': 'Calves',
  'soleus': 'Calves',
  'tibialis': 'Calves',
  // Quads
  'outer-quadricep': 'Quadriceps',
  'rectus-femoris': 'Quadriceps',
  'inner-quadricep': 'Quadriceps',
  // Abs
  'lower-abdominals': 'Abdominals',
  'upper-abdominals': 'Abdominals',
  'obliques': 'Obliques',
  // Chest
  'mid-lower-pectoralis': 'Chest',
  'upper-pectoralis': 'Chest',
  // Biceps
  'long-head-bicep': 'Biceps',
  'short-head-bicep': 'Biceps',
  // Forearms
  'wrist-extensors': 'Forearms',
  'wrist-flexors': 'Forearms',
  // Shoulders
  'anterior-deltoid': 'Shoulders',
  'lateral-deltoid': 'Shoulders',
  'posterior-deltoid': 'Shoulders',
  // Traps
  'upper-trapezius': 'Traps',
  'lower-trapezius': 'Traps',
  'traps-middle': 'Traps',
  // Back
  'lats': 'Lats',
  'lowerback': 'Lower Back',
  // Hamstrings
  'medial-hamstrings': 'Hamstrings',
  'lateral-hamstrings': 'Hamstrings',
  // Glutes
  'gluteus-maximus': 'Glutes',
  'gluteus-medius': 'Glutes',
  // Triceps
  'medial-head-triceps': 'Triceps',
  'long-head-triceps': 'Triceps',
  'lateral-head-triceps': 'Triceps',
  // Other
  'neck': 'Neck',
  'inner-thigh': 'Adductors',
};

/** All interactive SVG muscle IDs */
export const ALL_SVG_MUSCLES = Object.keys(SVG_MUSCLE_NAMES);
