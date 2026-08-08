import React from 'react';
import { useInView, useReducedMotion } from 'motion/react';

type PopInTag = 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';

interface PopInProps {
  text: string;
  as?: PopInTag;
  className?: string;
  /** Extra classes applied to every character span (use for gradient text). */
  charClassName?: string;
  style?: React.CSSProperties;
  /** Per-character animation duration in ms. Default 640. */
  duration?: number;
  /** Delay between characters in ms. Default 36 — wide enough to read as a wave. */
  stagger?: number;
  /** Extra delay before the whole sequence starts. */
  delay?: number;
  /** Peak scale of the overshoot keyframe. Default 1.18 (use ~1.12 for subtle section headers). */
  overshoot?: number;
  /** Animate when scrolled into view (below-fold headings). Hero titles are in view on mount. */
  animateOnView?: boolean;
  ariaLabel?: string;
}

/**
 * Pop-in headline animation: per-character scale(.2) -> overshoot -> scale(1) + fade.
 * Defaults: duration=640ms / stagger=36ms (~1.2s total for a ~18-char headline).
 *
 * - SSR/SEO safe: renders plain text spans, animates client-side only via WAAPI.
 * - Respects prefers-reduced-motion (renders static text).
 * - SOLID-COLOR TEXT ONLY. Do not use with gradient (`background-clip: text`)
 *   text: per-character gradient boxes clip descenders (verified: even 1em of
 *   bottom padding is fragile), and putting the gradient on the parent instead
 *   renders nothing at all mid-flight — Chrome does not paint a parent's
 *   `background-clip: text` through transformed descendants (verified with
 *   frozen mid-animation screenshots).
 * - fill is 'backwards' (not 'both') so chars hide during their stagger delay
 *   but release to plain static spans the moment they land instead of holding
 *   a perpetual transform.
 */
export const PopIn: React.FC<PopInProps> = ({
  text,
  as = 'span',
  className,
  charClassName,
  style,
  duration = 640,
  stagger = 36,
  delay = 0,
  overshoot = 1.18,
  animateOnView = false,
  ariaLabel,
}) => {
  const ref = React.useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  // Trigger ~250px BEFORE the heading enters the viewport (positive bottom
  // rootMargin = preload band): observer delivery + React commit cost
  // 100-300ms, so triggering at the viewport edge reads as "empty area,
  // then pop". With a head start the first characters are already emerging
  // as the heading arrives — visually instant.
  const isInView = useInView(ref as React.RefObject<Element>, {
    once: true,
    margin: '0px 0px 250px 0px',
  });

  // Split once per text value. Spaces become non-breaking spacers to keep wrapping sane.
  const pieces = React.useMemo(
    () =>
      Array.from(text).map((ch, i) => ({
        ch,
        key: `${i}-${ch}`,
        isSpace: ch === ' ',
      })),
    [text]
  );

  const shouldAnimate = animateOnView ? isInView : true;

  // Mounted flag so SSR / no-JS still renders visible text: hiding applies
  // only once client JS is running (below-fold headings hide invisibly off-screen).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll-triggered headings must start HIDDEN (not full-then-reset):
  // before entering view no WAAPI animation exists yet, so without this the
  // full sentence paints first and visibly jumps back to zero on trigger.
  // Reduced-motion never hides.
  const hiddenBeforeView = animateOnView && mounted && !isInView && !reduceMotion;

  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !shouldAnimate || reduceMotion) return;

    const chars = root.querySelectorAll<HTMLElement>('[data-pop-c]');
    if (chars.length === 0) return;

    const animations: Animation[] = [];
    chars.forEach((el, i) => {
      const anim = el.animate(
        [
          { opacity: '0', transform: 'scale(.2)', easing: 'cubic-bezier(.5,0,.4,1)' },
          {
            opacity: '1',
            transform: `scale(${overshoot})`,
            offset: 0.6,
            easing: 'cubic-bezier(.3,1.2,.5,1)',
          },
          { opacity: '1', transform: 'scale(1)' },
        ],
        { duration, delay: delay + i * stagger, fill: 'backwards' }
      );
      animations.push(anim);
    });

    return () => {
      animations.forEach((a) => {
        try {
          a.cancel();
        } catch {
          /* noop */
        }
      });
    };
  }, [text, shouldAnimate, reduceMotion, duration, stagger, delay, overshoot]);

  const Tag = as as 'span';

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      style={{ display: 'inline-block', ...style, ...(hiddenBeforeView ? { opacity: 0 } : null) }}
      aria-label={ariaLabel ?? text}
      role="text"
    >
      {pieces.map((p) =>
        p.isSpace ? (
          <span
            key={p.key}
            aria-hidden="true"
            style={{ display: 'inline-block', width: '.3em' }}
          >
            &nbsp;
          </span>
        ) : (
          <span
            key={p.key}
            data-pop-c
            aria-hidden="true"
            className={charClassName}
            style={{ display: 'inline-block', transformOrigin: 'center' }}
          >
            {p.ch}
          </span>
        )
      )}
    </Tag>
  );
};

export default PopIn;
