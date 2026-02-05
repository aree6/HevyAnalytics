import React, { useMemo } from 'react';
import { Dumbbell, Moon, Sparkles, Sun } from 'lucide-react';
import { WeightUnit } from '../../../utils/storage/localStorage';
import { findBestComparison, formatLargeNumber, getRandomComparison } from '../../../utils/data/comparisonData';
import { assetPath } from '../../../constants';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../../utils/ui/uiConstants';
import CountUp from '../../ui/CountUp';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { ZERO_LIFT_MESSAGES } from '../utils/constants';

export type ComparisonMode = 'best' | 'random';

// Card component for volume comparison - designed to be screenshot-friendly
export const VolumeComparisonCard: React.FC<{
  totalVolume: number;
  totalVolumeKg: number;
  weightUnit: WeightUnit;
  theme: CardTheme;
  comparisonMode?: ComparisonMode;
  randomKey?: number;
  onThemeToggle?: () => void;
  showThemeToggle?: boolean;
}> = ({
  totalVolume,
  totalVolumeKg,
  weightUnit,
  theme,
  comparisonMode = 'best',
  randomKey = 0,
  onThemeToggle,
  showThemeToggle = false,
}) => {
  const volumeInKg = totalVolumeKg;

  const comparison = useMemo(() => {
    if (volumeInKg <= 0) return null;

    if (comparisonMode === 'random') {
      const { filename, item } = getRandomComparison();
      const rawCount = item.weight > 0 ? volumeInKg / item.weight : 0;
      const count = Math.max(0.1, Math.round(rawCount * 10) / 10);
      return { filename, item, count };
    }

    return findBestComparison(volumeInKg);
  }, [volumeInKg, comparisonMode, randomKey]);

  const zeroMessage = useMemo(() => {
    return ZERO_LIFT_MESSAGES[Math.floor(Math.random() * ZERO_LIFT_MESSAGES.length)];
  }, []);

  const isDark = theme === 'dark';

  const formattedCount = useMemo(() => {
    if (!comparison) return null;
    const count = comparison.count;

    if (count > 10) {
      const rounded = Math.round(count);
      return rounded >= 1000 ? formatLargeNumber(rounded) : rounded.toLocaleString();
    }

    const roundedToTenth = Math.round(count * 10) / 10;
    return roundedToTenth.toFixed(1).replace(/\.0$/, '');
  }, [comparison]);

  const textPrimary = isDark ? '!text-white' : '!text-slate-900';
  const textSecondary = isDark ? '!text-slate-400' : '!text-slate-700';
  const textMuted = isDark ? '!text-slate-500' : '!text-slate-600';
  const accentBg = isDark ? 'bg-blue-500/10' : 'bg-blue-100';
  const accentText = isDark ? '!text-blue-400' : '!text-blue-600';

  return (
    <FlexCard theme={theme} className="min-h-[460px] sm:min-h-[500px]">
      <div className={`absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-blue-500/5' : 'bg-blue-200/30'}`} />
      <div className={`absolute bottom-0 left-0 w-44 h-44 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-purple-500/5' : 'bg-purple-200/20'}`} />

      {showThemeToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onThemeToggle?.();
          }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-xl border transition-all duration-300 ${
            isDark
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-yellow-400'
              : 'bg-white/80 border-slate-300 hover:bg-slate-100 text-slate-700'
          }`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}

      <div className="relative z-[1] pt-5 px-5 pb-12 sm:pt-6 sm:px-6 sm:pb-14 flex flex-col items-center text-center h-full">
        <div className="w-full flex flex-col items-center">
          <div className={`flex items-center gap-2 mb-1.5 ${textMuted}`}>
            <Sparkles className="w-4 h-4" />
            <span className={`text-xs font-semibold uppercase tracking-widest ${textMuted}`}>Total Volume Lifted</span>
            <Sparkles className="w-4 h-4" />
          </div>

          <div className={`text-4xl sm:text-5xl font-black ${textPrimary} mb-0.5`} style={FANCY_FONT_NUMBERS}>
            {formatLargeNumber(totalVolume)}
            <span className={`text-xl sm:text-2xl ml-2 ${textSecondary}`}>{weightUnit}</span>
          </div>

          {volumeInKg <= 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`w-20 h-20 rounded-full ${accentBg} flex items-center justify-center mb-5`}>
                <Dumbbell className={`w-10 h-10 ${accentText}`} />
              </div>
              <p className={`text-base sm:text-lg ${textSecondary} max-w-xs`}>{zeroMessage}</p>
            </div>
          ) : comparison ? (
            <div className="flex flex-col items-center justify-center py-3">
              <div className="relative mb-3">
                <div
                  className={`absolute inset-0 rounded-full blur-3xl ${
                    isDark
                      ? 'bg-gradient-to-tr from-blue-500/35 via-cyan-500/18 to-purple-500/28'
                      : 'bg-gradient-to-tr from-blue-300/55 via-cyan-200/40 to-purple-300/45'
                  }`}
                />
                <img
                  src={assetPath(`/comparisonImages/${comparison.filename.replace(/\.svg$/, '.avif')}`)}
                  alt={comparison.item.label}
                  className="relative w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-lg"
                  loading="eager"
                />
              </div>

              <div className="flex flex-col items-center">
                <p className={`text-xs ${textMuted} mb-1 font-medium`}>That&apos;s like lifting</p>

                <div className={`text-4xl sm:text-5xl font-black ${accentText} leading-none`} style={FANCY_FONT_NUMBERS}>
                  <CountUp from={0} to={comparison.count} separator="," direction="up" duration={1} />
                </div>

                <h3 className={`text-lg sm:text-2xl font-bold ${textPrimary} mt-1`} style={FANCY_FONT}>
                  {comparison.item.label}
                </h3>

                {formattedCount && (
                  <div className="hidden" />
                )}
              </div>
            </div>
          ) : null}
        </div>

        <FlexCardFooter theme={theme} />

        <div className="hidden" />
      </div>
    </FlexCard>
  );
};
