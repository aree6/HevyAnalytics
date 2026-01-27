import type { WorkoutSet } from '../../types';
import { isWarmupSet, countSets } from '../../utils/analysis/setClassification';
import { getSessionKey } from '../../utils/date/dateUtils';

export interface GroupedExercise {
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Session {
  key: string;
  date: Date | undefined;
  title: string;
  startTime: string;
  exercises: GroupedExercise[];
  totalSets: number;
  totalVolume: number;
  totalPRs: number;
}

export const buildHistorySessions = (data: WorkoutSet[]): Session[] => {
  const sessionMap = new Map<string, WorkoutSet[]>();
  data.forEach((set) => {
    const key = getSessionKey(set);
    if (!sessionMap.has(key)) sessionMap.set(key, []);
    sessionMap.get(key)!.push(set);
  });

  return Array.from(sessionMap.entries())
    .map(([key, sets]) => {
      const groupedExercises: GroupedExercise[] = [];
      const setsByExercise = new Map<string, WorkoutSet[]>();
      const exerciseOrder: string[] = [];

      let totalVolume = 0;
      let totalPRs = 0;

      sets.forEach((set) => {
        const exerciseName = set.exercise_title || 'Unknown';
        if (!setsByExercise.has(exerciseName)) {
          setsByExercise.set(exerciseName, []);
          exerciseOrder.push(exerciseName);
        }
        setsByExercise.get(exerciseName)!.push(set);

        if (!isWarmupSet(set)) {
          totalVolume += (set.weight_kg || 0) * (set.reps || 0);
          if (set.isPr) totalPRs += 1;
        }
      });

      // Count total working sets
      const totalSets = countSets(sets);

      for (const exerciseName of exerciseOrder) {
        const exerciseSets = setsByExercise.get(exerciseName) || [];
        const sortedSets = exerciseSets
          .map((s, i) => ({ s, i }))
          .sort((a, b) => (a.s.set_index || 0) - (b.s.set_index || 0) || a.i - b.i)
          .map((x) => x.s);

        groupedExercises.push({ exerciseName, sets: sortedSets });
      }

      return {
        key,
        date: sets[0]?.parsedDate,
        title: sets[0]?.title,
        startTime: sets[0]?.start_time,
        exercises: groupedExercises,
        totalSets,
        totalVolume,
        totalPRs,
      } as Session;
    })
    .filter((s) => s.totalSets > 0)
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
};
