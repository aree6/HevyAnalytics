import { format } from 'date-fns';
import type { ExerciseHistoryEntry, PrType } from '../../../types';
import type { ExerciseSessionEntry } from '../exerciseTrend/exerciseTrendCore';

export const summarizeExerciseHistory = (
  history: ExerciseHistoryEntry[],
  options?: { separateSides?: boolean }
): ExerciseSessionEntry[] => {
  const separateSides = options?.separateSides ?? false;
  const bySession = new Map<string, ExerciseSessionEntry>();

  for (const h of history) {
    const d = h.date;
    if (!d) continue;

    const ts = d.getTime();
    // If separating sides, include side in the key so L and R create different entries
    const baseKey = Number.isFinite(ts) ? String(ts) : format(d, 'yyyy-MM-dd');
    const key = separateSides && h.side ? `${baseKey}-${h.side}` : baseKey;

    let entry = bySession.get(key);
    if (!entry) {
      entry = {
        date: d,
        weight: 0,
        reps: 0,
        oneRepMax: 0,
        volume: 0,
        sets: 0,
        totalReps: 0,
        maxReps: 0,
        prTypes: [],
        side: separateSides ? h.side : undefined,
      };
      bySession.set(key, entry);
    }

    entry.sets += h.side ? 0.5 : 1; // L/R sets count as 0.5 each (pair = 1 set)
    entry.volume += h.volume || 0;
    entry.totalReps += h.reps || 0;
    entry.maxReps = Math.max(entry.maxReps, h.reps || 0);

    // Aggregate PR types from all sets in this session
    if (h.prTypes && h.prTypes.length > 0) {
      const currentTypes = new Set(entry.prTypes || []);
      h.prTypes.forEach((type) => currentTypes.add(type));
      entry.prTypes = Array.from(currentTypes);
    }

    if ((h.oneRepMax || 0) >= (entry.oneRepMax || 0)) {
      entry.oneRepMax = h.oneRepMax || 0;
      entry.weight = h.weight || 0;
      entry.reps = h.reps || 0;
    }
  }

  return Array.from(bySession.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
};
