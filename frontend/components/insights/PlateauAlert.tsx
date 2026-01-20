import React from 'react';

import { differenceInCalendarDays } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

import type { ExerciseAsset } from '../../utils/data/exerciseAssets';
import type { WeightUnit } from '../../utils/storage/localStorage';
import { convertWeight } from '../../utils/format/units';

// Compact Alert Card for Plateaus
interface PlateauAlertProps {
  exerciseName: string;
  suggestion: string;
  weeksAtSameWeight: number;
  currentMaxWeight: number;
  lastProgressDate: Date | null;
  lastWeight: number;
  lastReps: number;
  isBodyweightLike: boolean;
  asset?: ExerciseAsset;
  weightUnit?: WeightUnit;
  now?: Date;
  onClick?: () => void;
}

export const PlateauAlert: React.FC<PlateauAlertProps> = ({
  exerciseName,
  suggestion,
  weeksAtSameWeight,
  currentMaxWeight,
  lastProgressDate,
  lastWeight,
  lastReps,
  isBodyweightLike,
  asset,
  weightUnit = 'kg',
  now,
  onClick,
}) => {
  const imgSrc = asset?.sourceType === 'video' ? asset.thumbnail : (asset?.thumbnail || asset?.source);
  const clickable = typeof onClick === 'function';

  const formatTimeAgo = (date: Date, now: Date): string => {
    const diffDays = Math.abs(differenceInCalendarDays(now, date));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const formatProgressMessage = (date: Date, now: Date): string => {
    const timeAgo = formatTimeAgo(date, now);
    if (timeAgo === 'today') return 'No progress today';
    if (timeAgo === 'yesterday') return 'No progress since yesterday';
    return `No progress since ${timeAgo}`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left bg-amber-500/10 border border-amber-500/20 ${clickable ? 'cursor-pointer hover:bg-amber-500/15 transition-colors' : 'cursor-default'}`}
    >
      {imgSrc ? (
        <img src={imgSrc} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white" loading="lazy" />
      ) : (
        <div className="p-1.5 rounded-lg bg-amber-500/20 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{exerciseName}</div>
        <div className="text-[10px] text-slate-500">
          {lastProgressDate ? formatProgressMessage(lastProgressDate, now ?? lastProgressDate) : 'No recent progress'}
        </div>
        {suggestion && (
          <div className="text-[10px] text-amber-400 mt-1 line-clamp-2 flex items-start gap-1">
            <svg width="12" height="12" viewBox="0 0 48 48" version="1" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
              <path fill="#FBC02D" d="M37,22c0-7.7-6.6-13.8-14.5-12.9c-6,0.7-10.8,5.5-11.4,11.5c-0.5,4.6,1.4,8.7,4.6,11.3 c1.4,1.2,2.3,2.9,2.3,4.8V37h12v-0.1c0-1.8,0.8-3.6,2.2-4.8C35.1,29.7,37,26.1,37,22z" />
              <path fill="#FFF59D" d="M30.6,20.2l-3-2c-0.3-0.2-0.8-0.2-1.1,0L24,19.8l-2.4-1.6c-0.3-0.2-0.8-0.2-1.1,0l-3,2 c-0.2,0.2-0.4,0.4-0.4,0.7s0,0.6,0.2,0.8l3.8,4.7V37h2V26c0-0.2-0.1-0.4-0.2-0.6l-3.3-4.1l1.5-1l2.4,1.6c0.3,0.2,0.8,0.2,1.1,0 l2.4-1.6l1.5,1l-3.3,4.1C25.1,25.6,25,25.8,25,26v11h2V26.4l3.8-4.7c0.2-0.2,0.3-0.5,0.2-0.8S30.8,20.3,30.6,20.2z" />
              <circle fill="#5C6BC0" cx="24" cy="44" r="3" />
              <path fill="#9FA8DA" d="M26,45h-4c-2.2,0-4-1.8-4-4v-5h12v5C30,43.2,28.2,45,26,45z" />
              <g fill="#5C6BC0">
                <path d="M30,41l-11.6,1.6c0.3,0.7,0.9,1.4,1.6,1.8l9.4-1.3C29.8,42.5,30,41.8,30,41z" />
                <polygon points="18,38.7 18,40.7 30,39 30,37" />
              </g>
            </svg>
            <span>{suggestion}</span>
          </div>
        )}
      </div>
      <div className="text-right">
        {isBodyweightLike ? (
          <>
            <div className="text-sm font-bold text-white">{lastReps} reps</div>
            <div className="text-[10px] text-slate-500">Bodyweight</div>
          </>
        ) : (
          <>
            <div className="text-sm font-bold text-white">{convertWeight(lastWeight, weightUnit)}{weightUnit}</div>
            <div className="text-[10px] text-slate-500">×{lastReps} reps</div>
          </>
        )}
      </div>
    </button>
  );
};
