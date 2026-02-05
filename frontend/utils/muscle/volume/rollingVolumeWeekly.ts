import { startOfDay, subDays } from 'date-fns';
import { roundTo } from '../../format/formatters';
import type { DailyMuscleVolume, RollingWeeklyVolume } from './rollingVolumeTypes';
import { ROLLING_WINDOW_DAYS } from './rollingVolumeTypes';

/**
 * Computes rolling 7-day volume for each training day.
 *
 * For each workout day, this sums all sets from that day and the preceding 6 days,
 * giving a true "weekly volume" snapshot that isn't affected by calendar boundaries.
 *
 * @param dailyVolumes - Sorted daily volumes (ascending)
 * @param breakDates - Set of date keys that are affected by breaks
 * @returns Array of rolling weekly volumes for each training day
 */
export function computeRollingWeeklyVolumes(
  dailyVolumes: readonly DailyMuscleVolume[],
  breakDates: Set<string>
): RollingWeeklyVolume[] {
  const rollingVolumes: RollingWeeklyVolume[] = [];
  const muscleAccum = new Map<string, number>();
  let totalSets = 0;
  let startIdx = 0;

  for (let i = 0; i < dailyVolumes.length; i++) {
    const currentDay = dailyVolumes[i];

    for (const [muscle, sets] of currentDay.muscles) {
      muscleAccum.set(muscle, (muscleAccum.get(muscle) ?? 0) + sets);
      totalSets += sets;
    }

    const windowStart = startOfDay(subDays(currentDay.date, ROLLING_WINDOW_DAYS - 1));
    while (startIdx <= i && dailyVolumes[startIdx].date < windowStart) {
      const expiredDay = dailyVolumes[startIdx];
      for (const [muscle, sets] of expiredDay.muscles) {
        const next = (muscleAccum.get(muscle) ?? 0) - sets;
        if (next <= 1e-9) muscleAccum.delete(muscle);
        else muscleAccum.set(muscle, next);
        totalSets -= sets;
      }
      startIdx += 1;
    }

    rollingVolumes.push({
      date: currentDay.date,
      dateKey: currentDay.dateKey,
      muscles: new Map(muscleAccum) as ReadonlyMap<string, number>,
      totalSets: roundTo(totalSets, 1),
      isInBreak: breakDates.has(currentDay.dateKey),
    });
  }

  return rollingVolumes;
}
