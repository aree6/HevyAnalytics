import { format } from 'date-fns';
import type { ExerciseTrendMode } from '../storage/localStorage';
import { ExerciseHistoryEntry, ExerciseStats } from '../../types';

export type ExerciseTrendStatus = 'overload' | 'stagnant' | 'regression' | 'neutral' | 'new';

export const MIN_SESSIONS_FOR_TREND = 4;

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
  plateau?: {
    weight: number;
    minReps: number;
    maxReps: number;
  };
}

export const WEIGHT_STATIC_EPSILON_KG = 0.5;
const MIN_SIGNAL_REPS = 2;
const REP_STATIC_EPSILON = 1;
const TREND_PCT_THRESHOLD = 1.0; // Reduced from 2.5% to 1.0% for more granular detection
const TREND_MIN_ABS_1RM_KG = 0.25;
const TREND_MIN_ABS_REPS = 1;

// Fake PR detection constants
const FAKE_PR_SPIKE_THRESHOLD = 5.0; // Reduced from 8% to 5% - more lenient spike detection
const FAKE_PR_FOLLOWUP_REGRESSION = -2.0; // Reduced from 3% to 2% - easier to trigger follow-up regression
const FAKE_PR_POST_PR_DROP_THRESHOLD = -2.5; // Reduced from 4% to 2.5% - more lenient post-PR drop detection

const avg = (xs: number[]): number => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const clampEvidence = (xs: string[], max: number = 3): string[] | undefined => {
  const cleaned = xs.filter(Boolean).slice(0, max);
  return cleaned.length > 0 ? cleaned : undefined;
};

const keepDynamicEvidence = (xs: string[] | undefined): string[] | undefined => {
  if (!xs || xs.length === 0) return undefined;
  // Keep only lines that contain at least one digit so we don't repeat generic prose.
  const filtered = xs.filter(t => /\d/.test(t));
  return filtered.length > 0 ? filtered : undefined;
};

// Helper to format numbers with color markers for UI rendering
// [[GREEN]]+value[[/GREEN]] for positive, [[RED]]-value[[/RED]] for negative
const fmtSignedWithColor = (value: string, isPositive: boolean): string => {
  const color = isPositive ? 'GREEN' : 'RED';
  return `[[${color}]]${value}[[/${color}]]`;
};

const fmtSignedPct = (pct: number): string => {
  if (!Number.isFinite(pct)) return '0.0%';
  const isPositive = pct > 0;
  const sign = isPositive ? '+' : '';
  const value = `${sign}${pct.toFixed(1)}%`;
  return fmtSignedWithColor(value, isPositive);
};

const getTrendThresholds = (
  trendMode: ExerciseTrendMode
): { pct: number; abs1rmKg: number; absReps: number } => {
  if (trendMode === 'reactive') {
    return {
      pct: 0.6,
      abs1rmKg: 0.25,
      absReps: 1,
    };
  }
  return {
    pct: TREND_PCT_THRESHOLD,
    abs1rmKg: TREND_MIN_ABS_1RM_KG,
    absReps: TREND_MIN_ABS_REPS,
  };
};

const getConfidence = (historyLen: number, windowSize: number): 'low' | 'medium' | 'high' => {
  if (historyLen < MIN_SESSIONS_FOR_TREND) return 'low';
  if (historyLen >= 10 && windowSize >= 6) return 'high';
  if (historyLen >= 6) return 'medium';
  return 'low';
};

