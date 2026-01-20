import React, { useMemo } from 'react';
import { WorkoutSet } from '../../types';
import { format, getDay, eachDayOfInterval, endOfMonth, getMonth, startOfMonth } from 'date-fns';
import CountUp from '../ui/CountUp';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../utils/ui/uiConstants';
import { isWarmupSet } from '../../utils/analysis/setClassification';
import { getSessionKey } from '../../utils/date/dateUtils';
import { MONTH_SHORT } from './constants';

// =========================================================================
// CARD: Yearly Heatmap Card - 12 month mini grids
// =========================================================================
export const YearlyHeatmapCard: React.FC<{
  data: WorkoutSet[];
  theme: CardTheme;
}> = ({ data, theme }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';

  const { selectedYear, effectiveNow, rangeStart, daySetCount, workoutsThisYear } = useMemo(() => {
    const dayCount = new Map<string, number>();
    const workoutSessionsByYear = new Map<number, Set<string>>();
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const s of data) {
      const d = s.parsedDate;
      if (!d) continue;
      if (!minDate || d.getTime() < minDate.getTime()) minDate = d;
      if (!maxDate || d.getTime() > maxDate.getTime()) maxDate = d;

      if (isWarmupSet(s)) continue;

      const key = format(d, 'yyyy-MM-dd');
      dayCount.set(key, (dayCount.get(key) || 0) + 1);

      const y = d.getFullYear();
      const sessionKey = getSessionKey(s);
      if (sessionKey) {
        if (!workoutSessionsByYear.has(y)) workoutSessionsByYear.set(y, new Set());
        workoutSessionsByYear.get(y)!.add(sessionKey);
      }
    }

    const effective = maxDate ?? new Date(0);
    const y = effective.getFullYear();
    const workouts = workoutSessionsByYear.get(y)?.size || 0;

    return {
      selectedYear: y,
      effectiveNow: effective,
      rangeStart: minDate || effective,
      daySetCount: dayCount,
      workoutsThisYear: workouts,
    };
  }, [data]);

  const getCellColor = (count: number) => {
    if (count === 0) return isDark ? 'bg-slate-800/50' : 'bg-slate-300/80';
    if (count <= 15) return 'bg-emerald-400';
    if (count <= 30) return 'bg-emerald-500';
    if (count <= 45) return 'bg-emerald-700';
    return 'bg-emerald-900';
  };

  const months = useMemo(() => {
    const out: { monthIndex: number; cells: (number | null)[]; rowCount: number }[] = [];

    const startMonthIndex = rangeStart.getFullYear() === selectedYear ? rangeStart.getMonth() : 0;
    const endMonthIndex = effectiveNow.getFullYear() === selectedYear ? effectiveNow.getMonth() : 11;

    for (let m = startMonthIndex; m <= endMonthIndex; m++) {
      const monthStart = startOfMonth(new Date(selectedYear, m, 1));
      const monthEnd = endOfMonth(monthStart);

      const visibleEnd =
        selectedYear === effectiveNow.getFullYear() && m === effectiveNow.getMonth()
          ? effectiveNow
          : monthEnd;

      const days = eachDayOfInterval({ start: monthStart, end: visibleEnd });
      const rowCount = Math.ceil(days.length / 7);
      const cells: (number | null)[] = new Array(rowCount * 7).fill(null);
      for (let i = 0; i < days.length; i++) {
        const key = format(days[i], 'yyyy-MM-dd');
        cells[i] = daySetCount.get(key) || 0;
      }

      out.push({ monthIndex: m, cells, rowCount });
    }

    return out;
  }, [daySetCount, effectiveNow, rangeStart, selectedYear]);

  const monthsCount = months.length;
  const isUltraDense = monthsCount >= 10;
  const monthColsForDensity = isUltraDense ? 4 : 3;
  const monthRows = Math.max(1, Math.ceil(monthsCount / monthColsForDensity));
  const isDense = monthRows >= 4;
  const isVeryDense = monthRows >= 5;

  const monthGridColsClass = isUltraDense ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-4' : 'grid-cols-3';
  const monthGridGapX = isUltraDense ? 'gap-x-2' : isVeryDense ? 'gap-x-2' : isDense ? 'gap-x-3' : 'gap-x-6';
  const monthGridGapY = isUltraDense ? 'gap-y-3' : isVeryDense ? 'gap-y-2' : isDense ? 'gap-y-3' : 'gap-y-6';
  const monthLabelClass = isUltraDense
    ? 'text-[10px] mb-0.5'
    : isVeryDense
      ? 'text-[10px] mb-0.5'
      : isDense
        ? 'text-xs mb-1'
        : 'text-sm mb-2';
  const cellGapClass = isUltraDense ? 'gap-0.5' : isVeryDense ? 'gap-0.5' : isDense ? 'gap-0.5' : 'gap-1';
  const headerGapClass = isDense ? 'mb-4' : 'mb-6';
  const contentPadClass = isDense ? 'pt-5 pb-12' : 'pt-6 pb-14';
  const monthGridMaxWClass = isUltraDense ? 'max-w-[80px] lg:max-w-[120px]' : isVeryDense ? 'max-w-[84px]' : isDense ? 'max-w-[96px]' : 'max-w-[120px]';
  const headlineCountClass = isUltraDense
    ? 'text-4xl sm:text-5xl'
    : isVeryDense
      ? 'text-4xl sm:text-5xl'
      : isDense
        ? 'text-5xl sm:text-6xl'
        : 'text-6xl sm:text-7xl';

  return (
    <FlexCard theme={theme} className="h-[500px] flex flex-col">
      <div className={`relative z-[1] px-4 sm:px-6 ${contentPadClass} flex flex-col items-center text-center flex-1`}>
        <div className="w-full flex items-start justify-between gap-3 mb-4">
          <div className="text-left">
            <div className={`text-xs font-semibold uppercase tracking-widest ${textMuted}`}>Highlights</div>
            <div className={`text-lg sm:text-xl font-bold ${textPrimary}`} style={FANCY_FONT}>
              {selectedYear}
            </div>
          </div>
        </div>

        <div className={`${headlineCountClass} font-black ${textPrimary} mb-1 leading-none`} style={FANCY_FONT_NUMBERS}>
          <CountUp from={0} to={workoutsThisYear} separator="," direction="up" duration={1} />
        </div>
        <div className={`text-base sm:text-lg ${textSecondary} ${headerGapClass}`}>
          Workouts this year
        </div>

        <div className={`w-full min-w-0 grid ${monthGridColsClass} ${monthGridGapX} ${monthGridGapY}`}>
          {months.map(({ monthIndex, cells, rowCount }) => (
            <div key={monthIndex} className={monthGridMaxWClass}>
              <div className={`text-center ${monthLabelClass} font-semibold ${textMuted}`}>
                {MONTH_SHORT[monthIndex]}
              </div>
              <div className={`grid grid-cols-7 ${cellGapClass} w-full ${monthGridMaxWClass}`}>
                {cells.map((count, idx) => {
                  if (count == null) {
                    return (
                      <div
                        key={idx}
                        className={`aspect-square w-full rounded-sm ${isDark ? 'bg-slate-800/20' : 'bg-slate-200/70'}`}
                      />
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className={`aspect-square w-full rounded-sm ${getCellColor(count)} transition-all duration-300 ${
                        count > 0
                          ? isDark
                            ? 'shadow-[0_0_18px_rgba(16,185,129,0.18)]'
                            : 'shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                          : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
