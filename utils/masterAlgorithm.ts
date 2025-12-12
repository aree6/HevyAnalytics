import { WorkoutSet, SessionAnalysis, AnalysisResult, SetWisdom, AnalysisStatus } from '../types';
import { roundTo } from './formatters';

const EPLEY_FACTOR = 30;
const DROP_THRESHOLD = 25.0;
const FATIGUE_BUFFER = 1.5;

const calculateEpley1RM = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  return weight * (1 + reps / EPLEY_FACTOR);
};

const predictReps = (oneRM: number, newWeight: number): number => {
  if (newWeight <= 0 || oneRM <= 0) return 0;
  const predicted = EPLEY_FACTOR * ((oneRM / newWeight) - 1);
  return Math.max(0, roundTo(predicted, 1));
};

const calculatePercentChange = (oldVal: number, newVal: number): number => {
  if (oldVal <= 0) return 0;
  return ((newVal - oldVal) / oldVal) * 100;
};

interface SetMetrics {
  weight: number;
  reps: number;
  volume: number;
  oneRM: number;
}

const extractSetMetrics = (set: WorkoutSet): SetMetrics => ({
  weight: set.weight_kg,
  reps: set.reps,
  volume: set.weight_kg * set.reps,
  oneRM: calculateEpley1RM(set.weight_kg, set.reps),
});

const createAnalysisResult = (
  transition: string,
  status: AnalysisStatus,
  weightChangePct: number,
  volDropPct: number,
  actualReps: number,
  expectedReps: string,
  shortMessage: string,
  tooltip: string
): AnalysisResult => ({
  transition,
  status,
  metrics: {
    weight_change_pct: weightChangePct === 0 ? '0%' : `${weightChangePct > 0 ? '+' : ''}${roundTo(weightChangePct, 1)}%`,
    vol_drop_pct: `${roundTo(volDropPct, 1)}%`,
    actual_reps: actualReps,
    expected_reps: expectedReps,
  },
  shortMessage,
  tooltip,
});

const analyzeSameWeight = (
  transition: string,
  volDropPct: number,
  reps: number
): AnalysisResult | null => {
  if (volDropPct < -5.0) {
    return createAnalysisResult(
      transition, 'success', 0, volDropPct, reps, '-',
      'Second Wind',
      `Second Wind: Performance increased by ${Math.abs(roundTo(volDropPct, 0))}% on the same weight. You likely held back on the previous set or rested longer than usual.`
    );
  }
  if (volDropPct <= DROP_THRESHOLD) {
    return createAnalysisResult(
      transition, 'info', 0, volDropPct, reps, '-',
      'Optimal Fatigue',
      `Optimal Fatigue: Volume dropped by ${roundTo(volDropPct, 0)}%. This range (0-25%) is often optimal for hypertrophy, indicating effort without metabolic collapse.`
    );
  }
  return createAnalysisResult(
    transition, 'danger', 0, volDropPct, reps, '-',
    'Significant Drop',
    `Significant Drop: Volume dropped by ${roundTo(volDropPct, 0)}%. Two likely causes:\n1. The previous set was taken to absolute failure.\n2. Your rest time was too short.\nAdvice: If you rested plenty, leave 1 rep in reserve next time. If you rushed, rest longer.`
  );
};

const analyzeWeightIncrease = (
  transition: string,
  weightChangePct: number,
  volDropPct: number,
  reps: number,
  bestOneRM: number,
  newWeight: number
): AnalysisResult => {
  const expectedRepsRaw = predictReps(bestOneRM, newWeight);
  const expectedRepsInt = Math.round(expectedRepsRaw);
  const passed = reps >= (expectedRepsRaw - FATIGUE_BUFFER);

  if (passed) {
    return createAnalysisResult(
      transition, 'success', weightChangePct, volDropPct, reps, `~${expectedRepsInt}`,
      'Good Overload',
      `Good Overload: Weight +${roundTo(weightChangePct, 0)}% and you hit ${reps} reps (Expected based on best performance: ~${expectedRepsInt}). You are getting stronger.`
    );
  }
  return createAnalysisResult(
    transition, 'warning', weightChangePct, volDropPct, reps, `~${expectedRepsInt}`,
    'Premature Jump',
    `Premature Jump: Weight +${roundTo(weightChangePct, 0)}% but reps dropped more than expected (Got ${reps}, Expected ~${expectedRepsInt} based on your best set). Advice: Stay at the lower weight until you can hit more reps.`
  );
};

