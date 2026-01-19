export const RECHARTS_XAXIS_PADDING = { left: 10, right: 10 } as const;

const DEFAULT_MAX_TICKS_DESKTOP = 8;
const DEFAULT_MAX_TICKS_MOBILE = 6;
const DEFAULT_MOBILE_BREAKPOINT_PX = 640;

const getEffectiveMaxTicks = (
  maxTicks: number,
  opts?: { maxTicksMobile?: number; mobileBreakpointPx?: number }
): number => {
  const mobileBreakpointPx = opts?.mobileBreakpointPx ?? DEFAULT_MOBILE_BREAKPOINT_PX;
  const maxTicksMobile = opts?.maxTicksMobile ?? DEFAULT_MAX_TICKS_MOBILE;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < mobileBreakpointPx;

  const desktopMax = Number.isFinite(maxTicks) ? Math.floor(maxTicks) : 0;
  const effective = isMobile ? Math.min(desktopMax, maxTicksMobile) : desktopMax;
  return Math.max(0, effective);
};

export const getRechartsXAxisInterval = (
  pointCount: number,
  maxTicks: number = DEFAULT_MAX_TICKS_DESKTOP,
  opts?: { maxTicksMobile?: number; mobileBreakpointPx?: number }
): number => {
  const n = Number.isFinite(pointCount) ? pointCount : 0;

  const m = getEffectiveMaxTicks(maxTicks, opts);
  if (n <= 0) return 0;
  if (m <= 1) return n;
  return Math.max(0, Math.ceil(n / m) - 1);
};

export const getRechartsTickIndices = (
  pointCount: number,
  maxTicks: number = DEFAULT_MAX_TICKS_DESKTOP,
  opts?: { maxTicksMobile?: number; mobileBreakpointPx?: number }
): number[] | undefined => {
  const n = Number.isFinite(pointCount) ? pointCount : 0;
  if (n <= 0) return [];

  if (n === 1) return [0];

  const m = getEffectiveMaxTicks(maxTicks, opts);

  // If we can show everything without downsampling, let Recharts handle it normally.
  if (m >= n) return undefined;

  // Aim for a stable pattern (constant step) rather than "even distribution" rounding.
  // This avoids clusters like: Jan Feb Mar (gap) May Jun ... when m is close to n.
  const desired = Math.max(2, Math.min(n, m));
  const step = Math.max(1, Math.ceil((n - 1) / (desired - 1)));

  // Build from the end so the last tick is always included, without having to "drop"
  // a near-last tick (which looks like a weird gap) or accidentally cluster at the start.
  const rev: number[] = [];
  for (let i = n - 1; i >= 0; i -= step) rev.push(i);

  rev.reverse();
  if (rev.length === 0) return [0, n - 1];

  // Force the first tick to be 0 while keeping tick count stable.
  rev[0] = 0;

  // De-dup + sort safeguard.
  const out: number[] = [];
  for (const i of rev) {
    const clamped = Math.max(0, Math.min(n - 1, i));
    if (out.length === 0 || out[out.length - 1] !== clamped) out.push(clamped);
  }

  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
};

export const getRechartsTickIndexMap = (
  pointCount: number,
  maxTicks: number = DEFAULT_MAX_TICKS_DESKTOP,
  opts?: { maxTicksMobile?: number; mobileBreakpointPx?: number }
): Record<number, true> | undefined => {
  const idxs = getRechartsTickIndices(pointCount, maxTicks, opts);
  if (!idxs) return undefined;
  const out: Record<number, true> = {};
  for (const i of idxs) out[i] = true;
  return out;
};

export const getRechartsCategoricalTicks = <T,>(
  data: readonly T[],
  getValue: (row: T) => string | number | null | undefined,
  opts?: { maxTicks?: number; maxTicksMobile?: number; mobileBreakpointPx?: number }
): Array<string | number> | undefined => {
  const n = Array.isArray(data) ? data.length : 0;
  if (n <= 0) return [];

  const idxs = getRechartsTickIndices(n, opts?.maxTicks ?? DEFAULT_MAX_TICKS_DESKTOP, {
    maxTicksMobile: opts?.maxTicksMobile,
    mobileBreakpointPx: opts?.mobileBreakpointPx,
  });
  if (!idxs) return undefined;

  const ticks: Array<string | number> = [];
  for (const i of idxs) {
    const v = getValue(data[i]);
    if (v === null || v === undefined) continue;
    ticks.push(v);
  }

  return ticks;
};
