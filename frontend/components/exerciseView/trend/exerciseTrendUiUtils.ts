import { ExerciseHistoryEntry } from '../../types';

export const getLatestHistoryKey = (history: ExerciseHistoryEntry[]): string => {
  let maxTs = -Infinity;
  for (const h of history) {
    const ts = h.date?.getTime?.() ?? NaN;
    if (Number.isFinite(ts) && ts > maxTs) maxTs = ts;
  }
  return Number.isFinite(maxTs) ? String(maxTs) : '0';
};
