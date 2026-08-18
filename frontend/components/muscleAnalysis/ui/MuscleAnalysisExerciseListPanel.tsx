import React from 'react';
import { MuscleAnalysisExerciseList } from './MuscleAnalysisExerciseList';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import type { ExerciseMuscleData } from '../../../utils/muscle/mapping';
import type { MuscleVolumeThresholds } from '../../../utils/muscle/hypertrophy/muscleParams';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import { SEMI_FANCY_FONT } from '../../../utils/ui/uiConstants';
import { Reveal } from '../../ui/Reveal';

interface MuscleAnalysisExerciseListPanelProps {
  contributingExercises: Array<{ name: string; sets: number; primarySets: number; secondarySets: number; strengthTrend: number | null; strengthLabel: string | null }>;
  assetsMap: Map<string, ExerciseAsset> | null;
  exerciseMuscleData: Map<string, ExerciseMuscleData>;
  totalSetsInWindow: number;
  volumeThresholds: MuscleVolumeThresholds;
  onExerciseClick?: (exerciseName: string) => void;
  bodyMapGender?: BodyMapGender;
  secondarySetMultiplier: number;
  selectedMuscle?: string | null;
}

export const MuscleAnalysisExerciseListPanel: React.FC<MuscleAnalysisExerciseListPanelProps> = React.memo(({
  contributingExercises,
  assetsMap,
  exerciseMuscleData,
  totalSetsInWindow,
  volumeThresholds,
  onExerciseClick,
  bodyMapGender = 'male',
  secondarySetMultiplier,
  selectedMuscle,
}) => {
  const displayTitle = `Exercises for ${selectedMuscle ? selectedMuscle.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Full Body'}`;
  
  return (
    <Reveal className="bg-black/20 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col h-full min-h-0">
      <div className="bg-black/20  p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white" style={SEMI_FANCY_FONT}>{displayTitle}</span>
          <span className="text-xs text-slate-500">
            {contributingExercises.length} total
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <MuscleAnalysisExerciseList
          contributingExercises={contributingExercises}
          assetsMap={assetsMap}
          exerciseMuscleData={exerciseMuscleData}
          totalSetsInWindow={totalSetsInWindow}
          volumeThresholds={volumeThresholds}
          onExerciseClick={onExerciseClick}
          bodyMapGender={bodyMapGender}
          secondarySetMultiplier={secondarySetMultiplier}
        />
      </div>
    </Reveal>
  );
});

MuscleAnalysisExerciseListPanel.displayName = 'MuscleAnalysisExerciseListPanel';
