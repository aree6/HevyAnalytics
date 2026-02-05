import { useMemo } from 'react';

import type { WorkoutSet } from '../../../types';
import { isWarmupSet } from '../../../utils/analysis/masterAlgorithm';
import { getSessionKey } from '../../../utils/date/dateUtils';

export const useExerciseVolumeHistory = (data: WorkoutSet[]) => {
  return useMemo(() => {
    const exerciseHistory = new Map<string, { date: Date; volume: number; sessionKey: string }[]>();
    const sessionExercises = new Map<string, Map<string, { volume: number; date: Date }>>();

    for (const set of data) {
      if (!set.parsedDate) continue;
      if (isWarmupSet(set)) continue;
      if (!Number.isFinite(set.weight_kg) || !Number.isFinite(set.reps)) continue;
      if ((set.weight_kg || 0) <= 0 || (set.reps || 0) <= 0) continue;
      const sessionKey = getSessionKey(set);
      if (!sessionKey) continue;
      const exercise = set.exercise_title;

      if (!sessionExercises.has(sessionKey)) {
        sessionExercises.set(sessionKey, new Map());
      }
      const sessionMap = sessionExercises.get(sessionKey)!;

      if (!sessionMap.has(exercise)) {
        sessionMap.set(exercise, { volume: 0, date: set.parsedDate });
      }
      const exData = sessionMap.get(exercise)!;
      exData.volume += (set.weight_kg || 0) * (set.reps || 0);
    }

    sessionExercises.forEach((exercises, sessionKey) => {
      exercises.forEach((data, exerciseName) => {
        if (!exerciseHistory.has(exerciseName)) {
          exerciseHistory.set(exerciseName, []);
        }
        exerciseHistory.get(exerciseName)!.push({
          date: data.date,
          volume: Number(data.volume.toFixed(2)),
          sessionKey,
        });
      });
    });

    exerciseHistory.forEach((history) => {
      history.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    return exerciseHistory;
  }, [data]);
};

export const useExerciseBestHistory = (data: WorkoutSet[]) => {
  return useMemo(() => {
    const exerciseBests = new Map<string, { date: Date; weight: number; sessionKey: string; previousBest: number }[]>();

    const sortedSets = [...data]
      .filter((s) => s.parsedDate && s.weight_kg > 0 && !isWarmupSet(s))
      .map((s, i) => ({ s, i }))
      .sort((a, b) => {
        const dt = a.s.parsedDate!.getTime() - b.s.parsedDate!.getTime();
        if (dt !== 0) return dt;
        const dsi = (a.s.set_index || 0) - (b.s.set_index || 0);
        if (dsi !== 0) return dsi;
        return a.i - b.i;
      })
      .map((x) => x.s);

    const runningBest = new Map<string, number>();

    for (const set of sortedSets) {
      const exercise = set.exercise_title;
      const currentBest = runningBest.get(exercise) || 0;
      const sessionKey = getSessionKey(set);
      if (!sessionKey) continue;

      if (set.weight_kg > currentBest) {
        if (!exerciseBests.has(exercise)) {
          exerciseBests.set(exercise, []);
        }
        exerciseBests.get(exercise)!.push({
          date: set.parsedDate!,
          weight: set.weight_kg,
          sessionKey,
          previousBest: currentBest,
        });
        runningBest.set(exercise, set.weight_kg);
      }
    }

    const currentBests = new Map<string, number>();
    runningBest.forEach((best, exercise) => {
      currentBests.set(exercise, best);
    });

    return { exerciseBests, currentBests };
  }, [data]);
};

export const useExerciseVolumePrHistory = (data: WorkoutSet[]) => {
  return useMemo(() => {
    const exerciseVolumePrBests = new Map<
      string,
      {
        date: Date;
        volume: number;
        sessionKey: string;
        previousBest: number;
        weight: number;
        reps: number;
        setIndex: number;
      }[]
    >();

    const runningBest = new Map<string, number>();

    const sortedSets = [...data]
      .filter((s) => s.parsedDate && !isWarmupSet(s) && (s.weight_kg || 0) > 0 && (s.reps || 0) > 0)
      .sort((a, b) => {
        const dt = a.parsedDate!.getTime() - b.parsedDate!.getTime();
        if (dt !== 0) return dt;
        return (a.set_index || 0) - (b.set_index || 0);
      });

    for (const set of sortedSets) {
      const exercise = set.exercise_title;
      const vol = (set.weight_kg || 0) * (set.reps || 0);
      const currentBest = runningBest.get(exercise) || 0;
      if (vol <= currentBest) continue;

      if (!exerciseVolumePrBests.has(exercise)) {
        exerciseVolumePrBests.set(exercise, []);
      }

      const sessionKey = getSessionKey(set);
      if (!sessionKey) continue;
      exerciseVolumePrBests.get(exercise)!.push({
        date: set.parsedDate!,
        volume: Number(vol.toFixed(2)),
        sessionKey,
        previousBest: Number(currentBest.toFixed(2)),
        weight: set.weight_kg,
        reps: set.reps,
        setIndex: set.set_index,
      });

      runningBest.set(exercise, vol);
    }

    return { exerciseVolumePrBests };
  }, [data]);
};
