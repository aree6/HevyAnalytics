import type { WorkoutSet } from '../../../types';
import { SET_TYPE_CONFIG, type SetTypeConfig, type SetTypeId } from '../setCommentary/setTypeConfig';

export type { SetTypeConfig, SetTypeId } from '../setCommentary/setTypeConfig';

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
