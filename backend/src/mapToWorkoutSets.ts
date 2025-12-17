import { format } from 'date-fns';
import type { HevyWorkout, WorkoutSetDTO } from './types';

const DATE_FORMAT_HEVY = 'd MMM yyyy, HH:mm';

const formatEpochSeconds = (epochSeconds: number | undefined): string => {
  if (!epochSeconds || !Number.isFinite(epochSeconds)) return '';
  return format(new Date(epochSeconds * 1000), DATE_FORMAT_HEVY);
};

const toNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const mapHevyWorkoutsToWorkoutSets = (workouts: HevyWorkout[]): WorkoutSetDTO[] => {
  const out: WorkoutSetDTO[] = [];

  for (const w of workouts) {
    const title = String(w.name ?? 'Workout');
    const start_time = formatEpochSeconds(w.start_time);
    const end_time = formatEpochSeconds(w.end_time);
    const description = String(w.description ?? '');

    for (const ex of w.exercises ?? []) {
      const exercise_title = String(ex.title ?? '').trim();
      const exercise_notes = String(ex.notes ?? '');
      const superset_id = String(ex.superset_id ?? '');

      for (const s of ex.sets ?? []) {
        const distanceMeters = s.distance_meters == null ? 0 : toNumber(s.distance_meters, 0);
        out.push({
          title,
          start_time,
          end_time,
          description,
          exercise_title,
          superset_id,
          exercise_notes,
          set_index: toNumber(s.index, 0),
          set_type: String(s.indicator ?? 'normal'),
          weight_kg: toNumber(s.weight_kg, 0),
          reps: toNumber(s.reps, 0),
          distance_km: distanceMeters > 0 ? distanceMeters / 1000 : 0,
          duration_seconds: toNumber(s.duration_seconds, 0),
          rpe: s.rpe == null ? null : toNumber(s.rpe, 0),
        });
      }
    }
  }

  return out;
};
