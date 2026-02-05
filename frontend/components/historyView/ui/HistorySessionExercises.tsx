import React from 'react';
import type { ExerciseMuscleData } from '../../../utils/muscle/mapping';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { Session } from '../utils/historySessions';
import type { ExerciseBestEvent, ExerciseVolumePrEvent } from '../utils/historyViewTypes';
import { HistoryExerciseCard } from './HistoryExerciseCard';
import { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import type { TooltipState } from './HistoryTooltipPortal';

interface HistorySessionExercisesProps {
  session: Session;
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

export const HistorySessionExercises: React.FC<HistorySessionExercisesProps> = ({
  session,
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
  return (
    <div className="grid grid-cols-1 gap-2 sm:gap-2 animate-in fade-in duration-300">
      {session.exercises.map((group) => (
        <HistoryExerciseCard
          key={`${session.key}:${group.exerciseName}`}
          sessionKey={session.key}
          group={group}
          assetsMap={assetsMap}
          exerciseMuscleData={exerciseMuscleData}
          bodyMapGender={bodyMapGender}
          weightUnit={weightUnit}
          exerciseVolumeHistory={exerciseVolumeHistory}
          exerciseBests={exerciseBests}
          currentBests={currentBests}
          exerciseVolumePrBests={exerciseVolumePrBests}
          onExerciseClick={onExerciseClick}
          onTooltipToggle={onTooltipToggle}
          onMouseEnter={onMouseEnter}
          onClearTooltip={onClearTooltip}
          setTooltip={setTooltip}
        />
      ))}
    </div>
  );
};
