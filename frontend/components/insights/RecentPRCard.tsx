import React from 'react';

import { Dumbbell, TrendingUp } from 'lucide-react';

import type { RecentPR } from '../../utils/analysis/insights';
import type { ExerciseAsset } from '../../utils/data/exerciseAssets';
import type { WeightUnit } from '../../utils/storage/localStorage';
import { convertWeight } from '../../utils/format/units';
import { formatHumanReadableDate } from '../../utils/date/dateUtils';
import { ExerciseThumbnail } from '../common/ExerciseThumbnail';

// Recent PR Card with image and improvement
interface RecentPRCardProps {
  pr: RecentPR;
  isLatest?: boolean;
  asset?: ExerciseAsset;
  weightUnit?: WeightUnit;
  now?: Date;
  onExerciseClick?: (exerciseName: string) => void;
}

export const RecentPRCard: React.FC<RecentPRCardProps> = ({
  pr,
  isLatest,
  asset,
  weightUnit = 'kg',
  now,
  onExerciseClick,
}) => {
  const { exercise, weight, reps, date, improvement } = pr;
  const clickable = typeof onExerciseClick === 'function';

  return (
    <button
      type="button"
      onClick={() => onExerciseClick?.(exercise)}
      disabled={!clickable}
      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${isLatest ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-black/50'} ${clickable ? 'cursor-pointer border border-transparent hover:border-slate-600/40 transition-all' : 'cursor-default'}`}
    >
      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden">
        <ExerciseThumbnail
          asset={asset}
          className="w-full h-full"
          imageClassName="w-full h-full object-cover bg-white"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[color:var(--text-primary)] truncate">{exercise}</div>
        <div className="text-[10px] text-slate-500">{formatHumanReadableDate(date, { now })}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-[color:var(--text-primary)]">{convertWeight(weight, weightUnit)}{weightUnit}</div>
        {improvement > 0 ? (
          <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-0.5">
            <TrendingUp className="w-3 h-3" />+{convertWeight(improvement, weightUnit)}{weightUnit}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500">×{reps}</div>
        )}
      </div>
    </button>
  );
};
