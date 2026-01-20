import React from 'react';
import { Sparkles } from 'lucide-react';
import CountUp from '../ui/CountUp';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { WeightUnit } from '../../utils/storage/localStorage';
import { formatLargeNumber } from '../../utils/data/comparisonData';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../utils/ui/uiConstants';

// ============================================================================
// CARD 1: Summary Card - Overview stats
// ============================================================================
export const SummaryCard: React.FC<{
  totalWorkouts: number;
  totalDuration: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  weightUnit: WeightUnit;
  theme: CardTheme;
}> = ({ totalWorkouts, totalDuration, totalVolume, totalSets, totalReps, weightUnit, theme }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';

  const hours = Math.round(totalDuration / 60);

  return (
    <FlexCard theme={theme} className="min-h-[500px] flex flex-col">
      <div className="relative z-[1] pt-6 px-6 pb-16 flex flex-col items-center text-center flex-1">
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/40'}`} />
        <div className={`absolute bottom-20 left-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-purple-500/10' : 'bg-purple-200/30'}`} />

        <div className={`flex items-center gap-2 mb-4 ${textMuted}`}>
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Your Journey</span>
          <Sparkles className="w-4 h-4" />
        </div>

        <h2 className={`text-2xl sm:text-3xl font-bold ${textPrimary} mb-8`} style={FANCY_FONT}>
          Your Fitness Summary 💪
        </h2>

        <div className="mb-6">
          <div className={`text-7xl sm:text-8xl font-black ${textPrimary}`} style={FANCY_FONT_NUMBERS}>
            <CountUp from={0} to={totalWorkouts} separator="," direction="up" duration={1} className={textPrimary} />
          </div>
          <div className={`text-lg ${textSecondary} font-medium`}>Workouts</div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="text-center">
            <div className={`text-3xl sm:text-4xl font-bold ${textPrimary}`} style={FANCY_FONT_NUMBERS}>
              {hours > 0 ? `${hours}h` : '<1h'}
            </div>
            <div className={`text-sm ${textSecondary}`}>Duration</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl sm:text-4xl font-bold ${textPrimary}`} style={FANCY_FONT_NUMBERS}>
              {formatLargeNumber(totalVolume)}
              <span className={`text-lg ml-1 ${textSecondary}`}>{weightUnit}</span>
            </div>
            <div className={`text-sm ${textSecondary}`}>Volume</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className={`text-2xl sm:text-3xl font-bold ${textPrimary}`} style={FANCY_FONT_NUMBERS}>
              {formatLargeNumber(totalSets)}
            </div>
            <div className={`text-sm ${textSecondary}`}>Sets</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl sm:text-3xl font-bold ${textPrimary}`} style={FANCY_FONT_NUMBERS}>
              {formatLargeNumber(totalReps)}
            </div>
            <div className={`text-sm ${textSecondary}`}>Reps</div>
          </div>
        </div>
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
