import React from 'react';
import { Trophy } from 'lucide-react';
import { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { convertWeight } from '../../../utils/format/units';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import { FANCY_FONT } from '../../../utils/ui/uiConstants';
import { ExerciseThumbnail } from '../../common/ExerciseThumbnail';
import { Sparkline } from './HistorySparkline';
import type { GroupedExercise } from '../utils/historySessions';
import type { SetWisdom } from '../../../types';
import { getWisdomColor } from '../../../utils/analysis/masterAlgorithm';

interface HistoryExerciseHeaderProps {
  group: GroupedExercise;
  asset?: ExerciseAsset;
  macroInsight?: SetWisdom | null;
  sparklineData: number[];
  exerciseBest: number;
  weightUnit: WeightUnit;
  onExerciseClick?: (exerciseName: string) => void;
  onTooltipToggle: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onMouseEnter: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onClearTooltip: () => void;
}

export const HistoryExerciseHeader: React.FC<HistoryExerciseHeaderProps> = ({
  group,
  asset,
  macroInsight,
  sparklineData,
  exerciseBest,
  weightUnit,
  onExerciseClick,
  onTooltipToggle,
  onMouseEnter,
  onClearTooltip,
}) => {
  return (
    <div
      className="grid grid-cols-[2.5rem_1fr] grid-rows-2 gap-x-3 gap-y-1 mb-4 cursor-pointer select-none sm:flex sm:items-center sm:gap-3"
      onClick={() => onExerciseClick?.(group.exerciseName)}
      title="Open exercise details"
    >
      <ExerciseThumbnail
        asset={asset}
        className="w-10 h-10 rounded lg:rounded-md flex-shrink-0 row-span-2"
        imageClassName="w-full h-full rounded lg:rounded-md object-cover bg-white"
      />

      <div className="flex items-center gap-2 min-w-0 col-start-2 row-start-1">
        <h4
          className="text-slate-200 text-sm sm:text-lg line-clamp-1 min-w-0 flex-1"
          style={FANCY_FONT}
          title={group.exerciseName}
        >
          {group.exerciseName}
        </h4>

        {macroInsight && (
          <button
            type="button"
            onClick={(e) => onTooltipToggle(e, macroInsight, 'macro')}
            onMouseEnter={(e) => onMouseEnter(e, macroInsight, 'macro')}
            onMouseLeave={onClearTooltip}
            className={`p-1.5 rounded-lg cursor-help flex-shrink-0 ${getWisdomColor(macroInsight.type)} animate-in zoom-in duration-300`}
            aria-label={macroInsight.message}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      <div className="min-w-0 col-start-2 row-start-2 sm:flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-sm text-slate-400 overflow-visible">
          {sparklineData.length >= 2 && (
            <span className="inline-flex items-center opacity-70 pr-1" title="Volume trend (last 6 sessions)">
              <Sparkline data={sparklineData} width={62} height={20} />
            </span>
          )}
          <span className="text-slate-300">
            PR: <span className="font-semibold">{convertWeight(exerciseBest, weightUnit)}{weightUnit}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