export const summarizeExerciseHistory = (
  history: ExerciseHistoryEntry[],
  options?: { separateSides?: boolean }
): ExerciseSessionEntry[] => {
  const separateSides = options?.separateSides ?? false;
  const bySession = new Map<string, ExerciseSessionEntry>();

  for (const h of history) {
    const d = h.date;
    if (!d) continue;

    const ts = d.getTime();
    // If separating sides, include side in the key so L and R create different entries
    const baseKey = Number.isFinite(ts) ? String(ts) : format(d, 'yyyy-MM-dd');
    const key = separateSides && h.side ? `${baseKey}-${h.side}` : baseKey;

    let entry = bySession.get(key);
    if (!entry) {
      entry = {
        date: d,
        weight: 0,
        reps: 0,
        oneRepMax: 0,
        volume: 0,
        sets: 0,
        totalReps: 0,
        maxReps: 0,
        side: separateSides ? h.side : undefined,
      };
      bySession.set(key, entry);
    }

    entry.sets += h.side ? 0.5 : 1; // L/R sets count as 0.5 each (pair = 1 set)
    entry.volume += h.volume || 0;
    entry.totalReps += h.reps || 0;
    entry.maxReps = Math.max(entry.maxReps, h.reps || 0);

    if ((h.oneRepMax || 0) >= (entry.oneRepMax || 0)) {
      entry.oneRepMax = h.oneRepMax || 0;
      entry.weight = h.weight || 0;
      entry.reps = h.reps || 0;
    }
  }

  return Array.from(bySession.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const analyzeExerciseTrendCore = (
  stats: ExerciseStats,
  options?: { trendMode?: ExerciseTrendMode }
): ExerciseTrendCoreResult => {
  const trendMode: ExerciseTrendMode = options?.trendMode ?? 'reactive';
  const history = summarizeExerciseHistory(stats.history);

  // No usable history yet.
  if (history.length === 0) {
    return {
      status: 'new',
      isBodyweightLike: false,
      confidence: 'low',
    };
  }

  const recent = history.slice(0, Math.min(4, history.length));
  const weights = recent.map(h => h.weight);
  const reps = recent.map(h => h.maxReps);
  // Safe max for short windows.
  const maxWeightInRecent = Math.max(0, ...weights);
  const maxRepsInRecent = Math.max(0, ...reps);
  const zeroWeightSessions = weights.filter(w => w <= 0.0001).length;
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
    ? recent.map(h => h.maxReps)
    : recent.map(h => h.reps || (h.weight > 0 ? h.volume / h.weight : 0));
  const maxRepsMetric = Math.max(...repsMetric);
  const minRepsMetric = Math.min(...repsMetric);

  const isWeightStatic = weights.every(w => Math.abs(w - (weights[0] ?? 0)) < WEIGHT_STATIC_EPSILON_KG);
  const isRepStatic = (maxRepsMetric - minRepsMetric) <= REP_STATIC_EPSILON;

  if (isWeightStatic && isRepStatic) {
    const confidence = getConfidence(history.length, 4);
    return {
      status: 'stagnant',
      isBodyweightLike,
      confidence,
      evidence: keepDynamicEvidence(clampEvidence([
        isBodyweightLike
          ? `Top reps stayed within ~${Math.max(0, maxRepsMetric - minRepsMetric)} rep(s).`
          : `Top weight stayed within ~${WEIGHT_STATIC_EPSILON_KG}kg and reps within ~${REP_STATIC_EPSILON} rep(s).`,
      ])),
      plateau: {
        weight: weights[0] ?? 0,
        minReps: minRepsMetric,
        maxReps: maxRepsMetric,
      },
    };
  }

  // Trend: compare a recent window vs a previous window.
  // Default mode: 3v3 if possible, else 2v2.
  // Reactive mode: always prefer a shorter window (2v2) to reflect recent changes sooner.
  const windowSize = trendMode === 'reactive' ? 4 : (history.length >= 6 ? 6 : 4);
  const window = history.slice(0, windowSize);

  const metric = isBodyweightLike
    ? window.map(h => h.maxReps)
    : window.map(h => h.oneRepMax);

  const half = windowSize / 2;
  const currentMetric = avg(metric.slice(0, half));
  const previousMetric = avg(metric.slice(half));
  const diffAbs = currentMetric - previousMetric;
  const diffPct = previousMetric > 0 ? (diffAbs / previousMetric) * 100 : 0;

  const thresholds = getTrendThresholds(trendMode);

  if (currentMetric <= 0 || previousMetric <= 0) {
    return {
      status: 'new',
      isBodyweightLike,
      confidence: 'low',
      evidence: undefined,
    };
  }

  const meetsOverload = isBodyweightLike
    ? diffAbs >= thresholds.absReps && diffPct >= thresholds.pct
    : diffAbs >= thresholds.abs1rmKg && diffPct >= thresholds.pct;
  const meetsRegression = isBodyweightLike
    ? diffAbs <= -thresholds.absReps && diffPct <= -thresholds.pct
    : diffAbs <= -thresholds.abs1rmKg && diffPct <= -thresholds.pct;

  const latestSession = history[0];
  const previousSession = history[1];
  const latestMetric = latestSession ? (isBodyweightLike ? latestSession.maxReps : latestSession.oneRepMax) : 0;
  const previousSessionMetric = previousSession ? (isBodyweightLike ? previousSession.maxReps : previousSession.oneRepMax) : 0;
  const recentDeltaAbs = latestMetric - previousSessionMetric;
  const recentDeltaPct = previousSessionMetric > 0 ? (recentDeltaAbs / previousSessionMetric) * 100 : 0;

  const recentDirectionTag = (overall: number, recent: number): string | undefined => {
    // We only surface "recent" callouts when there is a meaningful change.
    const overallSign = overall > 0 ? 1 : overall < 0 ? -1 : 0;
    const recentSign = recent > 0 ? 1 : recent < 0 ? -1 : 0;
    if (recentSign === 0) return undefined;

    const absOverall = Math.abs(overall);
    const absRecent = Math.abs(recent);

    // If overall is flat/neutral, just describe the recent direction.
    if (overallSign === 0) return recentSign > 0 ? 'improving' : 'worsening';

    // Same-direction: is it accelerating or easing?
    if (overallSign === recentSign) {
      // Add some hysteresis so we don't spam "accelerating".
      if (absRecent >= absOverall + 1.0) return recentSign > 0 ? 'accelerating' : 'getting worse';
      if (absRecent <= Math.max(0, absOverall - 1.0)) return recentSign > 0 ? 'steady progress' : 'easing';
      return recentSign > 0 ? 'still improving' : 'still declining';
    }

    // Opposite-direction: call out rebound/slip.
    return recentSign > 0 ? 'rebound' : 'slipping';
  };

  const recentEvidence = (() => {
    if (!latestSession || !previousSession) return undefined;
    if (isBodyweightLike) {
      const deltaReps = Math.round(recentDeltaAbs);
      if (Math.abs(deltaReps) < 1) return undefined;
      const isPositive = deltaReps > 0;
      const sign = isPositive ? '+' : '';
      const coloredValue = fmtSignedWithColor(`${sign}${deltaReps}`, isPositive);
      const tag = recentDirectionTag(diffAbs, deltaReps);
      return tag ? `Recent reps: ${coloredValue} (${tag})` : `Recent reps: ${coloredValue}`;
    }
    if (Math.abs(recentDeltaPct) < 0.5) return undefined;

    const tag = recentDirectionTag(diffPct, recentDeltaPct);
    return tag ? `Recent: ${fmtSignedPct(recentDeltaPct)} (${tag})` : `Recent: ${fmtSignedPct(recentDeltaPct)}`;
  })();

  // Premature PR detection: secondary signal only.
  // Heuristic: a PR spike that is *followed* by one or more sessions that can't get back near that PR.
  // Important: if the PR is in the latest session, we do NOT have follow-up data, so we should not flag it.
  const prEvidence: Array<string | undefined> = [];
  let prematurePr = false;
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
        if (isBodyweightLike) {
          prEvidence.push(`PR spike: +${Math.round(spikeAbs)} rep(s)`);
          prEvidence.push(`After PR: ${Math.round(dropAbs)} rep(s)`);
        } else {
          prEvidence.push(`PR spike: +${spikePct.toFixed(1)}%`);
          prEvidence.push(`After PR: ${fmtSignedPct(dropPct)}`);
        }
      }
    }
  }

  const historyMaxLookback = Math.min(6, history.length);
  const priorLocalMax = historyMaxLookback >= 2
    ? Math.max(...history.slice(1, historyMaxLookback).map(s => (isBodyweightLike ? s.maxReps : s.oneRepMax)))
    : 0;
  const isLocalPr = latestSession && latestMetric > priorLocalMax;

  // In reactive mode, a meaningful local PR should move you out of stagnant/neutral/regression quickly.
  const shouldPromoteToOverload = trendMode === 'reactive'
    && isLocalPr
    && (isBodyweightLike ? recentDeltaAbs >= 1 : recentDeltaPct >= 0.6);

  if (meetsOverload || shouldPromoteToOverload) {
    const confidence = getConfidence(history.length, windowSize);
    return {
      status: 'overload',
      isBodyweightLike,
      diffPct,
      confidence,
      prematurePr,
      evidence: keepDynamicEvidence(clampEvidence([
        isBodyweightLike ? `Reps: ${fmtSignedPct(diffPct)}` : `Strength: ${fmtSignedPct(diffPct)}`,
        recentEvidence,
        ...prEvidence,
      ])),
    };
  }

  if (meetsRegression) {
    const confidence = getConfidence(history.length, windowSize);
    return {
      status: 'regression',
      isBodyweightLike,
      diffPct,
      confidence,
      prematurePr,
      evidence: keepDynamicEvidence(clampEvidence([
        isBodyweightLike ? `Reps: ${fmtSignedPct(diffPct)}` : `Strength: ${fmtSignedPct(diffPct)}`,
        recentEvidence,
        ...prEvidence,
      ])),
    };
  }

  const confidence = getConfidence(history.length, windowSize);
  return {
    status: 'neutral',
    isBodyweightLike,
    diffPct,
    confidence,
    prematurePr,
    evidence: keepDynamicEvidence(clampEvidence([
      recentEvidence,
      ...prEvidence,
    ])),
  };
};
