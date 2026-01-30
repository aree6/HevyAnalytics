import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  parseWorkoutCSVAsyncWithUnit,
  ParseWorkoutCsvResult,
} from './utils/csv/csvParser';
import { getDailySummaries, getExerciseStats, identifyPersonalRecords } from './utils/analysis/analytics';
import { computationCache, getFilteredCacheKey } from './utils/storage/computationCache';
import { WorkoutSet } from './types';
import { BodyMapGender } from './components/bodyMap/BodyMap';
import type { DataSourceChoice } from './utils/dataSources/types';
import { Tab, getPathForTab, getTabFromPathname, parseLocalDateFromYyyyMmDd } from './app/tabs';
import { AppHeader } from './components/app/AppHeader';
import { AppCalendarOverlay } from './components/app/AppCalendarOverlay';
import { AppLoadingOverlay } from './components/app/AppLoadingOverlay';
import { AppTabContent } from './components/app/AppTabContent';
import { AppOnboardingLayer } from './components/app/AppOnboardingLayer';
import { UserPreferencesModal } from './components/modals/UserPreferencesModal';
import type { OnboardingFlow } from './app/onboarding/types';
import {
  saveCSVData,
  saveWeightUnit,
  getWeightUnit,
  clearWeightUnit,
  WeightUnit,
  ExerciseTrendMode,
  getExerciseTrendMode,
  saveExerciseTrendMode,
  getBodyMapGender,
  saveBodyMapGender,
  getPreferencesConfirmed,
  DateMode,
  getDateMode,
  saveDateMode,
} from './utils/storage/localStorage';
import { X, Calendar, Pencil } from 'lucide-react';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { formatDayYearContraction, formatHumanReadableDate, getEffectiveNowFromWorkoutData, isPlausibleDate } from './utils/date/dateUtils';
import { getDataAgeInfo } from './hooks/usePreferences';
import { trackPageView } from './utils/integrations/ga';
import { setContext, trackEvent } from './utils/integrations/analytics';
import { ThemedBackground } from './components/theme/ThemedBackground';
import {
  getDataSourceChoice,
  saveDataSourceChoice,
  getHevyAuthToken,
  saveHevyAuthToken,
  clearHevyAuthToken,
  getHevyProApiKey,
  saveHevyProApiKey,
  clearHevyProApiKey,
  getLyfataApiKey,
  saveLyfataApiKey,
  clearLyfataApiKey,
  saveLastCsvPlatform,
  saveLastLoginMethod,
  getSetupComplete,
  saveSetupComplete,
} from './utils/storage/dataSourceStorage';
import { getHevyUsernameOrEmail, saveHevyPassword, saveHevyUsernameOrEmail } from './utils/storage/hevyCredentialsStorage';
import { hevyBackendGetAccount, hevyBackendGetSets, hevyBackendGetSetsWithProApiKey, hevyBackendLogin, hevyBackendValidateProApiKey } from './utils/api/hevyBackend';
import { lyfatBackendGetSets } from './utils/api/lyfataBackend';
import { useTheme } from './components/theme/ThemeProvider';
import { hydrateBackendWorkoutSets } from './app/hydrateBackendWorkoutSets';
import { getErrorMessage, getHevyErrorMessage, getLyfatErrorMessage } from './app/appErrorMessages';
import { clearCacheAndRestart as clearCacheAndRestartNow } from './app/clearCacheAndRestart';
import { finishProgress as finishLoadingProgress, startProgress as startLoadingProgress } from './app/loadingProgress';
import { usePrefetchHeavyViews } from './app/usePrefetchHeavyViews';
import { useStartupAutoLoad } from './app/useStartupAutoLoad';
import { usePlatformDeepLink } from './app/usePlatformDeepLink';

