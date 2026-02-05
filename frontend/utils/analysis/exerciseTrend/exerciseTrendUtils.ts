import { MIN_SESSIONS_FOR_TREND } from '../exerciseTrend/exerciseTrendCore';

export const avg = (xs: number[]): number => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const clampEvidence = (xs: string[], max: number = 3): string[] | undefined => {
  const cleaned = xs.filter(Boolean).slice(0, max);
  return cleaned.length > 0 ? cleaned : undefined;
};

export const keepDynamicEvidence = (xs: string[] | undefined): string[] | undefined => {
  if (!xs || xs.length === 0) return undefined;
  // Keep only lines that contain at least one digit so we don't repeat generic prose.
  const filtered = xs.filter((t) => /\d/.test(t));
  return filtered.length > 0 ? filtered : undefined;
};

// Helper to format numbers with color markers for UI rendering
// [[GREEN]]+value[[/GREEN]] for positive, [[RED]]-value[[/RED]] for negative
const fmtSignedWithColor = (value: string, isPositive: boolean): string => {
  const color = isPositive ? 'GREEN' : 'RED';
  return `[[${color}]]${value}[[/${color}]]`;
};

export const fmtSignedPct = (pct: number): string => {
  if (!Number.isFinite(pct)) return '0.0%';
  const isPositive = pct > 0;
  const sign = isPositive ? '+' : '';
  const value = `${sign}${pct.toFixed(1)}%`;
  return fmtSignedWithColor(value, isPositive);
};

export const getConfidence = (historyLen: number, windowSize: number): 'low' | 'medium' | 'high' => {
  if (historyLen < MIN_SESSIONS_FOR_TREND) return 'low';
  if (historyLen >= 10 && windowSize >= 6) return 'high';
  if (historyLen >= 6) return 'medium';
  return 'low';
};
