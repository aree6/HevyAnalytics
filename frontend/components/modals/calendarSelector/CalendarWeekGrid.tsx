import React from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { formatDayContraction } from '../../../utils/date/dateUtils';
import { DAY_HEADERS } from './calendarSelectorConstants';
import { CheckmarkIcon, PartialDot, StartEndTooltip } from './CalendarSelectorParts';
import type { SelectionStatus, Range } from './calendarSelectorTypes';

interface CalendarWeekGridProps {
  mode: 'day' | 'week' | 'both';
  multipleWeeks: boolean;
  weeks: Date[][];
  viewMonth: Date;
  today: Date;
  tooltipWeek: { start: Date; end: Date } | null;
  tooltipDay: Date | null;
  jumpHighlightDay: Date | null;
  hasSelection: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  weekHasData: (week: Date[]) => boolean;
  getWeekStatus: (week: Date[]) => SelectionStatus;
  isDisabled: (d: Date) => boolean;
  isValidGymDay: (d: Date) => boolean;
  isInRange: (d: Date) => boolean;
  isRangeEdge: (d: Date) => 'start' | 'end' | null;
  onWeekClick: (weekStart: Date) => void;
  onSetWeekStart: (weekStart: Date) => void;
  onSetWeekEnd: (weekStart: Date) => void;
  onSelectWeek?: (range: Range) => void;
  onDayClick: (day: Date) => void;
  onSetDayStart: (day: Date) => void;
  onSetDayEnd: (day: Date) => void;
}

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
  mode,
  multipleWeeks,
  weeks,
  viewMonth,
  today,
  tooltipWeek,
  tooltipDay,
  jumpHighlightDay,
  hasSelection,
  rangeStart,
  rangeEnd,
  weekHasData,
  getWeekStatus,
  isDisabled,
  isValidGymDay,
  isInRange,
  isRangeEdge,
  onWeekClick,
  onSetWeekStart,
  onSetWeekEnd,
  onSelectWeek,
  onDayClick,
  onSetDayStart,
  onSetDayEnd,
}) => (
  <>
    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
      {mode !== 'day' && (
        <div className={`${multipleWeeks ? 'w-6' : 'w-[72px]'} shrink-0 opacity-0`}>
          Wk
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-1">
      {weeks.map((week, weekIdx) => {
        const weekStart = week[0];
        const weekEnd = week[6];
        const enabledWeek = weekHasData(week);
        const weekStatus = getWeekStatus(week);
        const showWeekTooltip = tooltipWeek && isSameDay(tooltipWeek.start, weekStart);

        return (
          <div key={weekIdx} className={`flex items-center gap-1 ${weekStatus === 'full' ? 'rounded-md bg-white/5' : enabledWeek ? 'rounded-md bg-emerald-500/5' : ''}`}>
            {mode !== 'day' && (
              multipleWeeks ? (
                <div className="relative">
                  <button
                    className={`group flex items-center justify-center cursor-pointer shrink-0 w-6 h-6 rounded-md border-2 transition-all duration-200
                      ${!enabledWeek ? 'opacity-25 cursor-not-allowed border-slate-700 bg-slate-800' : ''}
                      ${weekStatus === 'full' ? 'border-slate-500/60 bg-white/10' : ''}
                      ${weekStatus === 'partial' ? 'border-slate-600/60 bg-white/5' : ''}
                      ${weekStatus === 'none' && enabledWeek ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 hover:scale-105' : ''}
                      ${showWeekTooltip ? '' : ''}
                    `}
                    onClick={() => enabledWeek && onWeekClick(weekStart)}
                    disabled={!enabledWeek}
                    title={`${formatDayContraction(weekStart)}–${formatDayContraction(weekEnd)}`}
                  >
                    {weekStatus === 'full' && <CheckmarkIcon className="w-3 h-3 text-white" />}
                    {weekStatus === 'partial' && <PartialDot />}
                  </button>
                  {showWeekTooltip && (
                    <StartEndTooltip
                      position="right"
                      onStart={(e) => { e.stopPropagation(); onSetWeekStart(weekStart); }}
                      onEnd={(e) => { e.stopPropagation(); onSetWeekEnd(weekStart); }}
                    />
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onSelectWeek && enabledWeek && onSelectWeek({ start: weekStart, end: weekEnd })}
                  className={`text-[9px] px-1.5 py-1 rounded border w-[72px] shrink-0 truncate ${
                    enabledWeek ? 'bg-black/70 hover:bg-black/60 border-slate-700/50' : 'bg-black/40 border-slate-700/50 opacity-25 cursor-not-allowed'
                  }`}
                  title={`${formatDayContraction(weekStart)}–${formatDayContraction(weekEnd)}`}
                >
                  {format(weekStart, 'M/d')}–{format(weekEnd, 'd')}
                </button>
              )
            )}

            <div className="grid grid-cols-7 gap-1 flex-1">
              {week.map((day) => {
                const disabled = isDisabled(day);
                const hasWorkout = isValidGymDay(day);
                const inMonth = isSameMonth(day, viewMonth);
                if (!inMonth) {
                  return (
                    <div key={day.toISOString()} className="w-full h-7" />
                  );
                }
                const inRange = isInRange(day);
                const edge = isRangeEdge(day);
                const isStart = edge === 'start';
                const isEnd = edge === 'end';
                const showDayTooltip = tooltipDay && isSameDay(tooltipDay, day);
                const isJumpTarget = jumpHighlightDay && isSameDay(jumpHighlightDay, day);
                const showEdgeLetter = hasSelection && rangeStart && rangeEnd && !isSameDay(rangeStart, rangeEnd) && (isStart || isEnd);

                return (
                  <div key={day.toISOString()} className="relative">
                    <button
                      onClick={() => mode !== 'week' && hasWorkout && onDayClick(day)}
                      disabled={disabled || !hasWorkout}
                      className={`relative w-full h-7 rounded flex items-center justify-center text-[11px] border-2 transition-colors
                        ${inRange
                          ? isStart || isEnd
                            ? 'border-sky-400/70 bg-sky-500/25 text-white font-bold shadow-md'
                            : 'border-sky-500/30 bg-sky-500/15 text-white font-medium'
                          : hasWorkout ? 'border-emerald-500/35 bg-emerald-500/12 text-slate-200 hover:bg-emerald-500/18' : 'border-slate-800/60 bg-black/40 text-slate-500'
                        }
                        ${disabled || !hasWorkout ? 'opacity-20 cursor-not-allowed' : ''}
                        ${isJumpTarget ? '' : ''}
                        ${showDayTooltip ? '' : ''}
                      `}
                    >
                      {showEdgeLetter ? (isStart ? 'S' : 'E') : format(day, 'd')}
                    </button>
                    {showDayTooltip && (
                      <StartEndTooltip
                        position={weekIdx < 2 ? 'bottom' : 'top'}
                        onStart={(e) => { e.stopPropagation(); onSetDayStart(day); }}
                        onEnd={(e) => { e.stopPropagation(); onSetDayEnd(day); }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="mt-1 mb-3 px-2 text-[11px] text-slate-400 text-center">
        Tap green elements to set filter limits
      </div>
    </div>
  </>
);
