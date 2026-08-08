/**
 * THE global tweak file for the Reveal scroll animation.
 *
 * Two presets, one per surface:
 * - `subtle` → dashboard + every in-app card (history, muscle, exercise,
 *   insights, flex, docs). Keep this whisper-quiet: these cards already move
 *   on their own (skeletons, chart draws, count-ups), so the entrance must
 *   never compete with them. In particular, do NOT put an overshoot/bounce
 *   ease here — overshoot reads as a second movement when content is still
 *   rendering underneath.
 * - `pop` → landing page marketing rows only. This one may bounce.
 *
 * How to tune:
 * - `scale`: where the card starts (1 = final size). 0.97 = barely-there,
 *   0.9 = clearly visible pop. Only the distance from 1 matters.
 * - `duration`: seconds for one card's entrance. ~0.6 snappy, ~0.8 floaty.
 * - `ease`: motion curve. Soft/no-bounce = [0.22, 1, 0.36, 1].
 *   Bouncy back.out(1.6) = [0.34, 1.56, 0.64, 1] (overshoot snap).
 * - Entrance always fades opacity 0 → 1 and fires once per card when ~20%
 *   of it scrolls into view. `prefers-reduced-motion` skips it entirely.
 */

export type RevealVariant = 'subtle' | 'pop';

export interface RevealTune {
  /** Starting scale (1 = final size). */
  scale: number;
  /** Entrance length in seconds. */
  duration: number;
  /** Cubic-bezier easing. */
  ease: [number, number, number, number];
}

export const REVEAL_TUNING: Record<RevealVariant, RevealTune> = {
  subtle: { scale: 0.98, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  pop: { scale: 0.9, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
};
