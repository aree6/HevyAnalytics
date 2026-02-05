import { fmtSignedPct } from '../exerciseTrend/exerciseTrendUtils';
import type { ExerciseSessionEntry } from '../exerciseTrend/exerciseTrendCore';

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

export const buildRecentEvidence = (args: {
  latestSession?: ExerciseSessionEntry;
  previousSession?: ExerciseSessionEntry;
  isBodyweightLike: boolean;
  diffAbs: number;
  diffPct: number;
  recentDeltaAbs: number;
  recentDeltaPct: number;
}): string | undefined => {
  const {
    latestSession,
    previousSession,
    isBodyweightLike,
    diffAbs,
    diffPct,
    recentDeltaAbs,
    recentDeltaPct,
  } = args;

  if (!latestSession || !previousSession) return undefined;
  if (isBodyweightLike) {
    const deltaReps = Math.round(recentDeltaAbs);
    if (Math.abs(deltaReps) < 1) return undefined;
    const isPositive = deltaReps > 0;
    const sign = isPositive ? '+' : '';
    const coloredValue = `[[${isPositive ? 'GREEN' : 'RED'}]]${sign}${deltaReps}[[/${isPositive ? 'GREEN' : 'RED'}]]`;
    const tag = recentDirectionTag(diffAbs, deltaReps);
    return tag ? `Recent reps: ${coloredValue} (${tag})` : `Recent reps: ${coloredValue}`;
  }
  if (Math.abs(recentDeltaPct) < 0.5) return undefined;

  const tag = recentDirectionTag(diffPct, recentDeltaPct);
  return tag ? `Recent: ${fmtSignedPct(recentDeltaPct)} (${tag})` : `Recent: ${fmtSignedPct(recentDeltaPct)}`;
};
