import type { WorkoutSet } from '../../../types';
import { getRollingWindowStartForMode } from '../../date/dateUtils';
import { computationCache } from '../../storage/computationCache';
import type { TimeFilterMode } from '../../storage/localStorage';

export interface WindowedWorkoutSets {
  filtered: WorkoutSet[];
  minTs: number;
  maxTs: number;
}

export const getWindowedWorkoutSets = (
  fullData: WorkoutSet[],
  rangeMode: TimeFilterMode,
  effectiveNow: Date
): WindowedWorkoutSets => {
  const cacheKey = `windowedWorkoutSets:${rangeMode}:${effectiveNow.getTime()}`;
  return computationCache.getOrCompute(
    cacheKey,
    fullData,
    () => {
      const windowStart = getRollingWindowStartForMode(rangeMode, effectiveNow);
      const hasWindow = !!windowStart;
      const filtered: WorkoutSet[] = [];
      let minTs = Number.POSITIVE_INFINITY;
      let maxTs = Number.NEGATIVE_INFINITY;

      for (const s of fullData) {
        const d = s.parsedDate;
        if (!d) continue;
        if (hasWindow && d < windowStart!) continue;
        filtered.push(s);

        const ts = d.getTime();
        if (!Number.isFinite(ts)) continue;
        if (ts < minTs) minTs = ts;
        if (ts > maxTs) maxTs = ts;
      }

      return { filtered, minTs, maxTs };
    },
    { ttl: 10 * 60 * 1000 }
  );
};