const App: React.FC = () => {
  const { mode, setMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState<WorkoutSet[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromPathname(location.pathname));
  const [onboarding, setOnboarding] = useState<OnboardingFlow | null>(() => {
    return getSetupComplete() ? null : { intent: 'initial', step: 'platform' };
  });
  const [dataSource, setDataSource] = useState<DataSourceChoice | null>(() => getDataSourceChoice());
  const [hevyLoginError, setHevyLoginError] = useState<string | null>(null);
  const [lyfatLoginError, setLyfatLoginError] = useState<string | null>(null);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [highlightedExercise, setHighlightedExercise] = useState<string | null>(null);
  const [initialMuscleForAnalysis, setInitialMuscleForAnalysis] = useState<{ muscleId: string; viewMode: 'muscle' | 'group' } | null>(null);
  const [initialWeeklySetsWindow, setInitialWeeklySetsWindow] = useState<'all' | '7d' | '30d' | '365d' | null>(null);
  const [targetHistoryDate, setTargetHistoryDate] = useState<Date | null>(null);
  const [loadingKind, setLoadingKind] = useState<'hevy' | 'lyfta' | 'csv' | null>(null);

  // Loading State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: Load, 1: Analyze, 2: Visualize
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);

  const mainRef = useRef<HTMLElement | null>(null);
  const activeTabRef = useRef<Tab>(activeTab);
  const tabScrollPositionsRef = useRef<Record<string, number>>({});
  const pendingNavRef = useRef<{ tab: Tab; kind: 'top' | 'deep' } | null>(null);
  const pendingUrlNavKindRef = useRef<'top' | 'deep' | null>(null);

  const platformQueryConsumedRef = useRef(false);

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

  usePlatformDeepLink({
    location,
    navigate,
    setOnboarding,
    platformQueryConsumedRef,
  });

  useLayoutEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    setContext({ active_tab: activeTab });
    trackEvent('tab_view', {
      tab: activeTab,
      path: `${window.location.pathname || '/'}${window.location.search || ''}`,
    });
  }, [activeTab, location.pathname, location.search]);


  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onScroll = () => {
      tabScrollPositionsRef.current[activeTabRef.current] = el.scrollTop;
    };

    el.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => el.removeEventListener('scroll', onScroll as any);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const pending = pendingNavRef.current;
    if (!pending || pending.tab !== activeTab) return;

    if (pending.kind === 'top') {
      const targetTop = tabScrollPositionsRef.current[activeTab] ?? 0;
      requestAnimationFrame(() => {
        if (!mainRef.current) return;
        mainRef.current.scrollTop = targetTop;
      });
    } else {
      tabScrollPositionsRef.current[activeTab] = 0;
      requestAnimationFrame(() => {
        if (!mainRef.current) return;
        mainRef.current.scrollTop = 0;
      });
    }

    pendingNavRef.current = null;
  }, [activeTab]);

  const navigateToTab = useCallback((tab: Tab, kind: 'top' | 'deep') => {
    const el = mainRef.current;
    if (el) {
      tabScrollPositionsRef.current[activeTabRef.current] = el.scrollTop;
    }
    pendingNavRef.current = { tab, kind };
    setActiveTab(tab);
  }, []);

  useLayoutEffect(() => {
    const tabFromUrl = getTabFromPathname(location.pathname);
    const params = new URLSearchParams(location.search);

    if (tabFromUrl === Tab.EXERCISES) {
      const exercise = params.get('exercise');
      setHighlightedExercise(exercise ? exercise : null);
    } else {
      setHighlightedExercise(null);
    }

    if (tabFromUrl === Tab.HISTORY) {
      const date = params.get('date');
      const parsed = date ? parseLocalDateFromYyyyMmDd(date) : null;
      setTargetHistoryDate(parsed);
    } else {
      setTargetHistoryDate(null);
    }

    if (tabFromUrl === Tab.MUSCLE_ANALYSIS) {
      const muscleId = params.get('muscle');
      const viewMode = params.get('view');
      const weeklySetsWindow = params.get('window');

      const isValidViewMode = viewMode === 'muscle' || viewMode === 'group';
      const isValidWindow = weeklySetsWindow === 'all' || weeklySetsWindow === '7d' || weeklySetsWindow === '30d' || weeklySetsWindow === '365d';

      if (muscleId && isValidViewMode) {
        setInitialMuscleForAnalysis({ muscleId, viewMode });
        setInitialWeeklySetsWindow(isValidWindow ? weeklySetsWindow : 'all');
      } else {
        setInitialMuscleForAnalysis(null);
        setInitialWeeklySetsWindow(null);
      }
    } else {
      setInitialMuscleForAnalysis(null);
      setInitialWeeklySetsWindow(null);
    }

    const isDeep =
      (tabFromUrl === Tab.EXERCISES && params.has('exercise')) ||
      (tabFromUrl === Tab.HISTORY && params.has('date')) ||
      (tabFromUrl === Tab.MUSCLE_ANALYSIS && params.has('muscle'));

    const pendingKind = pendingUrlNavKindRef.current;
    pendingUrlNavKindRef.current = null;

    if (tabFromUrl !== activeTabRef.current) {
      navigateToTab(tabFromUrl, pendingKind ?? (isDeep ? 'deep' : 'top'));
      return;
    }

    const desiredKind = pendingKind ?? (isDeep ? 'deep' : 'top');
    const el = mainRef.current;
    if (!el) return;

    if (desiredKind === 'deep') {
      tabScrollPositionsRef.current[activeTabRef.current] = 0;
      requestAnimationFrame(() => {
        if (!mainRef.current) return;
        mainRef.current.scrollTop = 0;
      });
      return;
    }

    const targetTop = tabScrollPositionsRef.current[activeTabRef.current] ?? 0;
    requestAnimationFrame(() => {
      if (!mainRef.current) return;
      mainRef.current.scrollTop = targetTop;
    });
  }, [location.pathname, location.search, navigateToTab]);

  const clearCacheAndRestart = useCallback(() => {
    clearCacheAndRestartNow();
  }, []);

  // Gender state with localStorage persistence
  const [bodyMapGender, setBodyMapGender] = useState<BodyMapGender>(() => getBodyMapGender());

  // Persist gender to localStorage when it changes
  useEffect(() => {
    saveBodyMapGender(bodyMapGender);
    setContext({ body_map_gender: bodyMapGender });
  }, [bodyMapGender]);

  // Weight unit state with localStorage persistence
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => getWeightUnit());

  // Persist weight unit to localStorage when it changes
  useEffect(() => {
    saveWeightUnit(weightUnit);
    setContext({ weight_unit: weightUnit });
  }, [weightUnit]);

  // Date mode state with localStorage persistence
  const [dateMode, setDateMode] = useState<DateMode>(() => getDateMode());

  // Persist date mode to localStorage when it changes
  useEffect(() => {
    saveDateMode(dateMode);
  }, [dateMode]);

  // Exercise trend mode state with localStorage persistence
  const [exerciseTrendMode, setExerciseTrendMode] = useState<ExerciseTrendMode>(() => getExerciseTrendMode());

  // Persist exercise trend mode to localStorage when it changes
  useEffect(() => {
    saveExerciseTrendMode(exerciseTrendMode);
  }, [exerciseTrendMode]);

  // User Preferences Modal state
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  // Handler for navigating to ExerciseView from MuscleAnalysis
  const handleExerciseClick = (exerciseName: string) => {
    trackEvent('exercise_open', { source: 'muscle_analysis' });
    setHighlightedExercise(exerciseName);
    const params = new URLSearchParams();
    params.set('exercise', exerciseName);
    pendingUrlNavKindRef.current = 'deep';
    
    // If we're already on the Exercises tab, replace the current entry instead of pushing
    // This prevents exercise selections from polluting the browser history
    if (activeTab === Tab.EXERCISES) {
      navigate({ pathname: getPathForTab(Tab.EXERCISES), search: `?${params.toString()}` }, { replace: true });
    } else {
      navigate({ pathname: getPathForTab(Tab.EXERCISES), search: `?${params.toString()}` });
    }
  };

  // Handler for navigating to MuscleAnalysis from Dashboard heatmap
  const handleMuscleClick = (muscleId: string, viewMode: 'muscle' | 'group', weeklySetsWindow: 'all' | '7d' | '30d' | '365d') => {
    trackEvent('muscle_open', { view_mode: viewMode, window: weeklySetsWindow });
    setInitialMuscleForAnalysis({ muscleId, viewMode });
    setInitialWeeklySetsWindow(weeklySetsWindow);
    const params = new URLSearchParams();
    params.set('muscle', muscleId);
    params.set('view', viewMode);
    params.set('window', weeklySetsWindow);
    pendingUrlNavKindRef.current = 'deep';
    navigate({ pathname: getPathForTab(Tab.MUSCLE_ANALYSIS), search: `?${params.toString()}` });
  };

  const startProgress = () => {
    return startLoadingProgress({ setProgress, progressTimerRef });
  };

  const finishProgress = (startedAt: number) => {
    finishLoadingProgress({
      startedAt,
      setProgress,
      setIsAnalyzing,
      setLoadingKind,
      progressTimerRef,
    });
  };

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<Array<{ start: Date; end: Date }>>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useStartupAutoLoad({
    setOnboarding,
    setDataSource,
    setParsedData,
    setHevyLoginError,
    setLyfatLoginError,
    setCsvImportError,
    setIsAnalyzing,
    setLoadingStep,
    setLoadingKind,
    startProgress,
    finishProgress,
  });

  useEffect(() => {
    if (!dataSource) return;
    saveDataSourceChoice(dataSource);
    setContext({ data_source: dataSource });
  }, [dataSource]);

  // Prefetch heavy views and preload exercise assets to avoid first-time lag
  usePrefetchHeavyViews();

  // Track "page" views when switching tabs
  useEffect(() => {
    trackPageView(`${window.location.pathname || '/'}${window.location.search || ''}`);
  }, [location.pathname, location.search]);

  // Derive unique months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    parsedData.forEach(d => {
      if (d.parsedDate) {
        months.add(format(d.parsedDate, 'yyyy-MM'));
      }
    });
    return Array.from(months).sort().reverse(); // Descending order
  }, [parsedData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return parsedData.filter(d => {
      if (!d.parsedDate) return false;
      if (selectedDay) return isSameDay(d.parsedDate, selectedDay);
      if (selectedWeeks.length > 0) {
        return selectedWeeks.some(r => isWithinInterval(d.parsedDate as Date, {
          start: startOfDay(r.start),
          end: endOfDay(r.end),
        }));
      }
      if (selectedRange) {
        return isWithinInterval(d.parsedDate as Date, {
          start: startOfDay(selectedRange.start),
          end: endOfDay(selectedRange.end),
        });
      }
      if (selectedMonth !== 'all') return format(d.parsedDate, 'yyyy-MM') === selectedMonth;
      return true;
    });
  }, [parsedData, selectedMonth, selectedDay, selectedRange, selectedWeeks]);

  // Data-based "now" - the date of the most recent workout
  const dataBasedNow = useMemo(() => {
    return getEffectiveNowFromWorkoutData(parsedData, new Date(0));
  }, [parsedData]);

  // Data age info - useful for warnings when using actual date mode with old data
  const dataAgeInfo = useMemo(() => {
    return getDataAgeInfo(dataBasedNow);
  }, [dataBasedNow]);

  // Effective "now" - respects user's date mode preference
  // 'effective' mode: uses the latest workout date (default, better for relative time displays)
  // 'actual' mode: uses the real current date
  const effectiveNow = useMemo(() => {
    return dateMode === 'actual' ? new Date() : dataBasedNow;
  }, [dataBasedNow, dateMode]);

  const filteredDataBasedNow = useMemo(() => {
    return getEffectiveNowFromWorkoutData(filteredData, new Date(0));
  }, [filteredData]);

  const filteredEffectiveNow = useMemo(() => {
    return dateMode === 'actual' ? new Date() : filteredDataBasedNow;
  }, [filteredDataBasedNow, dateMode]);

  // Calendar boundaries and available dates (for blur/disable)
  const { minDate, maxDate, availableDatesSet } = useMemo(() => {
    let minTs = Number.POSITIVE_INFINITY;
    let maxTs = 0;
    const set = new Set<string>();
    parsedData.forEach(d => {
      if (!d.parsedDate) return;
      const ts = d.parsedDate.getTime();
      if (ts < minTs) minTs = ts;
      if (ts > maxTs) maxTs = ts;
      set.add(format(d.parsedDate, 'yyyy-MM-dd'));
    });
    const today = new Date();
    const minDate = isFinite(minTs) ? startOfDay(new Date(minTs)) : null;
    const maxInData = maxTs > 0 ? endOfDay(new Date(maxTs)) : null;
    const maxDate = maxInData ?? (isPlausibleDate(effectiveNow) ? endOfDay(effectiveNow) : endOfDay(today));
    return { minDate, maxDate, availableDatesSet: set };
  }, [effectiveNow, parsedData]);

  // Cache key for filter-dependent computations
  const filterCacheKey = useMemo(() => getFilteredCacheKey('filter', {
    month: selectedMonth,
    day: selectedDay,
    range: selectedRange,
    weeks: selectedWeeks,
  }), [selectedMonth, selectedDay, selectedRange, selectedWeeks]);

  // Use computation cache for expensive analytics - persists across tab switches
  const dailySummaries = useMemo(() => {
    const cacheKey = `dailySummaries:${filterCacheKey}`;
    return computationCache.getOrCompute(
      cacheKey,
      filteredData,
      () => getDailySummaries(filteredData),
      { ttl: 10 * 60 * 1000 } // 10 minute TTL
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

  const hasActiveCalendarFilter = !!selectedDay || selectedWeeks.length > 0 || !!selectedRange;

  const calendarSummaryText = useMemo(() => {
    if (selectedDay) return formatHumanReadableDate(selectedDay, { now: effectiveNow });
    if (selectedRange) return `${formatDayYearContraction(selectedRange.start)} – ${formatDayYearContraction(selectedRange.end)}`;
    if (selectedWeeks.length === 1) return `${formatDayYearContraction(selectedWeeks[0].start)} – ${formatDayYearContraction(selectedWeeks[0].end)}`;
    if (selectedWeeks.length > 1) return `Weeks: ${selectedWeeks.length}`;
    return 'No filter';
  }, [effectiveNow, selectedDay, selectedRange, selectedWeeks]);

  const filterControls = (
    <div
      className={`relative flex items-center gap-2 rounded-lg px-3 py-2 h-10 shadow-sm transition-all duration-300 ${
        hasActiveCalendarFilter
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
            onClick={() => {
              setSelectedRange(null);
              setSelectedDay(null);
              setSelectedWeeks([]);
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 transition-colors"
            title="Clear filter"
            aria-label="Clear filter"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
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

  // Handler for heatmap click
  const handleDayClick = (date: Date) => {
    setTargetHistoryDate(date);
    const params = new URLSearchParams();
    params.set('date', format(date, 'yyyy-MM-dd'));
    pendingUrlNavKindRef.current = 'deep';
    navigate({ pathname: getPathForTab(Tab.HISTORY), search: `?${params.toString()}` });
  };

  const handleTargetDateConsumed = () => {
    setTargetHistoryDate(null);
  };

  const handleHistoryDayTitleClick = (date: Date) => {
    setSelectedDay(date);
    setSelectedRange(null);
    setSelectedWeeks([]);
    setSelectedMonth('all');
    pendingUrlNavKindRef.current = 'deep';
    navigate(getPathForTab(Tab.MUSCLE_ANALYSIS));
  };

  const handleOpenUpdateFlow = () => {
    trackEvent('update_flow_open', { data_source: dataSource ?? 'unknown' });
    setCsvImportError(null);
    setHevyLoginError(null);
    setLyfatLoginError(null);
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
    setOnboarding({ intent: 'update', step: 'platform' });
  };

  const handleSelectTab = (tab: Tab) => {
    setHighlightedExercise(null);
    setInitialMuscleForAnalysis(null);
    navigate(getPathForTab(tab));
  };

  const handleHevySyncSaved = () => {
    const savedProKey = getHevyProApiKey();
    if (savedProKey) {
      setHevyLoginError(null);
      setLoadingKind('hevy');
      setIsAnalyzing(true);
      setLoadingStep(0);
      const startedAt = startProgress();

      Promise.resolve()
        .then(() => {
          setLoadingStep(1);
          return hevyBackendGetSetsWithProApiKey<WorkoutSet>(savedProKey);
        })
        .then((resp) => {
          setLoadingStep(2);
          const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
          const enriched = identifyPersonalRecords(hydrated);
          setParsedData(enriched);
          saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);
          setDataSource('hevy');
          saveSetupComplete(true);
          setOnboarding(null);
        })
        .catch((err) => {
          clearHevyProApiKey();
          setHevyLoginError(getHevyErrorMessage(err));
        })
        .finally(() => {
          finishProgress(startedAt);
        });
      return;
    }

    const token = getHevyAuthToken();
    if (!token) return;

    setHevyLoginError(null);
    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    hevyBackendGetAccount(token)
      .then(({ username }) => {
        setLoadingStep(1);
        return hevyBackendGetSets<WorkoutSet>(token, username);
      })
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        saveLastLoginMethod('hevy', 'credentials', getHevyUsernameOrEmail() ?? undefined);
        setDataSource('hevy');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        clearHevyAuthToken();
        setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  };

  const handleHevyApiKeyLogin = (apiKey: string) => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setHevyLoginError('Missing API key.');
      return;
    }

    trackEvent('hevy_sync_start', { method: 'pro_api_key' });

    setHevyLoginError(null);
    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    Promise.resolve()
      .then(() => hevyBackendValidateProApiKey(trimmed))
      .then((valid) => {
        if (!valid) throw new Error('Invalid API key. Please check your Hevy Pro API key and try again.');
        saveHevyProApiKey(trimmed);
        saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);
        setLoadingStep(1);
        return hevyBackendGetSetsWithProApiKey<WorkoutSet>(trimmed);
      })
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('hevy');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('hevy_sync_error', { method: 'pro_api_key' });
        clearHevyProApiKey();
        setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  };

  const handleHevyLogin = (emailOrUsername: string, password: string) => {
    trackEvent('hevy_sync_start', { method: 'credentials' });
    setHevyLoginError(null);
    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    hevyBackendLogin(emailOrUsername, password)
      .then((r) => {
        if (!r.auth_token) throw new Error('Missing auth token');
        saveHevyAuthToken(r.auth_token);
        const trimmed = emailOrUsername.trim();
        saveHevyUsernameOrEmail(trimmed);
        saveLastLoginMethod('hevy', 'credentials', trimmed);
        return Promise.all([
          saveHevyPassword(password).catch(() => {
          }),
          hevyBackendGetAccount(r.auth_token),
        ]).then(([, { username }]) => ({ token: r.auth_token, username }));
      })
      .then(({ token, username }) => {
        setLoadingStep(1);
        return hevyBackendGetSets<WorkoutSet>(token, username);
      })
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('hevy');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('hevy_sync_error', { method: 'credentials' });
        setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  };

  const handleLyfatSyncSaved = () => {
    const apiKey = getLyfataApiKey();
    if (!apiKey) return;

    trackEvent('lyfta_sync_start', { method: 'saved_api_key' });

    setLyfatLoginError(null);
    setLoadingKind('lyfta');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    lyfatBackendGetSets<WorkoutSet>(apiKey)
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('lyfta');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('lyfta_sync_error', { method: 'saved_api_key' });
        clearLyfataApiKey();
        setLyfatLoginError(getLyfatErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  };

  const handleLyfatLogin = (apiKey: string) => {
    trackEvent('lyfta_sync_start', { method: 'api_key' });
    setLyfatLoginError(null);
    setLoadingKind('lyfta');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    lyfatBackendGetSets<WorkoutSet>(apiKey)
      .then((resp) => {
        setLoadingStep(2);
        trackEvent('lyfta_sync_success', { method: 'api_key', workouts: resp.meta?.workouts });
        saveLyfataApiKey(apiKey);
        saveLastLoginMethod('lyfta', 'apiKey');
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('lyfta');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('lyfta_sync_error', { method: 'api_key' });
        setLyfatLoginError(getLyfatErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  };

  const processFile = (file: File, platform: DataSourceChoice, unitOverride?: WeightUnit) => {
    trackEvent('csv_import_start', { platform, unit: unitOverride ?? weightUnit });
    setLoadingKind('csv');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setCsvImportError(null);
        setLoadingStep(1);
        const unit = unitOverride ?? weightUnit;
        parseWorkoutCSVAsyncWithUnit(text, { unit })
          .then((result: ParseWorkoutCsvResult) => {
            setLoadingStep(2);
            const enriched = identifyPersonalRecords(result.sets);
            trackEvent('csv_import_success', {
              platform,
              unit,
              sets: result.sets?.length,
              enriched_sets: enriched?.length,
            });
            setParsedData(enriched);
            saveCSVData(text);
            saveLastCsvPlatform(platform);
            saveLastLoginMethod(platform, 'csv', platform === 'hevy' ? (getHevyUsernameOrEmail() ?? undefined) : undefined);
            setDataSource(platform);
            saveSetupComplete(true);
            setOnboarding(null);
          })
          .catch((err) => {
            trackEvent('csv_import_error', { platform });
            setCsvImportError(getErrorMessage(err));
          })
          .finally(() => {
            setSelectedMonth('all');
            setSelectedDay(null);
            finishProgress(startedAt);
          });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="flex flex-col min-h-[100svh] h-[100dvh] overscroll-none bg-transparent text-[color:var(--app-fg)] font-sans"
      style={{ background: mode === 'svg' ? 'transparent' : 'var(--app-bg)' }}
    >
      <ThemedBackground />

      {onboarding?.intent === 'initial' ? null : (
        <>
          {/* Top Header Navigation */}
          <AppHeader
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onOpenUpdateFlow={handleOpenUpdateFlow}
            onOpenPreferences={() => setPreferencesModalOpen(true)}
            calendarOpen={calendarOpen}
            onToggleCalendarOpen={() => setCalendarOpen((v) => !v)}
            hasActiveCalendarFilter={hasActiveCalendarFilter}
            onClearCalendarFilter={() => {
              setSelectedDay(null);
              setSelectedRange(null);
              setSelectedWeeks([]);
            }}
          />

          {calendarOpen && (
            <AppCalendarOverlay
              open={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              selectedDay={selectedDay}
              selectedRange={selectedRange}
              selectedWeeks={selectedWeeks}
              effectiveNow={effectiveNow}
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
              onClear={() => {
                setSelectedRange(null);
                setSelectedDay(null);
                setSelectedWeeks([]);
              }}
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
            onHighlightApplied={() => setHighlightedExercise(null)}
            onDayClick={handleDayClick}
            onMuscleClick={handleMuscleClick}
            onExerciseClick={handleExerciseClick}
            onHistoryDayTitleClick={handleHistoryDayTitleClick}
            targetHistoryDate={targetHistoryDate}
            onTargetHistoryDateConsumed={handleTargetDateConsumed}
            initialMuscleForAnalysis={initialMuscleForAnalysis}
            initialWeeklySetsWindow={initialWeeklySetsWindow}
            onInitialMuscleConsumed={() => {
              setInitialMuscleForAnalysis(null);
              setInitialWeeklySetsWindow(null);
            }}
            bodyMapGender={bodyMapGender}
            weightUnit={weightUnit}
            exerciseTrendMode={exerciseTrendMode}
            now={filteredEffectiveNow}
          />
        </>
      )}

      {/* User Preferences Modal */}
      <UserPreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
        bodyMapGender={bodyMapGender}
        onBodyMapGenderChange={setBodyMapGender}
        themeMode={mode}
        onThemeModeChange={setMode}
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
        onSetBodyMapGender={(g) => setBodyMapGender(g)}
        onSetWeightUnit={(u) => setWeightUnit(u)}
        onSetCsvImportError={(msg) => setCsvImportError(msg)}
        onSetHevyLoginError={(msg) => setHevyLoginError(msg)}
        onSetLyfatLoginError={(msg) => setLyfatLoginError(msg)}
        onClearCacheAndRestart={clearCacheAndRestart}
        onProcessFile={processFile}
        onHevyLogin={handleHevyLogin}
        onHevyApiKeyLogin={handleHevyApiKeyLogin}
        onHevySyncSaved={handleHevySyncSaved}
        onLyfatLogin={handleLyfatLogin}
        onLyfatSyncSaved={handleLyfatSyncSaved}
      />

      {/* Loading Overlay */}
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
