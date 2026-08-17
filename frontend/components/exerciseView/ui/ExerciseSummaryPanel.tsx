import React from 'react';
import { Reveal } from '../../ui/Reveal';
import { ExerciseStats } from '../../../types';
import { SEMI_FANCY_FONT } from '../../../utils/ui/uiConstants';
import type { ExerciseTrendCoreResult } from '../../../utils/analysis/exerciseTrend';
import { ExerciseEmptyState } from './ExerciseEmptyState';
import { ExerciseStatusCard } from './ExerciseStatusCard';
import type { StatusResult } from '../trend/exerciseTrendUi';
import type { InactiveReason } from '../utils/exerciseViewTypes';

interface ExerciseSummaryPanelProps {
  selectedStats: ExerciseStats | null | undefined;
  currentStatus: StatusResult | null | undefined;
  isSelectedEligible: boolean;
  inactiveReason: InactiveReason | null;
  currentCore: ExerciseTrendCoreResult | null;
  selectedPrematurePrTooltip: string | null;
}

export const ExerciseSummaryPanel: React.FC<ExerciseSummaryPanelProps> = ({
  selectedStats,
  currentStatus,
  isSelectedEligible,
  inactiveReason,
  currentCore,
  selectedPrematurePrTooltip,
}) => {
  if (!selectedStats || !currentStatus) {
    return <ExerciseEmptyState />;
  }

  return (
    <Reveal className="flex flex-col h-full gap-2">
      <div className="flex items-baseline gap-3">
        <h2
          className="text-xl sm:text-3xl text-white tracking-tight drop-shadow-lg"
          style={SEMI_FANCY_FONT}
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
    </Reveal>
  );
};
