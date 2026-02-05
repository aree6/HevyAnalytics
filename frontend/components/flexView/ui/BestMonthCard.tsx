import React from 'react';
import CountUp from '../../ui/CountUp';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../../utils/ui/uiConstants';
import { BEST_MONTH_ACCENTS, MONTH_NAMES, MONTH_SHORT } from '../utils/constants';

// ============================================================================
// CARD 4: Best Month Card
// ============================================================================
export const BestMonthCard: React.FC<{
  monthlyData: { month: number; workouts: number }[];
  theme: CardTheme;
  selectedYear: number;
}> = ({ monthlyData, theme, selectedYear }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  const bestMonth = monthlyData.reduce(
    (best, curr) => (curr.workouts > best.workouts ? curr : best),
    { month: 0, workouts: 0 }
  );

  const accent = BEST_MONTH_ACCENTS[bestMonth.month] || BEST_MONTH_ACCENTS[0];
  const mainNumberColor = isDark ? accent.textDark : accent.textLight;

  const maxWorkouts = Math.max(...monthlyData.map((m) => m.workouts), 1);

  const activeMonths = monthlyData.filter((m) => m.workouts > 0);
  const avgWorkouts =
    activeMonths.length > 0
      ? Math.round(activeMonths.reduce((sum, m) => sum + m.workouts, 0) / activeMonths.length)
      : 0;

  return (
    <FlexCard theme={theme} className="min-h-[500px] flex flex-col">
      <div className="relative z-[1] pt-6 px-6 pb-14 flex flex-col items-center text-center flex-1">
        <div className={`absolute top-0 left-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-200/40'}`} />

        <h2 className={`text-xl sm:text-2xl font-bold ${textPrimary} mb-2`} style={FANCY_FONT}>
          {bestMonth.workouts > 0 ? `${MONTH_NAMES[bestMonth.month]} ${selectedYear}` : 'Building baseline'}
        </h2>
        <p className={`text-sm ${textSecondary} mb-4`}>was your best month with</p>

        <div className={`text-7xl sm:text-8xl font-black mb-1 ${mainNumberColor}`} style={FANCY_FONT_NUMBERS}>
          <CountUp
            from={0}
            to={bestMonth.workouts}
            separator="," 
            direction="up"
            duration={1}
            className={mainNumberColor}
          />
        </div>
        <div className={`text-lg ${textSecondary} mb-6`}>Workouts</div>

        <div className="w-full flex items-end justify-center gap-1 h-24 mb-4">
          {MONTH_SHORT.map((month, idx) => {
            const data = monthlyData.find((m) => m.month === idx);
            const workouts = data?.workouts || 0;
            const maxBarHeight = 84;
            const heightPx = maxWorkouts > 0 ? (workouts / maxWorkouts) * maxBarHeight : 0;
            const isBest = idx === bestMonth.month && workouts > 0;

            return (
              <div key={month} className="flex flex-col items-center gap-1 flex-1 max-w-[28px]">
                <div className="w-full flex items-end" style={{ height: `${maxBarHeight}px` }}>
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      isBest
                        ? isDark
                          ? `${accent.barDark} ${accent.glowDark}`
                          : accent.barLight
                        : isDark
                          ? 'bg-slate-600'
                          : 'bg-slate-400'
                    }`}
                    style={{ height: `${Math.max(heightPx, 6)}px` }}
                  />
                </div>
                <span className={`text-[9px] ${textSecondary}`}>{month[0]}</span>
              </div>
            );
          })}
        </div>

        <p className={`text-sm ${textSecondary}`}>
          On average, you trained{' '}
          <span className={`font-bold ${mainNumberColor}`}>{avgWorkouts} times</span>{' '}in active months
        </p>
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
