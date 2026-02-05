import { WorkoutSet, AnalysisResult } from '../../../types';
import { isWarmupSet } from '../classification';
import { analyzeSameWeight } from './masterAlgorithmSameWeight';
import { analyzeWeightIncrease } from './masterAlgorithmWeightIncrease';
import { analyzeWeightDecrease } from './masterAlgorithmWeightDecrease';
import { buildExpectedRepsRange } from './masterAlgorithmExpectedReps';
import { extractSetMetrics } from './masterAlgorithmMetrics';
import { calculatePercentChange } from './masterAlgorithmMath';
import { analyzeSession } from './masterAlgorithmSession';
import { analyzeProgression } from './masterAlgorithmProgression';
import { getStatusColor, getWisdomColor } from './masterAlgorithmColors';

export { isWarmupSet } from '../classification';
export { analyzeSession } from './masterAlgorithmSession';
export { analyzeProgression } from './masterAlgorithmProgression';
export { getStatusColor, getWisdomColor } from './masterAlgorithmColors';

export const analyzeSetProgression = (sets: WorkoutSet[]): AnalysisResult[] => {
  const workingSets = sets.filter(s => !isWarmupSet(s));

  if (workingSets.length < 2) return [];

  const results: AnalysisResult[] = [];
  const priorMetrics = [extractSetMetrics(workingSets[0])];

  for (let i = 1; i < workingSets.length; i++) {
    const prev = priorMetrics[priorMetrics.length - 1];
    const curr = extractSetMetrics(workingSets[i]);
    const transition = `Set ${i} → ${i + 1}`;

    const weightChangePct = calculatePercentChange(prev.weight, curr.weight);
    const repChangePct = calculatePercentChange(prev.reps, curr.reps);

    let result: AnalysisResult;

    if (Math.abs(weightChangePct) < 1.0) {
      result = analyzeSameWeight(transition, repChangePct, prev.reps, curr.reps, i + 1);
    } else if (weightChangePct > 0) {
      const expected = buildExpectedRepsRange(priorMetrics, curr.weight, i + 1);
      result = analyzeWeightIncrease(
        transition,
        weightChangePct,
        prev.weight,
        curr.weight,
        prev.reps,
        curr.reps,
        expected
      );
    } else {
      const expected = buildExpectedRepsRange(priorMetrics, curr.weight, i + 1);
      result = analyzeWeightDecrease(
        transition,
        weightChangePct,
        prev.weight,
        curr.weight,
        prev.reps,
        curr.reps,
        expected
      );
    }

    results.push(result);
    priorMetrics.push(curr);
  }

  return results;
};
