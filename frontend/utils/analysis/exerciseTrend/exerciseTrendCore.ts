import type { ExerciseTrendMode } from '../../storage/localStorage';
import type { ExerciseStats } from '../../../types';
import { avg, clampEvidence, fmtSignedPct, getConfidence, keepDynamicEvidence } from '../exerciseTrend/exerciseTrendUtils';
import { summarizeExerciseHistory } from '../exerciseTrend/exerciseTrendSummary';
import { buildRecentEvidence } from '../exerciseTrend/exerciseTrendRecentEvidence';

// ============================================================================
// Constants (merged from exerciseTrendConstants.ts)
// ============================================================================
export const WEIGHT_STATIC_EPSILON_KG = 0.5;
export const MIN_SIGNAL_REPS = 2;
export const REP_STATIC_EPSILON = 1;

// Fake PR detection constants
export const FAKE_PR_SPIKE_THRESHOLD = 5.0; // Reduced from 8% to 5% - more lenient spike detection
export const FAKE_PR_FOLLOWUP_REGRESSION = -2.0; // Reduced from 3% to 2% - easier to trigger follow-up regression
export const FAKE_PR_POST_PR_DROP_THRESHOLD = -2.5; // Reduced from 4% to 2.5% - more lenient post-PR drop detection

// Status thresholds (UX-driven)
// - Gaining: > +2%
// - Plateauing: between -3% and +2% (inclusive)
// - Losing: < -3%
export const GAINING_PCT_THRESHOLD = 2.0;
export const LOSING_PCT_THRESHOLD = -3.0;
export const MIN_SESSIONS_FOR_TREND = 4;

// ============================================================================
// Types (merged from exerciseTrendTypes.ts)
// ============================================================================
export type ExerciseTrendStatus = 'overload' | 'stagnant' | 'regression' | 'new';

export interface ExerciseSessionEntry {
  date: Date;
  weight: number;
  reps: number;
  oneRepMax: number;
  volume: number;
  sets: number;
  totalReps: number;
  maxReps: number;
  /** For unilateral exercises: 'left', 'right', or undefined for bilateral/combined */
  side?: 'left' | 'right';
}

export interface ExerciseTrendCoreResult {
  status: ExerciseTrendStatus;
  isBodyweightLike: boolean;
  diffPct?: number;
  confidence?: 'low' | 'medium' | 'high';
  evidence?: string[];
  prematurePr?: boolean;
  /** For tooltip-only: % jump into the PR and % drop after (weighted only) */
  prSpikePct?: number;
  prDropPct?: number;
  calculation?: {
    /** Total eligible (summarized) sessions used for analysis */
    historyLen: number;
    /** Window size used for overall trend (windowSize/2 vs windowSize/2) */
    windowSize: number;
    currentAvg: number;
    previousAvg: number;
    /** Latest vs previous session metric (1RM or reps) */
    latestMetric?: number;
    previousSessionMetric?: number;
    recentDeltaAbs?: number;
    recentDeltaPct?: number;
  };
  plateau?: {
    weight: number;
    minReps: number;
    maxReps: number;
  };
}

