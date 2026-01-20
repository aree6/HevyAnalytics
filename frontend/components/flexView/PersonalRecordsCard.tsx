import React from 'react';
import { Trophy } from 'lucide-react';
import { WeightUnit } from '../../utils/storage/localStorage';
import { PRInsights } from '../../utils/analysis/insights';
import { assetPath } from '../../constants';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../utils/ui/uiConstants';
import CountUp from '../ui/CountUp';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';

// ============================================================================
// CARD 3: Personal Records Card - with Laurel Wreath
// ============================================================================
export const PersonalRecordsCard: React.FC<{
  prInsights: PRInsights;
  topPRExercises: { name: string; weight: number; thumbnail?: string }[];
  weightUnit: WeightUnit;
  theme: CardTheme;
}> = ({ prInsights, topPRExercises, weightUnit, theme }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const prNumberColor = isDark ? 'text-white' : 'text-slate-900';

  const prCountContainerRef = React.useRef<HTMLDivElement | null>(null);
  const prCountTextRef = React.useRef<HTMLSpanElement | null>(null);
  const [prCountFontSizePx, setPrCountFontSizePx] = React.useState<number>(64);

  const effectiveTotalPRs = prInsights.totalPRs;

  const isCompactPR = effectiveTotalPRs >= 10000;
  const compactPR = (() => {
    if (!isCompactPR) return { value: effectiveTotalPRs, suffix: '', decimals: 0 };

    const abs = Math.abs(effectiveTotalPRs);
    const base = abs >= 1_000_000_000 ? 1_000_000_000 : abs >= 1_000_000 ? 1_000_000 : 1_000;
    const suffix = base === 1_000_000_000 ? 'B+' : base === 1_000_000 ? 'M+' : 'k+';
    const raw = abs / base;
    const decimals = raw < 10 ? 1 : 0;
    const factor = decimals === 1 ? 10 : 1;
    const floored = Math.floor(raw * factor) / factor;
    const signed = effectiveTotalPRs < 0 ? -floored : floored;

    return { value: signed, suffix, decimals };
  })();

  const prDisplayText = isCompactPR
    ? `${compactPR.value.toFixed(compactPR.decimals)}${compactPR.suffix}`
    : Intl.NumberFormat('en-US').format(effectiveTotalPRs);

  const prCountLen = prDisplayText.length;
  const prCountSizeClass =
    prCountLen >= 9
      ? 'text-2xl sm:text-3xl'
      : prCountLen >= 7
        ? 'text-3xl sm:text-4xl'
        : prCountLen >= 6
          ? 'text-4xl sm:text-5xl'
          : 'text-5xl sm:text-6xl';

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const container = prCountContainerRef.current;
    const textEl = prCountTextRef.current;
    if (!container || !textEl) return;

    const maxPx = 48;
    const minPx = 18;

    const fitToWidth = () => {
      const maxWidth = container.clientWidth;
      if (maxWidth <= 0) return;

      let lo = minPx;
      let hi = maxPx;
      let best = minPx;

      for (let i = 0; i < 10; i++) {
        const mid = Math.round((lo + hi) / 2);
        textEl.style.fontSize = `${mid}px`;

        const width = textEl.getBoundingClientRect().width;
        if (width <= maxWidth) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      setPrCountFontSizePx(best);
    };

    const raf = window.requestAnimationFrame(fitToWidth);
    const ro = new ResizeObserver(() => fitToWidth());
    ro.observe(container);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [prDisplayText, prCountSizeClass]);

  return (
    <FlexCard theme={theme} className="min-h-[500px] flex flex-col">
      <div className="relative z-[1] pt-6 px-6 pb-12 flex flex-col items-center text-center flex-1">
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-amber-500/10' : 'bg-amber-200/40'}`} />

        <h2 className={`text-xl sm:text-2xl font-bold ${textPrimary} mb-4`} style={FANCY_FONT}>
          In total you had
        </h2>

        <div className="relative mb-3">
          <img
            src={assetPath('/comparisonImages/Laurel-Wreath1.svg')}
            alt=""
            className="w-56 h-56 sm:w-64 sm:h-64 object-contain opacity-95"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div ref={prCountContainerRef} className="w-[168px] sm:w-[192px] flex items-center justify-center">
              <span
                ref={prCountTextRef}
                className={`${prCountSizeClass} inline-block font-black ${prNumberColor} tabular-nums tracking-tight leading-none whitespace-nowrap text-center`}
                style={{ ...FANCY_FONT_NUMBERS, fontSize: `${prCountFontSizePx}px` }}
              >
                {isCompactPR ? (
                  <>
                    <CountUp from={0} to={compactPR.value} separator="," direction="up" duration={1} />
                    {compactPR.suffix}
                  </>
                ) : (
                  <CountUp from={0} to={effectiveTotalPRs} separator="," direction="up" duration={1} />
                )}
              </span>
            </div>

            <div
              className={`relative mt-1 px-3.5 py-1 rounded-full border overflow-hidden ${
                isDark ? 'bg-slate-900/35 border-white/10' : 'bg-white/55 border-slate-900/10'
              }`}
            >
              <div
                className={`absolute inset-0 pointer-events-none ${
                  isDark
                    ? 'bg-gradient-to-b from-slate-900/65 via-slate-900/40 to-slate-900/10'
                    : 'bg-gradient-to-b from-white/80 via-white/55 to-white/20'
                }`}
              />
              <div className="absolute inset-0 pointer-events-none" />
              <div className={`relative text-xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`} style={FANCY_FONT}>
                PRs
              </div>
            </div>
          </div>
        </div>

        <div className="hidden" />

        {topPRExercises.length > 0 && (
          <div className="w-full mt-2">
            {(() => {
              const display = topPRExercises.slice(0, 2);
              const maxW = Math.max(...display.map((e) => e.weight), 1);
              const rowH = 48;
              const avatar = 40;

              return (
                <div className="w-full flex flex-col gap-3 px-1 overflow-x-hidden">
                  {display.map((exercise, idx) => {
                    const pct = Math.max(4, Math.round((exercise.weight / maxW) * 100));
                    const medal = idx === 0 ? 'gold' : 'silver';
                    const medalEmoji = medal === 'gold' ? '🏅' : '✨';
                    const countClass =
                      medal === 'gold'
                        ? isDark
                          ? 'text-amber-300'
                          : 'text-amber-700'
                        : isDark
                          ? 'text-slate-200'
                          : 'text-slate-700';

                    const fillBackground =
                      medal === 'gold'
                        ? 'linear-gradient(90deg, rgba(245,158,11,0.95) 0%, rgba(59,130,246,0.85) 100%)'
                        : 'linear-gradient(90deg, rgba(226,232,240,0.92) 0%, rgba(148,163,184,0.82) 40%, rgba(59,130,246,0.75) 100%)';

                    const medalRing = '';

                    return (
                      <div key={exercise.name} className="flex items-center gap-3 min-w-0">
                        <div
                          className={`relative flex-1 min-w-0 rounded-full overflow-hidden ${isDark ? 'bg-black/25' : 'bg-slate-200/70'} `}
                          style={{ height: `${rowH}px` }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                            style={{
                              width: `${pct}%`,
                              minWidth: `${avatar + 96}px`,
                              backgroundImage: fillBackground,
                              opacity: 0.95,
                            }}
                          >
                            <div
                              className="relative z-10 h-full flex items-center pl-4"
                              style={{ paddingRight: `${avatar + 14}px` }}
                            >
                              <div className="text-white font-semibold text-sm truncate">
                                {medalEmoji} {exercise.name}
                              </div>
                            </div>

                            <div
                              className={`absolute top-1/2 -translate-y-1/2 right-1 rounded-full overflow-hidden bg-white ${medalRing}`}
                              style={{ width: `${avatar}px`, height: `${avatar}px` }}
                            >
                              {exercise.thumbnail ? (
                                <img
                                  src={exercise.thumbnail}
                                  alt={exercise.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-white/95 flex items-center justify-center">
                                  <Trophy className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`min-w-[96px] text-right font-extrabold text-lg tracking-tight ${countClass}`}
                          style={FANCY_FONT_NUMBERS}
                        >
                          {exercise.weight}
                          <span className={`${isDark ? 'text-white/90' : 'text-slate-900/80'} font-bold ml-1`}>{weightUnit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
