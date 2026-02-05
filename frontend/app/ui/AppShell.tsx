import React from 'react';
import { AppHeader } from '../../components/app/AppHeader';
import { AppCalendarOverlay } from '../../components/app/AppCalendarOverlay';
import { AppTabContent } from '../../components/app/AppTabContent';
import type { Tab } from '../navigation/tabs';
import type { DailySummary, ExerciseStats, WorkoutSet } from '../../types';

interface AppShellProps {
  onboardingIntent: 'initial' | 'update' | null;
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  onOpenUpdateFlow: () => void;
  onOpenPreferences: () => void;
  calendarOpen: boolean;
  onToggleCalendarOpen: () => void;
  onCloseCalendar: () => void;
  hasActiveCalendarFilter: boolean;
  onClearCalendarFilter: () => void;
  calendarEffectiveNow: Date;
  selectedDay: Date | null;
  selectedRange: { start: Date; end: Date } | null;
  selectedWeeks: Array<{ start: Date; end: Date }>;
  minDate: Date | null;
  maxDate: Date | null;
  availableDatesSet: Set<string>;
  onSelectWeeks: (ranges: Array<{ start: Date; end: Date }>) => void;
  onSelectDay: (day: Date) => void;
  onSelectWeek: (range: { start: Date; end: Date }) => void;
  onSelectMonth: (range: { start: Date; end: Date }) => void;
  onSelectYear: (range: { start: Date; end: Date }) => void;
  onClearCalendar: () => void;
  onApplyCalendar: (payload: { range?: { start: Date; end: Date } | null }) => void;
  mainRef: React.RefObject<HTMLDivElement>;
  hasActiveFilters: boolean;
  dailySummaries: DailySummary[];
  exerciseStats: ExerciseStats[];
  filteredData: WorkoutSet[];
  filtersSlot: React.ReactNode;
  highlightedExercise: string | null;
  onHighlightApplied: () => void;
  onDayClick: (day: Date) => void;
  onMuscleClick: (muscleId: string, viewMode: 'muscle' | 'group' | 'headless') => void;
  onExerciseClick: (exerciseName: string) => void;
  onHistoryDayTitleClick: (date: Date) => void;
  targetHistoryDate: Date | null;
  onTargetHistoryDateConsumed: () => void;
  initialMuscleForAnalysis: string | null;
  initialWeeklySetsWindow: 'all' | '7d' | '30d' | '365d';
  onInitialMuscleConsumed: () => void;
  bodyMapGender: 'male' | 'female';
  weightUnit: 'kg' | 'lbs';
  exerciseTrendMode: 'stable' | 'reactive';
  now: Date;
}

export const AppShell: React.FC<AppShellProps> = ({
  onboardingIntent,
  activeTab,
  onSelectTab,
  onOpenUpdateFlow,
  onOpenPreferences,
  calendarOpen,
  onToggleCalendarOpen,
  onCloseCalendar,
  hasActiveCalendarFilter,
  onClearCalendarFilter,
  calendarEffectiveNow,
  selectedDay,
  selectedRange,
  selectedWeeks,
  minDate,
  maxDate,
  availableDatesSet,
  onSelectWeeks,
  onSelectDay,
  onSelectWeek,
  onSelectMonth,
  onSelectYear,
  onClearCalendar,
  onApplyCalendar,
  mainRef,
  hasActiveFilters,
  dailySummaries,
  exerciseStats,
  filteredData,
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
  if (onboardingIntent === 'initial') return null;

  return (
    <>
      <AppHeader
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenUpdateFlow={onOpenUpdateFlow}
        onOpenPreferences={onOpenPreferences}
        calendarOpen={calendarOpen}
        onToggleCalendarOpen={onToggleCalendarOpen}
        hasActiveCalendarFilter={hasActiveCalendarFilter}
        onClearCalendarFilter={onClearCalendarFilter}
      />

      {calendarOpen ? (
        <AppCalendarOverlay
          open={calendarOpen}
          onClose={onCloseCalendar}
          selectedDay={selectedDay}
          selectedRange={selectedRange}
          selectedWeeks={selectedWeeks}
          effectiveNow={calendarEffectiveNow}
          minDate={minDate}
          maxDate={maxDate}
          availableDatesSet={availableDatesSet}
          onSelectWeeks={onSelectWeeks}
          onSelectDay={onSelectDay}
          onSelectWeek={onSelectWeek}
          onSelectMonth={onSelectMonth}
          onSelectYear={onSelectYear}
          onClear={onClearCalendar}
          onApply={onApplyCalendar}
        />
      ) : null}

      <AppTabContent
        mainRef={mainRef}
        activeTab={activeTab}
        hasActiveCalendarFilter={hasActiveFilters}
        dailySummaries={dailySummaries}
        exerciseStats={exerciseStats}
        filteredData={filteredData}
        filtersSlot={filtersSlot}
        highlightedExercise={highlightedExercise}
        onHighlightApplied={onHighlightApplied}
        onDayClick={onDayClick}
        onMuscleClick={onMuscleClick}
        onExerciseClick={onExerciseClick}
        onHistoryDayTitleClick={onHistoryDayTitleClick}
        targetHistoryDate={targetHistoryDate}
        onTargetHistoryDateConsumed={onTargetHistoryDateConsumed}
        initialMuscleForAnalysis={initialMuscleForAnalysis}
        initialWeeklySetsWindow={initialWeeklySetsWindow}
        onInitialMuscleConsumed={onInitialMuscleConsumed}
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        exerciseTrendMode={exerciseTrendMode}
        now={now}
      />
    </>
  );
};
