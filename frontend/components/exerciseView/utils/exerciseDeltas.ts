import { ExerciseHistoryEntry } from '../../types';
import { summarizeExerciseHistory } from '../../utils/analysis/exerciseTrend';

export interface ExerciseDeltas {
  weightDelta: number;
  repsDelta: number;
  oneRMDelta: number;
  volumeDelta: number;
  sessionsSinceImprovement: number;
  lastSessionDate: Date | null;
  bestWeight: number;
  previousBestWeight: number;
  bestImprovement: number;
  avgWeightLast3: number;
}

export const calculateExerciseDeltas = (history: ExerciseHistoryEntry[]): ExerciseDeltas => {
  const sorted = summarizeExerciseHistory(history);

  if (sorted.length < 2) {
    return {
      weightDelta: 0,
      repsDelta: 0,
      oneRMDelta: 0,
      volumeDelta: 0,
      sessionsSinceImprovement: 0,
      lastSessionDate: sorted[0]?.date || null,
      bestWeight: sorted[0]?.weight || 0,
      previousBestWeight: 0,
      bestImprovement: 0,
      avgWeightLast3: sorted[0]?.weight || 0,
    };
  }

  const latest = sorted[0];
  const previous = sorted[1];

  const weightDelta = latest.weight - previous.weight;
  const repsDelta = latest.reps - previous.reps;
  const oneRMDelta = Number((latest.oneRepMax - previous.oneRepMax).toFixed(1));
  const volumeDelta = latest.volume - previous.volume;

  const allWeights = sorted.map(h => h.weight);
  const maxWeight = Math.max(...allWeights);

  const uniqueWeights = [...new Set(allWeights)].sort((a, b) => b - a);
  const previousBestWeight = uniqueWeights.length > 1 ? uniqueWeights[1] : uniqueWeights[0];
  const bestImprovement = Number((maxWeight - previousBestWeight).toFixed(2));

  let sessionsSinceImprovement = 0;
  for (const entry of sorted) {
    if (entry.weight >= maxWeight) break;
    sessionsSinceImprovement++;
  }

  const last3 = sorted.slice(0, 3);
  const avgWeightLast3 = last3.reduce((sum, h) => sum + h.weight, 0) / last3.length;

  return {
    weightDelta: Number(weightDelta.toFixed(2)),
    repsDelta,
    oneRMDelta: Number(oneRMDelta.toFixed(2)),
    volumeDelta: Number(volumeDelta.toFixed(2)),
    sessionsSinceImprovement,
    lastSessionDate: latest.date,
    bestWeight: Number(maxWeight.toFixed(2)),
    previousBestWeight: Number(previousBestWeight.toFixed(2)),
    bestImprovement,
    avgWeightLast3: Number(avgWeightLast3.toFixed(2)),
  };
};
