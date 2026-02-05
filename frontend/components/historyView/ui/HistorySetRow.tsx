import React from 'react';
import { AlertTriangle, Info, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { AnalysisResult, WorkoutSet } from '../../../types';
import { getSetTypeConfig } from '../../../utils/analysis/classification';
import { convertWeight } from '../../../utils/format/units';
import { formatSignedNumber } from '../../../utils/format/formatters';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { ExerciseBestEvent, ExerciseVolumePrEvent } from '../utils/historyViewTypes';

interface HistorySetRowProps {
  set: WorkoutSet;
  setIndex: number;
  weightUnit: WeightUnit;
  insight?: AnalysisResult;
  workingSetNumber: number;
  isWorking: boolean;
  prEventsForSession: ExerciseBestEvent[];
  volPrEvent: ExerciseVolumePrEvent | null;
  volPrAnchorIndex: number;
  onTooltipToggle: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onMouseEnter: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onClearTooltip: () => void;
}

export const HistorySetRow: React.FC<HistorySetRowProps> = ({
  set,
  setIndex,
  weightUnit,
  insight,
  workingSetNumber,
  isWorking,
  prEventsForSession,
  volPrEvent,
  volPrAnchorIndex,
  onTooltipToggle,
  onMouseEnter,
  onClearTooltip,
}) => {
  const setConfig = getSetTypeConfig(set);

  let rowStatusClass = 'border-transparent';
  let dotClass = 'bg-black/50 border-slate-700';
  let isPrRow = false;

  const prDelta = (() => {
    if (!set.isPr || !set.parsedDate) return 0;
    const ev = prEventsForSession.find(
      (p) => p.date.getTime() === set.parsedDate!.getTime() && p.weight === set.weight_kg
    );
    if (!ev) return 0;
    const deltaKg = set.weight_kg - ev.previousBest;
    return deltaKg > 0 ? deltaKg : 0;
  })();

  if (set.isPr) {
    isPrRow = true;
    rowStatusClass = 'border-yellow-500/30';
    dotClass = 'bg-yellow-500 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
  } else if (insight?.status === 'danger') {
    rowStatusClass = 'bg-rose-500/5 border-rose-500/20';
    dotClass = 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
  } else if (insight?.status === 'success') {
    rowStatusClass = 'bg-emerald-500/5 border-emerald-500/20';
    dotClass = 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  } else if (insight?.status === 'warning') {
    rowStatusClass = 'bg-orange-500/5 border-orange-500/20';
    dotClass = 'bg-orange-500 border-orange-400';
  }

  const prShimmerStyle: React.CSSProperties = isPrRow ? {
    background: 'linear-gradient(90deg, transparent 0%, rgba(234,179,8,0.08) 25%, rgba(234,179,8,0.15) 50%, rgba(234,179,8,0.08) 75%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'prRowShimmer 3s ease-in-out infinite',
  } : {};

  return (
    <div
      className={`relative z-10 flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg border ${rowStatusClass} transition-all hover:bg-black/60 group overflow-visible`}
      style={prShimmerStyle}
    >
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold border-2 transition-all text-white ${set.isPr
          ? dotClass
          : isWorking && !setConfig.shortLabel
            ? dotClass
            : `${setConfig.bgColor} ${setConfig.borderColor}`
          }`}
        title={setConfig.description}
      >
        {setConfig.shortLabel || (isWorking ? workingSetNumber : '?')}
      </div>

      <div className="flex-1 flex justify-between items-center min-w-0">
        <div className="flex items-baseline gap-0.5 sm:gap-1 min-w-0">
          <span className="text-[clamp(12px,4.2vw,20px)] font-bold text-white tabular-nums tracking-tight">
            {convertWeight(set.weight_kg, weightUnit)}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{weightUnit}</span>
          <span className="text-slate-700 mx-0.5 sm:mx-1">×</span>
          <span className="text-[clamp(12px,4.2vw,20px)] font-bold text-slate-200 tabular-nums tracking-tight">
            {set.reps}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">reps</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-none pl-2">
          {(set.isPr || (volPrEvent && setIndex === volPrAnchorIndex)) && (
            <span className="flex items-center gap-1 px-1 py-0.5 bg-amber-200/70 text-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-400 rounded text-[7px] sm:text-[9px] font-bold uppercase tracking-wider border border-amber-300/80 dark:border-yellow-500/20 animate-pulse whitespace-nowrap leading-none">
              <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-none" />

              {set.isPr && (
                <span className="inline-flex items-center leading-none">
                  <span>PR</span>
                  {prDelta > 0 && (
                    <span className="ml-0.5 text-[5px] sm:text-[8px] font-extrabold text-yellow-500 leading-none">
                      {formatSignedNumber(convertWeight(prDelta, weightUnit), { maxDecimals: 2 })}{weightUnit}
                    </span>
                  )}
                </span>
              )}

              {volPrEvent && setIndex === volPrAnchorIndex && (
                <span
                  className="inline-flex items-center leading-none"
                  title="Volume PR (best-ever single-set volume)"
                  aria-label="Volume PR (best-ever single-set volume)"
                >
                  {set.isPr && <span className="hidden sm:inline text-slate-600 dark:text-slate-300 mx-1">·</span>}
                  <span>Vol PR</span>
                  {volPrEvent.previousBest > 0 && (
                    <span className="ml-0.5 text-[5px] sm:text-[8px] font-extrabold text-yellow-500 dark:text-yellow-300 leading-none">
                      {formatSignedNumber(((volPrEvent.volume - volPrEvent.previousBest) / volPrEvent.previousBest) * 100, { maxDecimals: 0 })}%
                    </span>
                  )}
                </span>
              )}
            </span>
          )}

          {insight && (
            <button
              type="button"
              onClick={(e) => onTooltipToggle(e, insight, 'set')}
              onMouseEnter={(e) => onMouseEnter(e, insight, 'set')}
              onMouseLeave={onClearTooltip}
              className="cursor-help flex items-center justify-center w-6 h-6 rounded hover:bg-black/60 transition-colors"
              aria-label={insight.shortMessage}
            >
              {insight.status === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              {insight.status === 'success' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
              {insight.status === 'warning' && <TrendingDown className="w-4 h-4 text-amber-500" />}
              {insight.status === 'info' && <Info className="w-4 h-4 text-blue-500" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
