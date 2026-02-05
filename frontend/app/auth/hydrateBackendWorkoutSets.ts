import type { WorkoutSet } from '../../types';
import { parseHevyDateString } from '../../utils/date/parseHevyDateString';

export const hydrateBackendWorkoutSets = (sets: WorkoutSet[]): WorkoutSet[] => {
  const inputLength = sets?.length ?? 0;
  const hydrated = (sets ?? []).map((s) => ({
    ...s,
    parsedDate: parseHevyDateString(String(s.start_time ?? '')),
  }));
  
  // Debug logging for empty data issues
  if (inputLength > 0 && hydrated.every(s => !s.parsedDate)) {
    console.warn('[hydrateBackendWorkoutSets] All sets have invalid parsedDate. First set start_time:', 
      sets[0]?.start_time);
  }
  
  return hydrated;
};
