import type { WorkoutSet } from '../../types';

/**
 * Standard set type identifiers used throughout the application.
 * These are the normalized values stored in set_type field.
 */
export type SetTypeId = 
  | 'normal'
  | 'warmup'
  | 'left'
  | 'right'
  | 'dropset'
  | 'failure'
  | 'amrap'
  | 'restpause'
  | 'myoreps'
  | 'cluster'
  | 'giantset'
  | 'superset'
  | 'backoff'
  | 'topset'
  | 'feederset'
  | 'partial';

/**
 * Configuration for each set type including display properties.
 */
export interface SetTypeConfig {
  id: SetTypeId;
  label: string;           // Full display name
  shortLabel: string;      // Single letter or short code for compact display
  color: string;           // Tailwind color class for the indicator
  bgColor: string;         // Background color class
  borderColor: string;     // Border color class
  description: string;     // Tooltip description
  isWorkingSet: boolean;   // Whether this counts as a working set (not warmup)
}

/**
 * Complete set type configuration registry.
 * Add new set types here to support them throughout the app.
 */
export const SET_TYPE_CONFIG: Record<SetTypeId, SetTypeConfig> = {
  normal: {
    id: 'normal',
    label: 'Working Set',
    shortLabel: '',  // No indicator for normal sets - shows number
    color: 'text-white',
    bgColor: 'bg-black/50',
    borderColor: 'border-slate-700',
    description: 'Standard working set',
    isWorkingSet: true,
  },
  warmup: {
    id: 'warmup',
    label: 'Warm-up',
    shortLabel: 'W',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    description: 'Warm-up set - not counted in working set totals',
    isWorkingSet: false,
  },
  left: {
    id: 'left',
    label: 'Left Side',
    shortLabel: 'L',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/50',
    description: 'Left side unilateral set',
    isWorkingSet: true,
  },
  right: {
    id: 'right',
    label: 'Right Side',
    shortLabel: 'R',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/50',
    description: 'Right side unilateral set',
    isWorkingSet: true,
  },
  dropset: {
    id: 'dropset',
    label: 'Drop Set',
    shortLabel: 'D',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/50',
    description: 'Drop set - reduced weight continuation',
    isWorkingSet: true,
  },
  failure: {
    id: 'failure',
    label: 'Failure',
    shortLabel: 'X',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    description: 'Set taken to muscular failure',
    isWorkingSet: true,
  },
  amrap: {
    id: 'amrap',
    label: 'AMRAP',
    shortLabel: 'A',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    description: 'As Many Reps As Possible',
    isWorkingSet: true,
  },
  restpause: {
    id: 'restpause',
    label: 'Rest-Pause',
    shortLabel: 'RP',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50',
    description: 'Rest-pause technique set',
    isWorkingSet: true,
  },
  myoreps: {
    id: 'myoreps',
    label: 'Myo Reps',
    shortLabel: 'M',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    description: 'Myo reps activation set',
    isWorkingSet: true,
  },
  cluster: {
    id: 'cluster',
    label: 'Cluster',
    shortLabel: 'C',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/50',
    description: 'Cluster set with intra-set rest',
    isWorkingSet: true,
  },
  giantset: {
    id: 'giantset',
    label: 'Giant Set',
    shortLabel: 'G',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/50',
    description: 'Part of a giant set circuit',
    isWorkingSet: true,
  },
  superset: {
    id: 'superset',
    label: 'Superset',
    shortLabel: 'S',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/50',
    description: 'Part of a superset pair',
    isWorkingSet: true,
  },
  backoff: {
    id: 'backoff',
    label: 'Back-off Set',
    shortLabel: 'B',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/20',
    borderColor: 'border-lime-500/50',
    description: 'Back-off set with reduced intensity',
    isWorkingSet: true,
  },
  topset: {
    id: 'topset',
    label: 'Top Set',
    shortLabel: 'T',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    description: 'Top set - heaviest working set',
    isWorkingSet: true,
  },
  feederset: {
    id: 'feederset',
    label: 'Feeder Set',
    shortLabel: 'F',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    description: 'Feeder set for blood flow',
    isWorkingSet: true,
  },
  partial: {
    id: 'partial',
    label: 'Partial Reps',
    shortLabel: 'P',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/50',
    description: 'Partial range of motion reps',
    isWorkingSet: true,
  },
};

/**
 * Get the normalized set type ID from a raw set_type value.
 */
