import type { SessionAnalysis, WorkoutSet } from '../../../types';
import { isWarmupSet } from '../classification';

type GoalLabel = 'Strength' | 'Hypertrophy' | 'Endurance' | 'Mixed' | 'N/A';

interface GoalConfig {
  label: GoalLabel;
  tooltip: string;
}

const GOAL_CONFIGS: Record<GoalLabel, string> = {
  Strength: 'Average reps are low (≤5). This zone prioritizes Neural Adaptation and Max Strength.',
  Hypertrophy: 'Average reps are moderate (6-15). This is the "Golden Zone" for Muscle Growth (Hypertrophy).',
  Endurance: 'Average reps are high (>15). This zone prioritizes Metabolic Conditioning and Muscular Endurance.',
  Mixed: '',
  'N/A': '',
};

const determineGoal = (avgReps: number): GoalConfig => {
  if (avgReps <= 5) return { label: 'Strength', tooltip: GOAL_CONFIGS.Strength };
  if (avgReps <= 15) return { label: 'Hypertrophy', tooltip: GOAL_CONFIGS.Hypertrophy };
  return { label: 'Endurance', tooltip: GOAL_CONFIGS.Endurance };
};

export const analyzeSession = (sets: WorkoutSet[]): SessionAnalysis => {
  const workingSets = sets.filter(s => !isWarmupSet(s));

  if (workingSets.length === 0) {
    return { goalLabel: 'N/A', avgReps: 0, setCount: 0 };
  }

  let totalReps = 0;
  for (const s of workingSets) {
    totalReps += s.reps || 0;
  }
  const avgReps = Math.round(totalReps / workingSets.length);
  const { label, tooltip } = determineGoal(avgReps);

  return { goalLabel: label, avgReps, setCount: workingSets.length, tooltip };
};
