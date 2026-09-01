import React from 'react';
import { Hourglass } from 'lucide-react';
import { ExerciseStats } from '../../../types';
import { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { formatRelativeTime } from '../../../utils/date/dateUtils';
import { getSelectedHighlightClasses } from '../utils/exerciseRowHighlight';
import { ExerciseThumbnail } from '../../common/ExerciseThumbnail';
import { capitalizeLabel } from '../utils/exerciseViewUtils';
import type { StatusResult } from '../trend/exerciseTrendUi';
import { getLoadProgressionDirection } from '../../../utils/exercise/loadProgression';
import { SEMI_FANCY_FONT } from '../../../utils/ui/uiConstants';

interface ExerciseListRowProps {
  exercise: ExerciseStats;
  asset?: ExerciseAsset;
  status: StatusResult;
  isSelected: boolean;
  isEligible: boolean;
  inactiveLabel: string;
  lastDone: Date | null;
  effectiveNow: Date;
  onSelect: (exerciseName: string) => void;
  rowRef: (el: HTMLButtonElement | null) => void;
}

// Memoized: the list re-renders per keystroke/filter change, and rows are
// otherwise identical. Props must stay referentially stable (see panel:
// stable onSelect/rowRef) for this to skip work.
export const ExerciseListRow: React.FC<ExerciseListRowProps> = React.memo(function ExerciseListRow({
  exercise,
  asset,
  status,
  isSelected,
  isEligible,
  inactiveLabel,
  lastDone,
  effectiveNow,
  onSelect,
  rowRef,
}) {
  const subLabel = isEligible ? status.label : inactiveLabel;
  const lastDoneLabel = lastDone ? formatRelativeTime(lastDone, effectiveNow) : '—';
  const selectedHighlight = getSelectedHighlightClasses(status.status, !isEligible ? 'soft' : 'strong');
  const RowStatusIcon = status.icon;
  const isLowerWeightBetter = getLoadProgressionDirection(exercise.name) === 'lower';
  const trendLabel = isLowerWeightBetter
    ? subLabel.replace(/\bgaining\b/i, 'easier loading').replace(/\blosing\b/i, 'harder loading')
    : subLabel;
  const displayLabel = capitalizeLabel(trendLabel);
  const IneligibleStatusIcon = displayLabel === 'New exercise' ? Hourglass : null;

  return (
    <button
      ref={rowRef}
      data-exercise-name={exercise.name}
      onClick={(e) => {
        e.preventDefault();
        e.currentTarget.blur();
        onSelect(exercise.name);
      }}
      className={`w-full text-left px-2 py-1.5 rounded-md transition-colors duration-200 flex items-center justify-between group border cursor-pointer [content-visibility:auto] [contain-intrinsic-size:auto_72px] print:[content-visibility:visible] ${isSelected
        ? selectedHighlight.button
        : 'border-transparent hover:bg-black/60 hover:border-slate-600/50'
        } ${!isEligible ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16">
          <ExerciseThumbnail
            asset={asset}
            className="w-full h-full rounded-md"
            imageClassName="flex-shrink-0 w-full h-full rounded-md object-cover bg-white"
          />
        </div>
        <div className="flex flex-col min-w-0 h-12 sm:h-16 justify-between py-1">
          <span className={`truncate text-xs ${isSelected ? 'text-slate-200 font-semibold' : 'text-slate-300 group-hover:text-white'}`} style={SEMI_FANCY_FONT}>
            {exercise.name}
          </span>
          <span className={`truncate text-[10px] sm:text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
            {lastDoneLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isEligible ? (
          <div className={`px-2 py-0.5 rounded-full ${status.bgColor} border ${status.borderColor} flex items-center gap-1`}>
            <RowStatusIcon className={`w-2.5 h-2.5 ${status.color}`} />
            <span className={`text-[9px] sm:text-xs font-semibold ${status.color}`}>{displayLabel}</span>
            {status.diffPct !== undefined && (
              <span className={`text-[9px] sm:text-[10px] font-semibold font-mono ${status.diffPct > 0 ? 'text-emerald-400' : status.diffPct < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                @ {status.diffPct > 0 ? '+' : ''}{status.diffPct.toFixed(1)}%
              </span>
            )}
          </div>
        ) : (
          <div className={`px-2 py-0.5 rounded-full bg-slate-700/15 border border-slate-600/20 flex items-center gap-1`}>
            {IneligibleStatusIcon ? (
              <IneligibleStatusIcon className="w-2.5 h-2.5 text-slate-400" />
            ) : null}
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">{displayLabel}</span>
          </div>
        )}
      </div>
    </button>
  );
});