export const getSetTypeId = (set: Pick<WorkoutSet, 'set_type'>): SetTypeId => {
  const t = String(set.set_type ?? '').trim().toLowerCase();
  if (!t || t === 'normal' || t === 'working' || t === 'work' || t === 'regular' || t === 'standard') return 'normal';
  if (t === 'warmup' || t === 'w' || t.includes('warm')) return 'warmup';
  if (t === 'left' || t === 'l') return 'left';
  if (t === 'right' || t === 'r') return 'right';
  if (t === 'dropset' || t === 'drop' || t === 'd') return 'dropset';
  if (t === 'failure' || t === 'fail' || t === 'x') return 'failure';
  if (t === 'amrap' || t === 'a') return 'amrap';
  if (t === 'restpause' || t === 'rp' || (t.includes('rest') && t.includes('pause'))) return 'restpause';
  if (t === 'myoreps' || t === 'myo' || t === 'm') return 'myoreps';
  if (t === 'cluster' || t === 'c') return 'cluster';
  if (t === 'giantset' || t === 'giant' || t === 'g') return 'giantset';
  if (t === 'superset' || t === 'super' || t === 's') return 'superset';
  if (t === 'backoff' || t === 'back' || t === 'b' || (t.includes('back') && t.includes('off'))) return 'backoff';
  if (t === 'topset' || t === 'top' || t === 't') return 'topset';
  if (t === 'feederset' || t === 'feeder' || t === 'f') return 'feederset';
  if (t === 'partial' || t === 'p' || t.includes('partial')) return 'partial';
  return 'normal';
};

/**
 * Get the configuration for a set's type.
 */
export const getSetTypeConfig = (set: Pick<WorkoutSet, 'set_type'>): SetTypeConfig => {
  return SET_TYPE_CONFIG[getSetTypeId(set)];
};

/**
 * Check if a set is a warmup set.
 */
export const isWarmupSet = (set: Pick<WorkoutSet, 'set_type'>): boolean => {
  return getSetTypeId(set) === 'warmup';
};

/**
 * Check if a set is a working set (not warmup).
 */
export const isWorkingSet = (set: Pick<WorkoutSet, 'set_type'>): boolean => {
  return getSetTypeConfig(set).isWorkingSet;
};

/**
 * Check if a set is a unilateral (left or right) set.
 */
export const isUnilateralSet = (set: Pick<WorkoutSet, 'set_type'>): boolean => {
  const id = getSetTypeId(set);
  return id === 'left' || id === 'right';
};

/**
 * Check if a set is specifically a left-side set.
 */
export const isLeftSet = (set: Pick<WorkoutSet, 'set_type'>): boolean => {
  return getSetTypeId(set) === 'left';
};

/**
 * Check if a set is specifically a right-side set.
 */
export const isRightSet = (set: Pick<WorkoutSet, 'set_type'>): boolean => {
  return getSetTypeId(set) === 'right';
};

/**
 * Get the display label for a set (short label or set number).
 * Returns the short label (like 'W', 'L', 'R', 'P', etc.) for special sets,
 * or the working set number for normal sets.
 */
export const getSetDisplayLabel = (
  set: Pick<WorkoutSet, 'set_type'>,
  workingSetNumber: number
): string => {
  const config = getSetTypeConfig(set);
  // For normal sets, show the working set number
  if (config.id === 'normal') {
    return String(workingSetNumber);
  }
  // For special sets, show the short label
  return config.shortLabel || String(workingSetNumber);
};

/**
 * Count working sets (excludes warmup sets by default).
 * 
 * Strategy:
 * - Warmup sets don't count toward working sets
 * - Left/Right sets count as 0.5 each (a L/R pair = 1 set)
 *   This reflects that doing left arm + right arm is ONE bilateral set equivalent
 * - All other sets count as 1 set each
 */
export const countSets = (
  sets: WorkoutSet[],
  options: { excludeWarmup?: boolean; countUnilateralAsFull?: boolean } = {}
): number => {
  const { excludeWarmup = true, countUnilateralAsFull = false } = options;
  
  if (sets.length === 0) return 0;
  
  let count = 0;
  
  for (const set of sets) {
    // Skip warmup sets if requested
    if (excludeWarmup && isWarmupSet(set)) {
      continue;
    }
    
    // L/R sets count as 0.5 each (pair = 1 set) unless override requested
    if (!countUnilateralAsFull && isUnilateralSet(set)) {
      count += 0.5;
    } else {
      count++;
    }
  }
  
  return count;
};

/**
 * Get effective set count for display/analysis purposes.
 * Simply counts all working sets (warmups excluded).
 */
export const getEffectiveSetCount = (sets: WorkoutSet[]): number => {
  return countSets(sets, { excludeWarmup: true });
};
