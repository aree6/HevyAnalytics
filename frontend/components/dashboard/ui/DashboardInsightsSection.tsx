import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { InsightsPanel, PlateauAlert, RecentPRsPanel } from '../../insights/InsightCards';
import { ActivityHeatmap } from './ActivityHeatmap';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { DailySummary } from '../../../types';

interface DashboardInsightsSectionProps {
  dashboardInsights: any;
  totalWorkouts: number;
  totalSets: number;
  totalPrs: number;
  weightUnit: WeightUnit;
  effectiveNow: Date;
  onExerciseClick?: (exerciseName: string) => void;
  onDayClick?: (date: Date) => void;
  activePlateauExercises: any[];
  assetsMap?: Map<string, any> | null;
  assetsLowerMap?: Map<string, any> | null;
  dailyData: DailySummary[];
  onAIAnalyze: () => void;
}

export const DashboardInsightsSection: React.FC<DashboardInsightsSectionProps> = ({
  dashboardInsights,
  totalWorkouts,
  totalSets,
  totalPrs,
  weightUnit,
  effectiveNow,
  onExerciseClick,
  onDayClick,
  activePlateauExercises,
  assetsMap,
  assetsLowerMap,
  dailyData,
  onAIAnalyze,
}) => (
  <>
    <InsightsPanel
      insights={dashboardInsights}
      totalWorkouts={totalWorkouts}
      totalSets={totalSets}
      totalPRs={totalPrs}
      onAIAnalyze={onAIAnalyze}
    />

    <RecentPRsPanel prInsights={dashboardInsights.prInsights} weightUnit={weightUnit} now={effectiveNow} onExerciseClick={onExerciseClick} />

    {activePlateauExercises.length > 0 && (
      <div className="bg-black/70 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-white">Plateaus</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
              {activePlateauExercises.length} {activePlateauExercises.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex gap-2">
            {activePlateauExercises.map((p) => (
              <div key={p.exerciseName} className="min-w-[280px] flex-shrink-0">
                <PlateauAlert
                  exerciseName={p.exerciseName}
                  suggestion={p.suggestion}
                  lastWeight={p.lastWeight}
                  lastReps={p.lastReps}
                  isBodyweightLike={p.isBodyweightLike}
                  asset={assetsMap?.get(p.exerciseName) || assetsLowerMap?.get(p.exerciseName.toLowerCase())}
                  weightUnit={weightUnit}
                  onClick={() => onExerciseClick?.(p.exerciseName)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <ActivityHeatmap
      dailyData={dailyData}
      streakInfo={dashboardInsights.streakInfo}
      consistencySparkline={dashboardInsights.consistencySparkline}
      onDayClick={onDayClick}
      now={effectiveNow}
    />
  </>
);