export const analyzeExerciseTrendCore = (
  stats: ExerciseStats,
  options?: { trendMode?: ExerciseTrendMode; summarizedHistory?: ExerciseSessionEntry[] }
): ExerciseTrendCoreResult => {
  const trendMode: ExerciseTrendMode = options?.trendMode ?? 'reactive';
  const history = options?.summarizedHistory ?? summarizeExerciseHistory(stats.history);

  // No usable history yet.
  if (history.length === 0) {
    return {
      status: 'new',
      isBodyweightLike: false,
      confidence: 'low',
    };
  }

  const recent = history.slice(0, Math.min(4, history.length));
  const weights = recent.map((h) => h.weight);
  const reps = recent.map((h) => h.maxReps);
  // Safe max for short windows.
  const maxWeightInRecent = Math.max(0, ...weights);
  const maxRepsInRecent = Math.max(0, ...reps);
  const zeroWeightSessions = weights.filter((w) => w <= 0.0001).length;
  const isBodyweightLike = zeroWeightSessions >= Math.ceil(recent.length * 0.75);

  const hasMeaningfulSignal = isBodyweightLike
    ? maxRepsInRecent >= MIN_SIGNAL_REPS
    : maxWeightInRecent > 0.0001;

  if (!hasMeaningfulSignal) {
    return {
      status: 'new',
      isBodyweightLike,
      confidence: 'low',
      evidence: keepDynamicEvidence(clampEvidence([
        // Keep this dynamic: it will show "weight ≈ 0" which contains a digit.
        isBodyweightLike ? 'Most recent sessions look bodyweight-like (weight ≈ 0).' : 'Most recent sessions have near-zero load.',
      ])),
    };
  }

  // Not enough history to compare windows reliably.
  if (history.length < MIN_SESSIONS_FOR_TREND) {
    return {
      status: 'new',
      isBodyweightLike,
      confidence: 'low',
      evidence: keepDynamicEvidence(clampEvidence([
        `Only ${history.length} session${history.length === 1 ? '' : 's'} logged (need ${MIN_SESSIONS_FOR_TREND}+).`,
      ])),
    };
  }

  const repsMetric = isBodyweightLike
    ? recent.map((h) => h.maxReps).filter(r => Number.isFinite(r))
    : recent.map((h) => h.reps || (h.weight > 0 ? h.volume / h.weight : 0)).filter(r => Number.isFinite(r));
  
  // Guard against empty arrays
  if (repsMetric.length === 0) {
    return {
      status: 'new',
      isBodyweightLike,
      confidence: 'low',
      evidence: keepDynamicEvidence(clampEvidence([
        'No valid rep data available for analysis.',
      ])),
    };
  }
  
  const maxRepsMetric = Math.max(...repsMetric);
  const minRepsMetric = Math.min(...repsMetric);

  // If a lift is treated as weighted (not bodyweight-like) but the recent best load is ~0,
  // plateau messaging that references load will look wrong. Prefer classifying this as new.
  if (!isBodyweightLike && maxWeightInRecent <= 0.0001) {
    return {
      status: 'new',
      isBodyweightLike,
      confidence: 'low',
      evidence: keepDynamicEvidence(clampEvidence([
        'Most recent sessions have near-zero load.',
      ])),
    };
  }

  // Premature PR detection is calculated later, but the UI badge should exist for all statuses.
  let prematurePr = false;
  let prSpikePct: number | undefined;
  let prDropPct: number | undefined;

  const isWeightStatic = weights.every((w) => Math.abs(w - (weights[0] ?? 0)) < WEIGHT_STATIC_EPSILON_KG);
  const isRepStatic = (maxRepsMetric - minRepsMetric) <= REP_STATIC_EPSILON;

  const isStaticPlateau = isWeightStatic && isRepStatic;
  const plateau = isStaticPlateau
    ? {
        weight: weights[0] ?? 0,
        minReps: minRepsMetric,
        maxReps: maxRepsMetric,
      }
    : undefined;

  // Trend: compare a recent window vs a previous window.
  // Default mode: 3v3 if possible, else 2v2.
  // Reactive mode: always prefer a shorter window (2v2) to reflect recent changes sooner.
  const windowSize = trendMode === 'reactive' ? 4 : (history.length >= 6 ? 6 : 4);
  const window = history.slice(0, windowSize);

  const metric = isBodyweightLike
    ? window.map((h) => h.maxReps)
    : window.map((h) => h.oneRepMax);

  const half = windowSize / 2;
  const currentMetric = avg(metric.slice(0, half));
  const previousMetric = avg(metric.slice(half));
  const diffAbs = currentMetric - previousMetric;
  const diffPct = previousMetric > 0 ? (diffAbs / previousMetric) * 100 : 0;

  if (currentMetric <= 0 || previousMetric <= 0) {
    return {
      status: 'new',
      isBodyweightLike,
      confidence: 'low',
      evidence: undefined,
    };
  }

  const latestSession = history[0];
  const previousSession = history[1];
  const latestMetric = latestSession ? (isBodyweightLike ? latestSession.maxReps : latestSession.oneRepMax) : 0;
  const previousSessionMetric = previousSession ? (isBodyweightLike ? previousSession.maxReps : previousSession.oneRepMax) : 0;
  const recentDeltaAbs = latestMetric - previousSessionMetric;
  const recentDeltaPct = previousSessionMetric > 0 ? (recentDeltaAbs / previousSessionMetric) * 100 : 0;

  const recentEvidence = buildRecentEvidence({
    latestSession,
    previousSession,
    isBodyweightLike,
    diffAbs,
    diffPct,
    recentDeltaAbs,
    recentDeltaPct,
  });

  // Premature PR detection: secondary signal only.
  // Heuristic: a PR spike that is *followed* by one or more sessions that can't get back near that PR.
  // Important: if the PR is in the latest session, we do NOT have follow-up data, so we should not flag it.
  {
    const lookback = Math.min(6, history.length);
    const sessions = history.slice(0, lookback);
    const m = sessions.map((s) => (isBodyweightLike ? s.maxReps : s.oneRepMax));

    // Find the most recent PR that has at least one follow-up session.
    // (Index 0 is latest; if that's the PR we skip because there's no follow-up.)
    let prIndex = -1;
    for (let i = 1; i < m.length - 1; i += 1) {
      const prMetric = m[i] ?? 0;
      const olderMax = Math.max(0, ...m.slice(i + 1));
      if (prMetric > olderMax + (isBodyweightLike ? 0.25 : 0.001)) {
        prIndex = i;
        break;
      }
    }

    if (prIndex >= 1) {
      const prMetric = m[prIndex] ?? 0;
      const priorMetric = m[prIndex + 1] ?? 0;

      const prSession = sessions[prIndex];
      const prWeight = prSession?.weight ?? 0;

      // Require the PR to be a meaningful jump.
      const spikePct = priorMetric > 0 ? ((prMetric - priorMetric) / priorMetric) * 100 : 0;
      const spikeAbs = prMetric - priorMetric;
      const meaningfulSpike = isBodyweightLike ? spikeAbs >= 1 : spikePct >= 2.0;

      // "After PR" = sessions that happened after the PR (more recent entries).
      const afterPr = m.slice(0, prIndex);
      const bestAfterPr = Math.max(0, ...afterPr);
      const dropPct = prMetric > 0 ? ((bestAfterPr - prMetric) / prMetric) * 100 : 0;
      const dropAbs = bestAfterPr - prMetric;

      // Recovery rule: if they re-hit the PR level in >= 2 later sessions, we treat it as validated.
      // This avoids keeping the badge around once the athlete proves they can reproduce the performance.
      const afterPrSessions = sessions.slice(0, prIndex);
      const rehitCount = isBodyweightLike
        ? afterPrSessions.filter((s) => (s.maxReps ?? 0) >= prMetric).length
        : afterPrSessions.filter((s) => (s.weight ?? 0) >= prWeight - WEIGHT_STATIC_EPSILON_KG).length;
      const isValidated = rehitCount >= 2;

      // If the best follow-up still can't get close, it's a premature PR.
      const sustainedFailure = isBodyweightLike
        ? dropAbs <= -1
        : dropPct <= FAKE_PR_POST_PR_DROP_THRESHOLD;

      prematurePr = Boolean(!isValidated && meaningfulSpike && sustainedFailure);
      if (prematurePr) {
        if (!isBodyweightLike) {
          prSpikePct = spikePct;
          prDropPct = dropPct;
        }
      }
    }
  }

  const calculation: ExerciseTrendCoreResult['calculation'] = {
    historyLen: history.length,
    windowSize,
    currentAvg: currentMetric,
    previousAvg: previousMetric,
    latestMetric: latestSession ? latestMetric : undefined,
    previousSessionMetric: previousSession ? previousSessionMetric : undefined,
    recentDeltaAbs: previousSession ? recentDeltaAbs : undefined,
    recentDeltaPct: previousSession ? recentDeltaPct : undefined,
  };

  if (diffPct > GAINING_PCT_THRESHOLD) {
    const confidence = getConfidence(history.length, windowSize);
    return {
      status: 'overload',
      isBodyweightLike,
      diffPct,
      confidence,
      prematurePr,
      prSpikePct,
      prDropPct,
      calculation,
      evidence: keepDynamicEvidence(clampEvidence([
        isBodyweightLike ? `Reps: ${fmtSignedPct(diffPct)}` : `Strength: ${fmtSignedPct(diffPct)}`,
        recentEvidence,
      ])),
    };
  }

  if (diffPct < LOSING_PCT_THRESHOLD) {
    const confidence = getConfidence(history.length, windowSize);
    return {
      status: 'regression',
      isBodyweightLike,
      diffPct,
      confidence,
      prematurePr,
      prSpikePct,
      prDropPct,
      calculation,
      evidence: keepDynamicEvidence(clampEvidence([
        isBodyweightLike ? `Reps: ${fmtSignedPct(diffPct)}` : `Strength: ${fmtSignedPct(diffPct)}`,
        recentEvidence,
      ])),
    };
  }

  const confidence = getConfidence(history.length, windowSize);
  return {
    status: 'stagnant',
    isBodyweightLike,
    diffPct,
    confidence,
    prematurePr,
    prSpikePct,
    prDropPct,
    calculation,
    evidence: keepDynamicEvidence(clampEvidence([
      isBodyweightLike ? `Reps: ${fmtSignedPct(diffPct)}` : `Strength: ${fmtSignedPct(diffPct)}`,
      recentEvidence,
      isStaticPlateau
        ? (isBodyweightLike
          ? `Top reps stayed within ~${Math.max(0, maxRepsMetric - minRepsMetric)} rep(s).`
          : `Top weight stayed within ~${WEIGHT_STATIC_EPSILON_KG}kg and reps within ~${REP_STATIC_EPSILON} rep(s).`)
        : undefined,
    ])),
    plateau,
  };
};
