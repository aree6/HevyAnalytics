import { ExerciseStats } from '../../types';

export const computeEffectiveNowFromStats = (stats: ExerciseStats[]): Date => {
  let maxTs = -Infinity;
  for (const s of stats) {
    for (const h of s.history) {
      const d = h.date;
      if (!d) continue;

      const ts = d.getTime();
      if (!Number.isFinite(ts) || ts <= 0) continue;

      const y = d.getFullYear();
      if (y <= 1970 || y >= 2100) continue;

      if (ts > maxTs) maxTs = ts;
    }
  }

  return Number.isFinite(maxTs) ? new Date(maxTs) : new Date(0);
};

export const resolveEffectiveNow = (computedEffectiveNow: Date, now?: Date): Date => {
  if (now) {
    const ts = now.getTime();
    const y = now.getFullYear();
    if (Number.isFinite(ts) && ts > 0 && y > 1970 && y < 2100) return now;
  }

  return computedEffectiveNow;
};
