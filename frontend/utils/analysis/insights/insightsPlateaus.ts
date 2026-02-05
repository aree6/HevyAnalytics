import { ExerciseStats, WorkoutSet } from '../../../types';
import { analyzeExerciseTrendCore, summarizeExerciseHistory } from '../exerciseTrend/exerciseTrend';
import { ExerciseTrendMode, WeightUnit } from '../../storage/localStorage';
import { getPlateauAdvice } from '../../../components/exerciseView/trend/exerciseTrendUi';

export interface ExercisePlateauInfo {
  exerciseName: string;
  sessionsSinceProgress: number;
  isPlateaued: boolean;
  suggestion: string;
  lastWeight: number;
  lastReps: number;
  isBodyweightLike: boolean;
}

export interface PlateauAnalysis {
  plateauedExercises: ExercisePlateauInfo[];
  improvingExercises: string[];
  overallTrend: 'improving' | 'maintaining' | 'declining';
}

export const detectPlateaus = (
  _data: WorkoutSet[],
  exerciseStats: ExerciseStats[],
  weightUnit: WeightUnit = 'kg',
  trendMode: ExerciseTrendMode = 'reactive'
): PlateauAnalysis => {
  const plateauedExercises: ExercisePlateauInfo[] = [];
  const improvingExercises: string[] = [];

  for (const stat of exerciseStats) {
    const core = analyzeExerciseTrendCore(stat, { trendMode });

    if (core.status === 'overload') {
      improvingExercises.push(stat.name);
      continue;
    }

    if (core.status !== 'stagnant') continue;

    const sessions = summarizeExerciseHistory(stat.history);
    const currentBestMetric = core.isBodyweightLike ? sessions[0]?.maxReps ?? 0 : sessions[0]?.oneRepMax ?? 0;

    let sessionsSinceProgress = 1;
    const GAINING_PCT_THRESHOLD = 2.0;

    for (let i = 1; i < sessions.length; i++) {
      const sessionBest = core.isBodyweightLike ? sessions[i].maxReps : sessions[i].oneRepMax;
      const diffPct = currentBestMetric > 0 ? ((currentBestMetric - sessionBest) / sessionBest) * 100 : 0;

      if (diffPct > GAINING_PCT_THRESHOLD) {
        break;
      }
      sessionsSinceProgress++;
    }

    const lastHistoryEntry = stat.history[0];
    const lastWeight = lastHistoryEntry?.weight ?? 0;
    const lastReps = lastHistoryEntry?.reps ?? 0;
    const advice = getPlateauAdvice(stat.name, core, stat, weightUnit);
    plateauedExercises.push({
      exerciseName: stat.name,
      sessionsSinceProgress,
      isPlateaued: true,
      suggestion: advice.subtext,
      lastWeight,
      lastReps,
      isBodyweightLike: core.isBodyweightLike,
    });
  }

  let overallTrend: 'improving' | 'maintaining' | 'declining' = 'maintaining';
  if (improvingExercises.length > plateauedExercises.length) {
    overallTrend = 'improving';
  } else if (plateauedExercises.length > improvingExercises.length + 2) {
    overallTrend = 'declining';
  }

  return {
    plateauedExercises: plateauedExercises.sort((a, b) => b.sessionsSinceProgress - a.sessionsSinceProgress),
    improvingExercises,
    overallTrend,
  };
};
