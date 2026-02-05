import { WorkoutSet, SetWisdom } from '../../../types';
import { pickDeterministic } from '../common/messageVariations';
import { getDemoteInconsistentMessage, getDemoteTooHeavyMessage, getPromoteMessage } from '../setCommentary/setCommentaryLibrary';
import { isWarmupSet } from '../classification';
import { DEFAULT_TARGET_REPS, MIN_HYPERTROPHY_REPS, PROMOTE_THRESHOLD } from './masterAlgorithmConstants';

export const analyzeProgression = (
  allSetsForExercise: WorkoutSet[],
  targetReps: number = DEFAULT_TARGET_REPS
): SetWisdom | null => {
  const workingSets = allSetsForExercise.filter(s => !isWarmupSet(s));

  if (workingSets.length === 0) return null;

  const exerciseName = workingSets[0]?.exercise_title || 'unknown';
  const seedBase = `progression|${exerciseName}|${workingSets.length}`;

  const reps = workingSets.map(s => s.reps).filter(r => Number.isFinite(r));
  const weights = workingSets.map(s => s.weight_kg).filter(w => Number.isFinite(w));
  
  // Guard against empty arrays after filtering
  if (reps.length === 0 || weights.length === 0) return null;
  
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  const avgReps = Math.round(reps.reduce((a, b) => a + b, 0) / reps.length);

  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const sameWeight = (maxWeight - minWeight) / maxWeight < 0.05;

  const topWeightSets = workingSets.filter(s => s.weight_kg >= maxWeight * 0.95);
  const topWeightReps = topWeightSets.map(s => s.reps);
  const topWeightMinReps = topWeightReps.length > 0 ? Math.min(...topWeightReps) : minReps;
  const topWeightAvgReps = topWeightReps.length > 0
    ? Math.round(topWeightReps.reduce((a, b) => a + b, 0) / topWeightReps.length)
    : avgReps;

  if (topWeightMinReps >= targetReps) {
    const increase = topWeightMinReps >= PROMOTE_THRESHOLD ? '5-10%' : '2.5-5%';
    return {
      type: 'promote',
      message: pickDeterministic(`${seedBase}|promote_msg`, [
        'Increase Weight',
        'Level Up',
        'Add Load',
        'Progress',
        'Next Level',
        'Increase',
        'Add Weight',
        'Step Up',
      ] as const),
      tooltip: getPromoteMessage(seedBase, { minReps: topWeightMinReps, increase }),
    };
  }

  if (topWeightReps.length > 0 && Math.max(...topWeightReps) < MIN_HYPERTROPHY_REPS) {
    return {
      type: 'demote',
      message: pickDeterministic(`${seedBase}|demote_heavy_msg`, [
        'Decrease Weight',
        'Reduce Load',
        'Deload',
        'Lighten Up',
        'Reduce',
        'Too Heavy',
        'Back Off',
      ] as const),
      tooltip: getDemoteTooHeavyMessage(seedBase, { maxReps: Math.max(...topWeightReps) }),
    };
  }

  if (topWeightReps.length >= 2 && topWeightMinReps < targetReps - 3 && Math.max(...topWeightReps) >= targetReps) {
    return {
      type: 'demote',
      message: pickDeterministic(`${seedBase}|demote_inconsistent_msg`, [
        'Inconsistent',
        'Varying',
        'Fluctuating',
        'Unstable',
        'Scattered',
        'Inconsistent Output',
        'Inconsistent Reps',
      ] as const),
      tooltip: getDemoteInconsistentMessage(seedBase, {
        minReps: topWeightMinReps,
        maxReps: Math.max(...topWeightReps),
      }),
    };
  }

  if (sameWeight && avgReps > 0 && topWeightAvgReps > 0) {
    // No change yet: keep historical behavior for now.
  }

  return null;
};
