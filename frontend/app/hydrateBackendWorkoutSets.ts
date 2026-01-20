import type { WorkoutSet } from '../types';
import { parseHevyDateString } from '../utils/date/parseHevyDateString';

export const hydrateBackendWorkoutSets = (sets: WorkoutSet[]): WorkoutSet[] => {
  return (sets ?? []).map((s) => ({
    ...s,
    parsedDate: parseHevyDateString(String(s.start_time ?? '')),
  }));
};
