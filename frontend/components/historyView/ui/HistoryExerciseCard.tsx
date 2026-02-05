import React from 'react';
import { analyzeProgression, analyzeSetProgression, isWarmupSet } from '../../../utils/analysis/masterAlgorithm';
import type { ExerciseMuscleData } from '../../../utils/muscle/mapping';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { GroupedExercise } from '../utils/historySessions';
import type { ExerciseBestEvent, ExerciseVolumePrEvent } from '../utils/historyViewTypes';
import { HistoryCardSkeleton } from './HistoryCardSkeleton';
import { HistoryExerciseHeader } from './HistoryExerciseHeader';
import { HistorySetList } from './HistorySetList';
import { HistoryExerciseHeatmap } from './HistoryExerciseHeatmap';
import { LazyRender } from '../../ui/LazyRender';
import { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import type { TooltipState } from './HistoryTooltipPortal';

interface HistoryExerciseCardProps {
  group: GroupedExercise;
  sessionKey: string;
  assetsMap: Map<string, ExerciseAsset> | null;
  exerciseMuscleData: Map<string, ExerciseMuscleData>;
  bodyMapGender: BodyMapGender;
  weightUnit: WeightUnit;
  exerciseVolumeHistory: Map<string, { date: Date; volume: number; sessionKey: string }[]>;
  exerciseBests: Map<string, ExerciseBestEvent[]>;
  currentBests: Map<string, number>;
  exerciseVolumePrBests: Map<string, ExerciseVolumePrEvent[]>;
  onExerciseClick?: (exerciseName: string) => void;
  onTooltipToggle: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onMouseEnter: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onClearTooltip: () => void;
  setTooltip: (state: TooltipState | null) => void;
}

export const HistoryExerciseCard: React.FC<HistoryExerciseCardProps> = ({
  group,
  sessionKey,
  assetsMap,
  exerciseMuscleData,
  bodyMapGender,
  weightUnit,
  exerciseVolumeHistory,
  exerciseBests,
  currentBests,
  exerciseVolumePrBests,
  onExerciseClick,
  onTooltipToggle,
  onMouseEnter,
  onClearTooltip,
  setTooltip,
}) => {
  const insights = analyzeSetProgression(group.sets);
  const macroInsight = analyzeProgression(group.sets);

  const exerciseBest = currentBests.get(group.exerciseName) || 0;
  const prEventsForSession = (exerciseBests.get(group.exerciseName) || []).filter((e) => e.sessionKey === sessionKey);

  const volPrEventsForSession = (exerciseVolumePrBests.get(group.exerciseName) || []).filter((e) => e.sessionKey === sessionKey);
  const volPrEvent = volPrEventsForSession.reduce(
    (best, e) => (!best || e.volume > best.volume ? e : best),
    null as ExerciseVolumePrEvent | null
  );

  const volHistory = exerciseVolumeHistory.get(group.exerciseName) || [];
  const sparklineData = volHistory.slice(0, 6).map((v) => v.volume).reverse();

  const volPrAnchorIndex = (() => {
    if (!volPrEvent) return -1;

    const idx = group.sets.findIndex(
      (s) =>
        !isWarmupSet(s) &&
        s.set_index === volPrEvent.setIndex &&
        s.weight_kg === volPrEvent.weight &&
        s.reps === volPrEvent.reps
    );
    if (idx >= 0) return idx;

    let bestIdx = -1;
    let bestVol = -Infinity;
    for (let i = 0; i < group.sets.length; i++) {
      const s = group.sets[i];
      if (isWarmupSet(s)) continue;
      const v = (s.weight_kg || 0) * (s.reps || 0);
      if (v > bestVol) {
        bestVol = v;
        bestIdx = i;
      }
    }
    return bestIdx;
  })();

  const asset = assetsMap?.get(group.exerciseName);

  return (
    <LazyRender
      className="w-full"
      placeholder={<HistoryCardSkeleton minHeight={260} />}
      rootMargin="400px 0px"
    >
      <div className="bg-black/70 border border-slate-700/50 rounded-2xl p-4 sm:p-5 transition-all flex flex-col h-full">
        <HistoryExerciseHeader
          group={group}
          asset={asset}
          macroInsight={macroInsight}
          sparklineData={sparklineData}
          exerciseBest={exerciseBest}
          weightUnit={weightUnit}
          onExerciseClick={onExerciseClick}
          onTooltipToggle={onTooltipToggle}
          onMouseEnter={onMouseEnter}
          onClearTooltip={onClearTooltip}
        />

        <div className="flex gap-4 flex-1 items-stretch">
          <HistorySetList
            group={group}
            insights={insights}
            prEventsForSession={prEventsForSession}
            volPrEvent={volPrEvent}
            volPrAnchorIndex={volPrAnchorIndex}
            weightUnit={weightUnit}
            onTooltipToggle={onTooltipToggle}
            onMouseEnter={onMouseEnter}
            onClearTooltip={onClearTooltip}
          />

          <HistoryExerciseHeatmap
            group={group}
            exerciseMuscleData={exerciseMuscleData}
            bodyMapGender={bodyMapGender}
            setTooltip={setTooltip}
          />
        </div>
      </div>
    </LazyRender>
  );
};
