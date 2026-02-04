import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDailySummaries, getExerciseStats, identifyPersonalRecords } from './utils/analysis/analytics';
import { computationCache } from './utils/storage/computationCache';
import { WorkoutSet } from './types';
import { Tab } from './app/tabs';
import { AppHeader } from './components/app/AppHeader';
import { AppCalendarOverlay } from './components/app/AppCalendarOverlay';
import { AppLoadingOverlay } from './components/app/AppLoadingOverlay';
import { AppTabContent } from './components/app/AppTabContent';
import { AppOnboardingLayer } from './components/app/AppOnboardingLayer';
import { UserPreferencesModal } from './components/modals/UserPreferencesModal';
import type { OnboardingFlow } from './app/onboarding/types';
import { X, Calendar, Pencil } from 'lucide-react';
import { getEffectiveNowFromWorkoutData } from './utils/date/dateUtils';
import { getDataAgeInfo } from './hooks/usePreferences';
import { trackPageView } from './utils/integrations/ga';
import { setContext, trackEvent } from './utils/integrations/analytics';
import {
  getDataSourceChoice,
  saveDataSourceChoice,
  getSetupComplete,
  saveSetupComplete,
} from './utils/storage/dataSourceStorage';
import { getPreferencesConfirmed } from './utils/storage/localStorage';
import { clearCacheAndRestart as clearCacheAndRestartNow } from './app/clearCacheAndRestart';
import { usePrefetchHeavyViews } from './app/usePrefetchHeavyViews';
import { useStartupAutoLoad } from './app/useStartupAutoLoad';
import { usePlatformDeepLink } from './app/usePlatformDeepLink';
import { useAppAuth } from './hooks/useAppAuth';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppCalendarFilters } from './hooks/useAppCalendarFilters';
import { useAppPreferences } from './hooks/useAppPreferences';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Core data state
  const [parsedData, setParsedData] = useState<WorkoutSet[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingFlow | null>(() => {
    return getSetupComplete() ? null : { intent: 'initial', step: 'platform' };
  });
  const [dataSource, setDataSource] = useState(() => getDataSourceChoice());
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  // Hooks
  const {
    mode,
    setMode,
    weightUnit,
    setWeightUnit,
    bodyMapGender,
    setBodyMapGender,
    dateMode,
    setDateMode,
    exerciseTrendMode,
    setExerciseTrendMode,
    heatmapTheme,
    setHeatmapTheme,
  } = useAppPreferences();

  const {
    activeTab,
    highlightedExercise,
    initialMuscleForAnalysis,
    initialWeeklySetsWindow,
    targetHistoryDate,
    mainRef,
    handleExerciseClick,
    handleMuscleClick,
    handleDayClick,
    handleTargetDateConsumed,
    handleSelectTab,
    clearHighlightedExercise,
    clearInitialMuscleForAnalysis,
  } = useAppNavigation();

  const {
    selectedMonth,
    selectedDay,
    selectedRange,
    selectedWeeks,
    calendarOpen,
    availableMonths,
    filteredData,
    hasActiveCalendarFilter,
    calendarSummaryText,
    minDate,
    maxDate,
    availableDatesSet,
    filterCacheKey,
    setSelectedMonth,
    setSelectedDay,
    setSelectedRange,
    setSelectedWeeks,
    setCalendarOpen,
    toggleCalendarOpen,
    clearAllFilters,
  } = useAppCalendarFilters({
    parsedData,
    effectiveNow: useMemo(() => {
      const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
      return dateMode === 'actual' ? new Date() : dataBasedNow;
    }, [parsedData, dateMode]),
  });

  const {
    hevyLoginError,
    lyfatLoginError,
    csvImportError,
    loadingKind,
    isAnalyzing,
    loadingStep,
    progress,
    handleHevySyncSaved,
    handleHevyApiKeyLogin,
    handleHevyLogin,
    handleLyfatSyncSaved,
    handleLyfatLogin,
    processFile,
    clearHevyLoginError,
    clearLyfatLoginError,
    clearCsvImportError,
  } = useAppAuth({
    weightUnit,
    setParsedData,
    setDataSource,
    setOnboarding,
    setSelectedMonth,
    setSelectedDay,
  });

  // Platform deep linking
  const platformQueryConsumedRef = { current: false };
  usePlatformDeepLink({
    location,
    navigate,
    setOnboarding,
    platformQueryConsumedRef,
  });

  // Effects
  useEffect(() => {
    setContext({ app_shell: onboarding?.intent === 'initial' ? 'landing' : 'app' });
  }, [onboarding?.intent]);

  useEffect(() => {
    trackEvent('app_open', {
      path: `${window.location.pathname || '/'}${window.location.search || ''}`,
    });
  }, []);

  useEffect(() => {
    const isShell = onboarding?.intent !== 'initial';
    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = (body.style as any).overscrollBehavior;
    const prevHtmlOverscroll = (html.style as any).overscrollBehavior;

    if (isShell) {
      body.style.overflow = 'hidden';
      (body.style as any).overscrollBehavior = 'none';
      (html.style as any).overscrollBehavior = 'none';
    } else {
      body.style.overflow = '';
      (body.style as any).overscrollBehavior = '';
      (html.style as any).overscrollBehavior = '';
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      (body.style as any).overscrollBehavior = prevBodyOverscroll;
      (html.style as any).overscrollBehavior = prevHtmlOverscroll;
    };
  }, [onboarding?.intent]);

  useEffect(() => {
    if (!dataSource) return;
    saveDataSourceChoice(dataSource);
    setContext({ data_source: dataSource });
  }, [dataSource]);

  usePrefetchHeavyViews();

  useEffect(() => {
    trackPageView(`${window.location.pathname || '/'}${window.location.search || ''}`);
  }, [location.pathname, location.search]);

  useStartupAutoLoad({
    setOnboarding,
    setDataSource,
    setParsedData,
    setHevyLoginError: clearHevyLoginError,
    setLyfatLoginError: clearLyfatLoginError,
    setCsvImportError: clearCsvImportError,
    setIsAnalyzing: () => {},
    setLoadingStep: () => {},
    setLoadingKind: () => {},
    startProgress: () => 0,
    finishProgress: () => {},
  });

  // Data computations
  const filteredEffectiveNow = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(filteredData, new Date(0));
    return dateMode === 'actual' ? new Date() : dataBasedNow;
  }, [filteredData, dateMode]);

  const dataAgeInfo = useMemo(() => {
    const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
    return getDataAgeInfo(dataBasedNow);
  }, [parsedData]);

  const dailySummaries = useMemo(() => {
    const cacheKey = `dailySummaries:${filterCacheKey}`;
    return computationCache.getOrCompute(
      cacheKey,
      filteredData,
      () => getDailySummaries(filteredData),
      { ttl: 10 * 60 * 1000 }
    );
  }, [filteredData, filterCacheKey]);

  const exerciseStats = useMemo(() => {
    const cacheKey = `exerciseStats:${filterCacheKey}`;
    return computationCache.getOrCompute(
      cacheKey,
      filteredData,
      () => getExerciseStats(filteredData),
      { ttl: 10 * 60 * 1000 }
    );
  }, [filteredData, filterCacheKey]);

  // Filter controls UI
  const filterControls = (
    <div
      className={`relative flex items-center gap-2 rounded-lg px-3 py-2 h-10 shadow-sm transition-all duration-300 ${hasActiveCalendarFilter
        ? 'bg-black/70 border border-slate-600/60'
        : 'bg-black/70 border border-slate-700/50'
        }`}
    >
      <div className="flex-1 min-w-0 overflow-x-auto">
        <div className="flex items-center gap-2 flex-nowrap min-w-max">
          {hasActiveCalendarFilter ? (
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
              title={calendarSummaryText}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300/80" />
              <span className="max-w-[220px] truncate">{calendarSummaryText}</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 whitespace-nowrap">No filter</span>
          )}
        </div>
      </div>

      {hasActiveCalendarFilter ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 transition-colors"
            title="Edit filter"
            aria-label="Edit filter"
          >
            <Pencil className="w-4 h-4 text-slate-300" />
          </button>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 transition-colors"
            title="Clear filter"
            aria-label="Clear filter"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      ) : (
        <button
          onClick={toggleCalendarOpen}
          className="inline-flex items-center gap-2 h-8 px-2 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors"
        >
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Calendar</span>
        </button>
      )}
    </div>
  );

  const desktopFilterControls = (
    <div className="hidden sm:block">
      {filterControls}
    </div>
  );

  // Handlers
  const clearCacheAndRestart = useCallback(() => {
    clearCacheAndRestartNow();
  }, []);

  const handleHistoryDayTitleClick = useCallback((date: Date) => {
    setSelectedDay(date);
    setSelectedRange(null);
    setSelectedWeeks([]);
    setSelectedMonth('all');
    // Navigate to muscle analysis
    handleSelectTab(Tab.MUSCLE_ANALYSIS);
  }, [setSelectedDay, setSelectedRange, setSelectedWeeks, setSelectedMonth, handleSelectTab]);

  const handleOpenUpdateFlow = useCallback(() => {
    trackEvent('update_flow_open', { data_source: dataSource ?? 'unknown' });
    clearCsvImportError();
    clearHevyLoginError();
    clearLyfatLoginError();
    
    if (dataSource === 'strong') {
      setOnboarding({ intent: 'update', step: 'strong_prefs', platform: 'strong' });
      return;
    }
    if (dataSource === 'lyfta') {
      if (!getPreferencesConfirmed()) {
        setOnboarding({ intent: 'update', step: 'lyfta_prefs', platform: 'lyfta' });
        return;
      }
      setOnboarding({ intent: 'update', step: 'lyfta_login', platform: 'lyfta' });
      return;
    }
    if (dataSource === 'hevy') {
      if (!getPreferencesConfirmed()) {
        setOnboarding({ intent: 'update', step: 'hevy_prefs', platform: 'hevy' });
        return;
      }
      setOnboarding({ intent: 'update', step: 'hevy_login', platform: 'hevy' });
      return;
    }
    if (dataSource === 'other') {
      if (!getPreferencesConfirmed()) {
        setOnboarding({ intent: 'update', step: 'other_prefs', platform: 'other' });
        return;
      }
      setOnboarding({ intent: 'update', step: 'other_csv', platform: 'other', backStep: 'other_prefs' });
      return;
    }
    setOnboarding({ intent: 'update', step: 'platform' });
  }, [dataSource, clearCsvImportError, clearHevyLoginError, clearLyfatLoginError, setOnboarding]);

  return (
    <div
      className="flex flex-col min-h-[100svh] h-[100dvh] overscroll-none bg-transparent text-[color:var(--app-fg)] font-sans"
      style={{ background: 'var(--app-bg)' }}
    >
      {onboarding?.intent === 'initial' ? null : (
        <>
          <AppHeader
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onOpenUpdateFlow={handleOpenUpdateFlow}
            onOpenPreferences={() => setPreferencesModalOpen(true)}
            calendarOpen={calendarOpen}
            onToggleCalendarOpen={toggleCalendarOpen}
            hasActiveCalendarFilter={hasActiveCalendarFilter}
            onClearCalendarFilter={clearAllFilters}
          />

          {calendarOpen && (
            <AppCalendarOverlay
              open={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              selectedDay={selectedDay}
              selectedRange={selectedRange}
              selectedWeeks={selectedWeeks}
              effectiveNow={useMemo(() => {
                const dataBasedNow = getEffectiveNowFromWorkoutData(parsedData, new Date(0));
                return dateMode === 'actual' ? new Date() : dataBasedNow;
              }, [parsedData, dateMode])}
              minDate={minDate}
              maxDate={maxDate}
              availableDatesSet={availableDatesSet}
              onSelectWeeks={(ranges) => {
                setSelectedWeeks(ranges);
                setSelectedDay(null);
                setSelectedRange(null);
                setCalendarOpen(false);
              }}
              onSelectDay={(d) => {
                setSelectedDay(d);
                setSelectedWeeks([]);
                setSelectedRange(null);
                setCalendarOpen(false);
              }}
              onSelectWeek={(r) => {
                setSelectedWeeks([r]);
                setSelectedDay(null);
                setSelectedRange(null);
                setCalendarOpen(false);
              }}
              onSelectMonth={(r) => {
                setSelectedRange(r);
                setSelectedDay(null);
                setSelectedWeeks([]);
                setCalendarOpen(false);
              }}
              onSelectYear={(r) => {
                setSelectedRange(r);
                setSelectedDay(null);
                setSelectedWeeks([]);
                setCalendarOpen(false);
              }}
              onClear={clearAllFilters}
              onApply={({ range }) => {
                if (range) {
                  setSelectedRange(range);
                  setSelectedDay(null);
                  setSelectedWeeks([]);
                }
                setCalendarOpen(false);
              }}
            />
          )}

          <AppTabContent
            mainRef={mainRef}
            activeTab={activeTab}
            hasActiveCalendarFilter={hasActiveCalendarFilter}
            dailySummaries={dailySummaries}
            exerciseStats={exerciseStats}
            filteredData={filteredData}
            filtersSlot={desktopFilterControls}
            highlightedExercise={highlightedExercise}
            onHighlightApplied={clearHighlightedExercise}
            onDayClick={handleDayClick}
            onMuscleClick={handleMuscleClick}
            onExerciseClick={handleExerciseClick}
            onHistoryDayTitleClick={handleHistoryDayTitleClick}
            targetHistoryDate={targetHistoryDate}
            onTargetHistoryDateConsumed={handleTargetDateConsumed}
            initialMuscleForAnalysis={initialMuscleForAnalysis}
            initialWeeklySetsWindow={initialWeeklySetsWindow}
            onInitialMuscleConsumed={clearInitialMuscleForAnalysis}
            bodyMapGender={bodyMapGender}
            weightUnit={weightUnit}
            exerciseTrendMode={exerciseTrendMode}
            now={filteredEffectiveNow}
          />
        </>
      )}

      <UserPreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
        bodyMapGender={bodyMapGender}
        onBodyMapGenderChange={setBodyMapGender}
        themeMode={mode}
        onThemeModeChange={setMode}
        heatmapTheme={heatmapTheme}
        onHeatmapThemeChange={setHeatmapTheme}
        dateMode={dateMode}
        onDateModeChange={setDateMode}
        exerciseTrendMode={exerciseTrendMode}
        onExerciseTrendModeChange={setExerciseTrendMode}
        dataAgeInfo={dataAgeInfo}
      />

      <AppOnboardingLayer
        onboarding={onboarding}
        dataSource={dataSource}
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        csvImportError={csvImportError}
        hevyLoginError={hevyLoginError}
        lyfatLoginError={lyfatLoginError}
        onSetOnboarding={(next) => setOnboarding(next)}
        onSetBodyMapGender={setBodyMapGender}
        onSetWeightUnit={setWeightUnit}
        onSetCsvImportError={clearCsvImportError}
        onSetHevyLoginError={clearHevyLoginError}
        onSetLyfatLoginError={clearLyfatLoginError}
        onClearCacheAndRestart={clearCacheAndRestart}
        onProcessFile={processFile}
        onHevyLogin={handleHevyLogin}
        onHevyApiKeyLogin={handleHevyApiKeyLogin}
        onHevySyncSaved={handleHevySyncSaved}
        onLyfatLogin={handleLyfatLogin}
        onLyfatSyncSaved={handleLyfatSyncSaved}
      />

      <AppLoadingOverlay
        open={isAnalyzing}
        loadingKind={loadingKind}
        loadingStep={loadingStep}
        progress={progress}
      />
    </div>
  );
};

export default App;
