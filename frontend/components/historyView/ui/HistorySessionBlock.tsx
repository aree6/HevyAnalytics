import React from 'react';
import type { ExerciseMuscleData } from '../../../utils/muscle/mapping';
import { buildSessionMuscleHeatmap } from '../utils/muscleHeatmaps';
import { toHeadlessVolumeMap } from '../../../utils/muscle/mapping';
import type { Session } from '../utils/historySessions';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import { HistorySessionHeaderCard } from './HistorySessionHeaderCard';
import { HistorySessionExercises } from './HistorySessionExercises';
import { HistoryRestDivider } from './HistoryRestDivider';
import { formatRestDuration, formatWorkoutDuration, getSessionDurationMs, isSameCalendarDay } from '../utils/historyViewConstants';
import type { ExerciseBestEvent, ExerciseVolumePrEvent } from '../utils/historyViewTypes';
import type { TooltipState } from './HistoryTooltipPortal';
import { ExerciseAsset } from '../../../utils/data/exerciseAssets';

interface HistorySessionBlockProps {
  session: Session;
  index: number;
  currentSessions: Session[];
  sessions: Session[];
  collapsedSessions: Set<string>;
  setCollapsedSessions: React.Dispatch<React.SetStateAction<Set<string>>>;
  weightUnit: WeightUnit;
  bodyMapGender: BodyMapGender;
  exerciseMuscleData: Map<string, ExerciseMuscleData>;
  assetsMap: Map<string, ExerciseAsset> | null;
  effectiveNow: Date;
  isLightMode: boolean;
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

export const HistorySessionBlock: React.FC<HistorySessionBlockProps> = ({
  session,
  index,
  currentSessions,
  sessions,
  collapsedSessions,
  setCollapsedSessions,
  weightUnit,
  bodyMapGender,
  exerciseMuscleData,
  assetsMap,
  effectiveNow,
  isLightMode,
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
  const allSessionSets = session.exercises.flatMap((e) => e.sets);
  const sessionHeatmap = buildSessionMuscleHeatmap(allSessionSets, exerciseMuscleData);
  const sessionHeadlessVolumes = toHeadlessVolumeMap(sessionHeatmap.volumes);
  const sessionHeadlessMaxVolume = Math.max(1, ...(Array.from(sessionHeadlessVolumes.values()) as number[]));

  const isCollapsed = collapsedSessions.has(session.key);
  const sessionDurationMs = getSessionDurationMs(session);
  const sessionDurationText = sessionDurationMs != null ? formatWorkoutDuration(sessionDurationMs) : null;
  const exerciseCount = session.exercises.length;

  const previousDisplayedSession = index > 0 ? currentSessions[index - 1] : null;
  const restMs = previousDisplayedSession?.date && session.date
    ? previousDisplayedSession.date.getTime() - session.date.getTime()
    : null;
  const restText = restMs != null ? formatRestDuration(restMs) : null;
  const restIsDayBreak = !!(previousDisplayedSession?.date && session.date && !isSameCalendarDay(previousDisplayedSession.date, session.date));

  const sessionIdx = sessions.findIndex((s) => s.key === session.key);
  const prevSession = sessionIdx < sessions.length - 1 ? sessions[sessionIdx + 1] : null;

  const toggleCollapsed = () => {
    setCollapsedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(session.key)) next.delete(session.key);
      else next.add(session.key);
      return next;
    });
  };

  return (
    <React.Fragment key={session.key}>
      {index > 0 && restText && (
        <HistoryRestDivider restText={restText} isDayBreak={restIsDayBreak} />
      )}
      <div
        className="space-y-1 sm:space-y-2"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <HistorySessionHeaderCard
          session={session}
          effectiveNow={effectiveNow}
          weightUnit={weightUnit}
          exerciseCount={exerciseCount}
          sessionDurationText={sessionDurationText}
          prevSession={prevSession}
          isCollapsed={isCollapsed}
          isLightMode={isLightMode}
          sessionHeatmapHasData={sessionHeatmap.volumes.size > 0}
          sessionHeadlessVolumes={sessionHeadlessVolumes}
          sessionHeadlessMaxVolume={sessionHeadlessMaxVolume}
          bodyMapGender={bodyMapGender}
          setTooltip={setTooltip}
          toggleCollapsed={toggleCollapsed}
        />

        {!isCollapsed && (
          <HistorySessionExercises
            session={session}
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
        )}
      </div>
    </React.Fragment>
  );
};
