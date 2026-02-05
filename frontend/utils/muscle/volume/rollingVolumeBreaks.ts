import { differenceInDays } from 'date-fns';
import type { DailyMuscleVolume } from './rollingVolumeTypes';
import { BREAK_THRESHOLD_DAYS } from './rollingVolumeTypes';

/**
 * Identifies training breaks in the workout history.
 * A break is defined as >7 consecutive days without any workouts.
 *
 * @param dailyVolumes - Sorted daily volumes (ascending)
 * @returns Set of date keys that fall within a break period
 */
export function identifyBreakPeriods(
  dailyVolumes: readonly DailyMuscleVolume[]
): Set<string> {
  const breakDateKeys = new Set<string>();

  if (dailyVolumes.length < 2) return breakDateKeys;

  for (let i = 1; i < dailyVolumes.length; i++) {
    const prevDay = dailyVolumes[i - 1].date;
    const currDay = dailyVolumes[i].date;
    const gapDays = differenceInDays(currDay, prevDay);

    // If gap > 7 days, mark the first workout back as "returning from break"
    // The gap period itself has no workouts, so nothing to mark there
    if (gapDays > BREAK_THRESHOLD_DAYS) {
      // Mark the current day as coming out of a break
      // Rolling calculations for this day should be treated carefully
      breakDateKeys.add(dailyVolumes[i].dateKey);
    }
  }

  return breakDateKeys;
}
