import React from 'react';
import { ExerciseStats } from '../../../types';
import { FANCY_FONT } from '../../../utils/ui/uiConstants';
import type { ExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { ExerciseTrendCoreResult } from '../../../utils/analysis/exerciseTrend';
import { ExerciseEmptyState } from './ExerciseEmptyState';
import { ExerciseOverviewCard } from './ExerciseOverviewCard';
import { ExerciseStatusCard } from './ExerciseStatusCard';
import type { StatusResult } from '../trend/exerciseTrendUi';
import type { ExerciseMuscleTargets, InactiveReason } from '../utils/exerciseViewTypes';

interface ExerciseSummaryPanelProps {
  selectedStats: ExerciseStats | null | undefined;
  currentStatus: StatusResult | null | undefined;
  assetLookup: ExerciseAssetLookup | null;
  bodyMapGender: BodyMapGender;
  selectedExerciseMuscleInfo: ExerciseMuscleTargets;
  selectedExerciseHeadlessVolumes: Map<string, number>;
  selectedExerciseHeadlessMaxVolume: number;
  exerciseBodyMapHoverMeta: { name: string; role: string } | null;
  onBodyMapHover: (muscleId: string | null) => void;
  isSelectedEligible: boolean;
  inactiveReason: InactiveReason | null;
  currentCore: ExerciseTrendCoreResult | null;
  selectedPrematurePrTooltip: string | null;
}

export const ExerciseSummaryPanel: React.FC<ExerciseSummaryPanelProps> = ({
  selectedStats,
  currentStatus,
  assetLookup,
  bodyMapGender,
  selectedExerciseMuscleInfo,
  selectedExerciseHeadlessVolumes,
  selectedExerciseHeadlessMaxVolume,
  exerciseBodyMapHoverMeta,
  onBodyMapHover,
  isSelectedEligible,
  inactiveReason,
  currentCore,
  selectedPrematurePrTooltip,
}) => {
  if (!selectedStats || !currentStatus) {
    return <ExerciseEmptyState />;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <ExerciseOverviewCard
        selectedStats={selectedStats}
        assetLookup={assetLookup}
        bodyMapGender={bodyMapGender}
        selectedExerciseMuscleInfo={selectedExerciseMuscleInfo}
        selectedExerciseHeadlessVolumes={selectedExerciseHeadlessVolumes}
        selectedExerciseHeadlessMaxVolume={selectedExerciseHeadlessMaxVolume}
        exerciseBodyMapHoverMeta={exerciseBodyMapHoverMeta}
        onBodyMapHover={onBodyMapHover}
      />

      <div className="flex items-baseline gap-3">
        <h2
          className="text-xl sm:text-3xl text-white tracking-tight drop-shadow-lg"
          style={FANCY_FONT}
        >
          {selectedStats.name}
        </h2>
      </div>

      <ExerciseStatusCard
        currentStatus={currentStatus}
        currentCore={currentCore}
        isSelectedEligible={isSelectedEligible}
        inactiveReason={inactiveReason}
        selectedPrematurePrTooltip={selectedPrematurePrTooltip}
      />
    </div>
  );
};
