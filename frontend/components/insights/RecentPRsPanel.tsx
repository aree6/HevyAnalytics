
import React, { memo, useEffect, useState } from 'react';

import { Trophy } from 'lucide-react';

import type { PRInsights } from '../../utils/analysis/insights';
import { getExerciseAssets, type ExerciseAsset } from '../../utils/data/exerciseAssets';
import type { WeightUnit } from '../../utils/storage/localStorage';
import { RecentPRCard } from './RecentPRCard';

// Recent PRs Timeline Panel
interface RecentPRsPanelProps {
  prInsights: PRInsights;
  weightUnit?: WeightUnit;
  now?: Date;
  onExerciseClick?: (exerciseName: string) => void;
}

export const RecentPRsPanel: React.FC<RecentPRsPanelProps> = memo(function RecentPRsPanel({ prInsights, weightUnit = 'kg', now, onExerciseClick }) {
  const { recentPRs, daysSinceLastPR, prDrought, prFrequency } = prInsights;
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset> | null>(null);

  useEffect(() => {
    getExerciseAssets().then(setAssetsMap).catch(() => setAssetsMap(new Map()));
  }, []);

  if (recentPRs.length === 0) return null;

  const displayPRs = recentPRs.slice(0, 5);

  return (
    <div className="bg-black/70 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-sm font-semibold text-white">Recent PRs</span>
        </div>
        <div className="flex items-center gap-3">
          {prFrequency > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
              ~{prFrequency}/week
            </span>
          )}
          {prDrought && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
              {daysSinceLastPR}d drought
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="flex gap-2" style={{ minWidth: 'min-content' }}>
          {displayPRs.map((pr, idx) => (
            <div key={`${pr.exercise}-${pr.date.getTime()}`} className="min-w-[220px] flex-shrink-0">
              <RecentPRCard
                pr={pr}
                isLatest={idx === 0}
                asset={assetsMap?.get(pr.exercise)}
                weightUnit={weightUnit}
                now={now}
                onExerciseClick={onExerciseClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