export const analyzeSetProgression = (sets: WorkoutSet[]): AnalysisResult[] => {
  if (sets.length < 2) return [];

  const results: AnalysisResult[] = [];
  let bestSession1RM = extractSetMetrics(sets[0]).oneRM;

  for (let i = 1; i < sets.length; i++) {
    const prev = extractSetMetrics(sets[i - 1]);
    const curr = extractSetMetrics(sets[i]);
    const transition = `Set ${i} -> Set ${i + 1}`;

    bestSession1RM = Math.max(bestSession1RM, prev.oneRM);

    const weightChangePct = calculatePercentChange(prev.weight, curr.weight);
    const volDropPct = calculatePercentChange(curr.volume, prev.volume);

    let result: AnalysisResult | null = null;

    if (Math.abs(weightChangePct) < 1.0) {
      result = analyzeSameWeight(transition, volDropPct, curr.reps);
    } else if (weightChangePct > 0) {
      result = analyzeWeightIncrease(transition, weightChangePct, volDropPct, curr.reps, bestSession1RM, curr.weight);
    } else {
      result = createAnalysisResult(
        transition, 'info', weightChangePct, volDropPct, curr.reps, '-',
        'Backoff Set',
        `Backoff: Weight reduced by ${Math.abs(roundTo(weightChangePct, 0))}%. Good for accumulating volume with less neural fatigue.`
      );
    }

    if (result) results.push(result);
  }

  return results;
};

type GoalLabel = 'Strength' | 'Hypertrophy' | 'Endurance' | 'Mixed' | 'N/A';

interface GoalConfig {
  label: GoalLabel;
  tooltip: string;
}

const GOAL_CONFIGS: Record<GoalLabel, string> = {
  'Strength': 'Average reps are low (≤5). This zone prioritizes Neural Adaptation and Max Strength.',
  'Hypertrophy': 'Average reps are moderate (6-15). This is the "Golden Zone" for Muscle Growth (Hypertrophy).',
  'Endurance': 'Average reps are high (>15). This zone prioritizes Metabolic Conditioning and Muscular Endurance.',
  'Mixed': '',
  'N/A': '',
};

const determineGoal = (avgReps: number): GoalConfig => {
  if (avgReps <= 5) return { label: 'Strength', tooltip: GOAL_CONFIGS['Strength'] };
  if (avgReps <= 15) return { label: 'Hypertrophy', tooltip: GOAL_CONFIGS['Hypertrophy'] };
  return { label: 'Endurance', tooltip: GOAL_CONFIGS['Endurance'] };
};

export const analyzeSession = (sets: WorkoutSet[]): SessionAnalysis => {
  if (sets.length === 0) {
    return { goalLabel: 'N/A', avgReps: 0, setCount: 0 };
  }

  let totalReps = 0;
  for (const s of sets) {
    totalReps += s.reps || 0;
  }
  const avgReps = Math.round(totalReps / sets.length);
  const { label, tooltip } = determineGoal(avgReps);

  return { goalLabel: label, avgReps, setCount: sets.length, tooltip };
};

const DEFAULT_TARGET_REPS = 10;
const MIN_HYPERTROPHY_REPS = 5;

export const analyzeProgression = (
  allSetsForExercise: WorkoutSet[], 
  targetReps: number = DEFAULT_TARGET_REPS
): SetWisdom | null => {
  if (allSetsForExercise.length === 0) return null;

  const reps = allSetsForExercise.map(s => s.reps);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  
  if (minReps >= targetReps) {
    return { 
      type: 'promote', 
      message: 'Increase Weight',
      tooltip: `You hit ${targetReps}+ reps on ALL sets. To force adaptation (Progressive Overload), increase the weight next session.`,
    };
  }
  
  if (maxReps < MIN_HYPERTROPHY_REPS) {
    return { 
      type: 'demote', 
      message: 'Decrease Weight', 
      tooltip: 'Reps dropped below 5. Unless doing powerlifting, this volume might be too low for muscle growth. Lower weight by 5-10%.',
    };
  }

  return null;
};

const STATUS_COLORS: Readonly<Record<AnalysisStatus, string>> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
  danger: 'bg-red-500/10 text-red-400 border-red-500/50',
};

const WISDOM_COLORS: Readonly<Record<string, string>> = {
  promote: 'bg-purple-500/10 text-purple-400 border-purple-500/50',
  demote: 'bg-orange-500/10 text-orange-400 border-orange-500/50',
};

const DEFAULT_COLOR = 'bg-slate-800 text-slate-400 border-slate-700';

export const getStatusColor = (status: AnalysisStatus): string => {
  return STATUS_COLORS[status] ?? DEFAULT_COLOR;
};

export const getWisdomColor = (type: string): string => {
  return WISDOM_COLORS[type] ?? DEFAULT_COLOR;
};