import React from 'react';
import { AnimatePresence } from 'motion/react';
import { AppHeader } from '../../components/app/AppHeader';
import { AppCalendarOverlay } from '../../components/app/AppCalendarOverlay';
import { AppTabContent } from '../../components/app/AppTabContent';
import { useHistoryTruncated } from '../state/historyTruncation';
import type { Tab } from '../navigation/tabs';
import type { DailySummary, ExerciseStats, WorkoutSet } from '../../types';

import type { OnboardingFlow } from '../onboarding/types';

interface AppShellProps {
  onboardingIntent: 'initial' | 'update' | null;
  onSetOnboarding: (next: OnboardingFlow | null) => void;
  activeTab: Tab;
  isTabPending?: boolean;
  pendingTab?: Tab | null;
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
  mainRef: React.RefObject<HTMLElement | null>;
  hasActiveFilters: boolean;
  dailySummaries: DailySummary[];
  exerciseStats: ExerciseStats[];
  parsedData: WorkoutSet[];
  filteredData: WorkoutSet[];
  filterCacheKey: string;
  filtersSlot: React.ReactNode;
  highlightedExercise: string | null;
  onHighlightApplied: () => void;
  onDayClick: (day: Date) => void;
  onMuscleClick?: (muscleId: string, weeklySetsWindow?: 'all' | '7d' | '30d' | '365d') => void;
  onExerciseClick: (exerciseName: string) => void;
  onHistoryDayTitleClick: (date: Date) => void;
  targetHistoryDate: Date | null;
  onTargetHistoryDateConsumed: () => void;
  initialMuscleForAnalysis: { muscleId: string } | null;
  initialWeeklySetsWindow: 'all' | '7d' | '30d' | '365d' | null;
  onInitialMuscleConsumed: () => void;
  bodyMapGender: 'male' | 'female';
  weightUnit: 'kg' | 'lbs';
  exerciseTrendMode: 'stable' | 'reactive';
  secondarySetMultiplier: number;
  now: Date;
}

export const AppShell: React.FC<AppShellProps> = ({  onboardingIntent,
  onSetOnboarding,
  activeTab,
  isTabPending = false,
  pendingTab = null,
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
  parsedData,
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
  secondarySetMultiplier,
  now,
}) => {
  const isHistoryTruncated = useHistoryTruncated();
  if (onboardingIntent === 'initial') return null;

  return (
    <>
      <AppHeader
        onSetOnboarding={onSetOnboarding}
        activeTab={activeTab}
        isTabPending={isTabPending}
        pendingTab={pendingTab}
        onSelectTab={onSelectTab}
        onOpenUpdateFlow={onOpenUpdateFlow}
        onOpenPreferences={onOpenPreferences}
        calendarOpen={calendarOpen}
        onToggleCalendarOpen={onToggleCalendarOpen}
        hasActiveCalendarFilter={hasActiveCalendarFilter}
        onClearCalendarFilter={onClearCalendarFilter}
      />

      {isHistoryTruncated ? (
        <div className="px-2 sm:px-3 pt-1" role="status" aria-live="polite">
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] sm:text-xs text-amber-200">
            Showing newest history only — early workouts were capped by the source API. Lifetime totals, PRs, and streaks reflect partial history.
          </div>
        </div>
      ) : null}

      <AnimatePresence>
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
      </AnimatePresence>

      <AppTabContent
        mainRef={mainRef}
        activeTab={activeTab}
        isTabPending={isTabPending}
        hasActiveCalendarFilter={hasActiveFilters}
        dailySummaries={dailySummaries}
        exerciseStats={exerciseStats}
        parsedData={parsedData}
        filteredData={filteredData}
        filterCacheKey={filterCacheKey}
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
        secondarySetMultiplier={secondarySetMultiplier}
        now={now}
      />
    </>
  );
};
