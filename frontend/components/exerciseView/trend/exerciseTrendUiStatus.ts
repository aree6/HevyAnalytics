import { AlertTriangle, Hourglass, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { ExerciseStats } from '../../../types';
import { analyzeExerciseTrendCore, ExerciseTrendStatus, MIN_SESSIONS_FOR_TREND, type ExerciseSessionEntry } from '../../../utils/analysis/exerciseTrend';
import type { ExerciseTrendMode, WeightUnit } from '../../../utils/storage/localStorage';
import { getLatestHistoryKey } from './exerciseTrendUiUtils';
import type { StatusResult } from './exerciseTrendUiTypes';
import { getNewCopy } from './exerciseTrendUiCopyNew';
import { getStagnantCopy } from './exerciseTrendUiCopyStagnant';
import { getOverloadCopy } from './exerciseTrendUiCopyOverload';
import { getRegressionCopy } from './exerciseTrendUiCopyRegression';

export const analyzeExerciseTrend = (
  stats: ExerciseStats,
  weightUnit: WeightUnit,
  options?: { trendMode?: ExerciseTrendMode; summarizedHistory?: ExerciseSessionEntry[] }
): StatusResult => {
  const core = analyzeExerciseTrendCore(stats, { trendMode: options?.trendMode, summarizedHistory: options?.summarizedHistory });
  const seedBase = `${stats.name}|${core.status}|${getLatestHistoryKey(stats.history)}`;

  if (core.status === 'new') {
    const sessionsCount = stats.history.length;
    const sessionsRemaining = MIN_SESSIONS_FOR_TREND - sessionsCount;
    const { title, description, subtext } = getNewCopy(seedBase, sessionsRemaining, MIN_SESSIONS_FOR_TREND);
    return {
      status: 'new',
      diffPct: core.diffPct,
      core,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: Hourglass,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'new exercise',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'stagnant') {
    const sessionsAtPlateau = Math.min(6, Math.max(1, stats.history.length));
    const { title, description, subtext } = getStagnantCopy(seedBase, core, weightUnit, sessionsAtPlateau);
    return {
      status: 'stagnant',
      diffPct: core.diffPct,
      core,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      icon: AlertTriangle,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'plateauing',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'overload') {
    const { title, description, subtext } = getOverloadCopy(seedBase);
    return {
      status: 'overload',
      diffPct: core.diffPct,
      core,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: TrendingUp,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'gaining',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'regression') {
    const { title, description, subtext } = getRegressionCopy(seedBase);
    return {
      status: 'regression',
      diffPct: core.diffPct,
      core,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      icon: TrendingDown,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'losing',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  return {
    status: core.status as ExerciseTrendStatus,
    diffPct: core.diffPct,
    core,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    icon: Minus,
    title: 'Unknown',
    description: 'Not enough data to analyze this exercise trend yet.',
    confidence: core.confidence,
    evidence: core.evidence,
    label: 'unknown',
    isBodyweightLike: core.isBodyweightLike,
    prematurePr: core.prematurePr,
  };
};
