import React, { Suspense } from 'react';
import type { DailySummary, ExerciseStats, WorkoutSet } from '../../types';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import type { ExerciseTrendMode, WeightUnit } from '../../utils/storage/localStorage';
import { Tab } from '../../app/navigation';
import { SupportLinks } from '../layout/SupportLinks';

const Dashboard = React.lazy(() => import('../dashboard/ui/Dashboard').then((m) => ({ default: m.Dashboard })));
const ExerciseView = React.lazy(() => import('../exerciseView/ui/ExerciseView').then((m) => ({ default: m.ExerciseView })));
const HistoryView = React.lazy(() => import('../historyView/ui/HistoryView').then((m) => ({ default: m.HistoryView })));
const MuscleAnalysis = React.lazy(() => import('../muscleAnalysis/ui/MuscleAnalysis').then((m) => ({ default: m.MuscleAnalysis })));
const FlexView = React.lazy(() => import('../flexView/ui/FlexView').then((m) => ({ default: m.FlexView })));

type InitialMuscleForAnalysis = { muscleId: string; viewMode: 'muscle' | 'group' | 'headless' } | null;

type WeeklySetsWindow = 'all' | '7d' | '30d' | '365d';

type DateRange = { start: Date; end: Date };

interface AppTabContentProps {
  mainRef: React.RefObject<HTMLElement | null>;

  activeTab: Tab;
  hasActiveCalendarFilter: boolean;

  dailySummaries: DailySummary[];
  exerciseStats: ExerciseStats[];
  filteredData: WorkoutSet[];
  filterCacheKey: string;

  filtersSlot: React.ReactNode;

  highlightedExercise: string | null;
  onHighlightApplied: () => void;

  onDayClick: (date: Date) => void;
  onMuscleClick?: (
    muscleId: string,
    viewMode: 'muscle' | 'group' | 'headless',
    weeklySetsWindow: WeeklySetsWindow
  ) => void;
  onExerciseClick?: (exerciseName: string) => void;

  onHistoryDayTitleClick?: (date: Date) => void;
  targetHistoryDate: Date | null;
  onTargetHistoryDateConsumed: () => void;

  initialMuscleForAnalysis: InitialMuscleForAnalysis;
  initialWeeklySetsWindow: WeeklySetsWindow | null;
  onInitialMuscleConsumed: () => void;

  bodyMapGender: BodyMapGender;
  weightUnit: WeightUnit;
  exerciseTrendMode: ExerciseTrendMode;
  now: Date;
}

export const AppTabContent: React.FC<AppTabContentProps> = ({
  mainRef,
  activeTab,
  hasActiveCalendarFilter,
  dailySummaries,
  exerciseStats,
  filteredData,
  filterCacheKey,
  filtersSlot,
  highlightedExercise,
  onHighlightApplied,
  onDayClick,
  onMuscleClick,
  onExerciseClick,
  onHistoryDayTitleClick,
  targetHistoryDate,
  onTargetHistoryDateConsumed,
  initialMuscleForAnalysis,
  initialWeeklySetsWindow,
  onInitialMuscleConsumed,
  bodyMapGender,
  weightUnit,
  exerciseTrendMode,
  now,
}) => {
  return (
    <main
      ref={mainRef}
      className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-black/70 px-2 py-0 sm:px-3 sm:py-0 md:px-1 md:py-0 lg:px-2 lg:py-0"
    >
      <Suspense fallback={<div className="text-slate-400 p-4">Loading...</div>}>
        {activeTab === Tab.DASHBOARD && (
          <Dashboard
            dailyData={dailySummaries}
            exerciseStats={exerciseStats}
            fullData={filteredData}
            filterCacheKey={filterCacheKey}
            filtersSlot={filtersSlot}
            stickyHeader={hasActiveCalendarFilter}
            onDayClick={onDayClick}
            onMuscleClick={onMuscleClick}
            onExerciseClick={onExerciseClick}
            bodyMapGender={bodyMapGender}
            weightUnit={weightUnit}
            now={now}
          />
        )}
        {activeTab === Tab.EXERCISES && (
          <ExerciseView
            stats={exerciseStats}
            filtersSlot={filtersSlot}
            highlightedExercise={highlightedExercise}
            onHighlightApplied={onHighlightApplied}
            onExerciseClick={onExerciseClick}
            weightUnit={weightUnit}
            exerciseTrendMode={exerciseTrendMode}
            bodyMapGender={bodyMapGender}
            stickyHeader={hasActiveCalendarFilter}
            now={now}
          />
        )}
        {activeTab === Tab.HISTORY && (
          <HistoryView
            data={filteredData}
            filtersSlot={filtersSlot}
            weightUnit={weightUnit}
            bodyMapGender={bodyMapGender}
            stickyHeader={hasActiveCalendarFilter}
            onExerciseClick={onExerciseClick}
            onDayTitleClick={onHistoryDayTitleClick}
            targetDate={targetHistoryDate}
            onTargetDateConsumed={onTargetHistoryDateConsumed}
            now={now}
          />
        )}
        {activeTab === Tab.MUSCLE_ANALYSIS && (
          <MuscleAnalysis
            data={filteredData}
            filterCacheKey={filterCacheKey}
            filtersSlot={filtersSlot}
            onExerciseClick={onExerciseClick}
            initialMuscle={initialMuscleForAnalysis}
            initialWeeklySetsWindow={initialWeeklySetsWindow}
            onInitialMuscleConsumed={onInitialMuscleConsumed}
            bodyMapGender={bodyMapGender}
            stickyHeader={hasActiveCalendarFilter}
            now={now}
          />
        )}
        {activeTab === Tab.FLEX && (
          <FlexView
            data={filteredData}
            filtersSlot={filtersSlot}
            weightUnit={weightUnit}
            dailySummaries={dailySummaries}
            exerciseStats={exerciseStats}
            stickyHeader={hasActiveCalendarFilter}
            bodyMapGender={bodyMapGender}
            now={now}
          />
        )}
      </Suspense>

      <div className="hidden sm:block mt-8">
        <SupportLinks variant="secondary" layout="footer" />
      </div>

      <div className="sm:hidden pb-[calc(env(safe-area-inset-bottom)+1.5rem)] mt-8">
        <SupportLinks variant="all" layout="footer" />
      </div>
    </main>
  );
};
