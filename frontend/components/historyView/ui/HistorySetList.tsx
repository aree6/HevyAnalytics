import React from 'react';
import type { AnalysisResult } from '../../../types';
import { isWorkingSet } from '../../../utils/analysis/classification';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { GroupedExercise } from '../utils/historySessions';
import type { ExerciseBestEvent, ExerciseVolumePrEvent } from '../utils/historyViewTypes';
import { HistorySetRow } from './HistorySetRow';

interface HistorySetListProps {
  group: GroupedExercise;
  insights: AnalysisResult[];
  prEventsForSession: ExerciseBestEvent[];
  volPrEvent: ExerciseVolumePrEvent | null;
  volPrAnchorIndex: number;
  weightUnit: WeightUnit;
  onTooltipToggle: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onMouseEnter: (e: React.MouseEvent, data: any, variant: 'set' | 'macro') => void;
  onClearTooltip: () => void;
}

export const HistorySetList: React.FC<HistorySetListProps> = ({
  group,
  insights,
  prEventsForSession,
  volPrEvent,
  volPrAnchorIndex,
  weightUnit,
  onTooltipToggle,
  onMouseEnter,
  onClearTooltip,
}) => {
  let workingSetNumber = 0;

  return (
    <div className="relative flex-1 min-w-0 flex flex-col justify-center gap-2">
      {group.sets.map((set, sIdx) => {
        const isWorking = isWorkingSet(set);
        if (isWorking) workingSetNumber++;
        const workingSetIdx = group.sets.slice(0, sIdx).filter((s) => isWorkingSet(s)).length;
        const insight = isWorking && workingSetIdx > 0 ? insights[workingSetIdx - 1] : undefined;

        return (
          <HistorySetRow
            key={sIdx}
            set={set}
            setIndex={sIdx}
            weightUnit={weightUnit}
            insight={insight}
            workingSetNumber={workingSetNumber}
            isWorking={isWorking}
            prEventsForSession={prEventsForSession}
            volPrEvent={volPrEvent}
            volPrAnchorIndex={volPrAnchorIndex}
            onTooltipToggle={onTooltipToggle}
            onMouseEnter={onMouseEnter}
            onClearTooltip={onClearTooltip}
          />
        );
      })}
    </div>
  );
};
