import React from 'react';
import { Hourglass } from 'lucide-react';
import { ExerciseStats } from '../../../types';
import { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { formatRelativeTime } from '../../../utils/date/dateUtils';
import { getSelectedHighlightClasses } from '../utils/exerciseRowHighlight';
import { ExerciseThumbnail } from '../../common/ExerciseThumbnail';
import { capitalizeLabel } from '../utils/exerciseViewUtils';
import type { StatusResult } from '../trend/exerciseTrendUi';

interface ExerciseListRowProps {
  exercise: ExerciseStats;
  asset?: ExerciseAsset;
  status: StatusResult;
  isSelected: boolean;
  isEligible: boolean;
  inactiveLabel: string;
  lastDone: Date | null;
  effectiveNow: Date;
  onSelect: () => void;
  rowRef: (el: HTMLButtonElement | null) => void;
}

export const ExerciseListRow: React.FC<ExerciseListRowProps> = ({
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
}) => {
  const subLabel = isEligible ? status.label : inactiveLabel;
  const lastDoneLabel = lastDone ? formatRelativeTime(lastDone, effectiveNow) : '—';
  const selectedHighlight = getSelectedHighlightClasses(status.status, !isEligible ? 'soft' : 'strong');
  const RowStatusIcon = status.icon;
  const displayLabel = capitalizeLabel(subLabel);
  const IneligibleStatusIcon = displayLabel === 'New exercise' ? Hourglass : null;

  return (
    <button
      ref={rowRef}
      onClick={onSelect}
      className={`w-full text-left px-2 py-1.5 rounded-md transition-all duration-200 flex items-center justify-between group border ${isSelected
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
          <span className={`truncate text-xs ${isSelected ? 'text-slate-200 font-semibold' : 'text-slate-300 group-hover:text-white'}`}>
            {exercise.name}
          </span>
          <span className={`truncate text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
            {lastDoneLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isEligible ? (
          <div className={`px-1.5 py-1 rounded-md ${status.bgColor} ${isSelected ? 'animate-in zoom-in-50 duration-200' : ''} flex items-center gap-1`}>
            <RowStatusIcon className={`w-3 h-3 ${status.color}`} />
            <span className={`text-[10px] font-bold ${status.color}`}>{displayLabel}</span>
          </div>
        ) : (
          <div className={`px-1.5 py-1 rounded-md bg-slate-700/20 border border-slate-700/30 ${isSelected ? 'animate-in zoom-in-50 duration-200' : ''} flex items-center gap-1`}>
            {IneligibleStatusIcon ? (
              <IneligibleStatusIcon className="w-3 h-3 text-slate-400" />
            ) : null}
            <span className="text-[10px] font-bold text-slate-400">{displayLabel}</span>
          </div>
        )}
      </div>
    </button>
  );
};
