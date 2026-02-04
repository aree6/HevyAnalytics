import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tab, getPathForTab, getTabFromPathname, parseLocalDateFromYyyyMmDd } from '../app/tabs';
import { trackEvent } from '../utils/integrations/analytics';

export interface UseAppNavigationReturn {
  activeTab: Tab;
  highlightedExercise: string | null;
  initialMuscleForAnalysis: { muscleId: string; viewMode: 'muscle' | 'group' | 'headless' } | null;
  initialWeeklySetsWindow: 'all' | '7d' | '30d' | '365d' | null;
  targetHistoryDate: Date | null;
  mainRef: React.RefObject<HTMLElement | null>;
  navigateToTab: (tab: Tab, kind?: 'top' | 'deep') => void;
  handleExerciseClick: (exerciseName: string) => void;
  handleMuscleClick: (muscleId: string, viewMode?: 'muscle' | 'group' | 'headless', weeklySetsWindow?: 'all' | '7d' | '30d' | '365d') => void;
  handleDayClick: (date: Date) => void;
  handleTargetDateConsumed: () => void;
  handleSelectTab: (tab: Tab) => void;
  clearHighlightedExercise: () => void;
  clearInitialMuscleForAnalysis: () => void;
}

export function useAppNavigation(): UseAppNavigationReturn {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromPathname(location.pathname));
  const [highlightedExercise, setHighlightedExercise] = useState<string | null>(null);
  const [initialMuscleForAnalysis, setInitialMuscleForAnalysis] = useState<{ muscleId: string; viewMode: 'muscle' | 'group' | 'headless' } | null>(null);
  const [initialWeeklySetsWindow, setInitialWeeklySetsWindow] = useState<'all' | '7d' | '30d' | '365d' | null>(null);
  const [targetHistoryDate, setTargetHistoryDate] = useState<Date | null>(null);
  
  const mainRef = useRef<HTMLElement | null>(null);
  const activeTabRef = useRef<Tab>(activeTab);
  const tabScrollPositionsRef = useRef<Record<string, number>>({});
  const pendingNavRef = useRef<{ tab: Tab; kind: 'top' | 'deep' } | null>(null);
  const pendingUrlNavKindRef = useRef<'top' | 'deep' | null>(null);

  useLayoutEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Scroll position tracking
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onScroll = () => {
      tabScrollPositionsRef.current[activeTabRef.current] = el.scrollTop;
    };

    el.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => el.removeEventListener('scroll', onScroll as any);
  }, []);

  // Handle tab navigation with scroll position restoration
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

  const navigateToTab = useCallback((tab: Tab, kind: 'top' | 'deep' = 'top') => {
    const el = mainRef.current;
    if (el) {
      tabScrollPositionsRef.current[activeTabRef.current] = el.scrollTop;
    }
    pendingNavRef.current = { tab, kind };
    setActiveTab(tab);
  }, []);

  // URL param synchronization
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

      const isValidViewMode = viewMode === 'muscle' || viewMode === 'group' || viewMode === 'headless';
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

  // Track tab views
  useEffect(() => {
    trackEvent('tab_view', {
      tab: activeTab,
      path: `${window.location.pathname || '/'}${window.location.search || ''}`,
    });
  }, [activeTab, location.pathname, location.search]);

  const handleExerciseClick = useCallback((exerciseName: string) => {
    trackEvent('exercise_open', { source: 'muscle_analysis' });
    setHighlightedExercise(exerciseName);
    const params = new URLSearchParams();
    params.set('exercise', exerciseName);
    pendingUrlNavKindRef.current = 'deep';

    if (activeTab === Tab.EXERCISES) {
      navigate({ pathname: getPathForTab(Tab.EXERCISES), search: `?${params.toString()}` }, { replace: true });
    } else {
      navigate({ pathname: getPathForTab(Tab.EXERCISES), search: `?${params.toString()}` });
    }
  }, [activeTab, navigate]);

  const handleMuscleClick = useCallback((muscleId: string, viewMode: 'muscle' | 'group' | 'headless' = 'headless', weeklySetsWindow: 'all' | '7d' | '30d' | '365d' = 'all') => {
    trackEvent('muscle_open', { view_mode: viewMode, window: weeklySetsWindow });
    setInitialMuscleForAnalysis({ muscleId, viewMode });
    setInitialWeeklySetsWindow(weeklySetsWindow);
    const params = new URLSearchParams();
    params.set('muscle', muscleId);
    params.set('view', viewMode);
    params.set('window', weeklySetsWindow);
    pendingUrlNavKindRef.current = 'deep';
    navigate({ pathname: getPathForTab(Tab.MUSCLE_ANALYSIS), search: `?${params.toString()}` });
  }, [navigate]);

  const handleDayClick = useCallback((date: Date) => {
    setTargetHistoryDate(date);
    const params = new URLSearchParams();
    params.set('date', date.toISOString().split('T')[0]);
    pendingUrlNavKindRef.current = 'deep';
    navigate({ pathname: getPathForTab(Tab.HISTORY), search: `?${params.toString()}` });
  }, [navigate]);

  const handleTargetDateConsumed = useCallback(() => {
    setTargetHistoryDate(null);
  }, []);

  const handleSelectTab = useCallback((tab: Tab) => {
    setHighlightedExercise(null);
    setInitialMuscleForAnalysis(null);
    navigate(getPathForTab(tab));
  }, [navigate]);

  return {
    activeTab,
    highlightedExercise,
    initialMuscleForAnalysis,
    initialWeeklySetsWindow,
    targetHistoryDate,
    mainRef,
    navigateToTab,
    handleExerciseClick,
    handleMuscleClick,
    handleDayClick,
    handleTargetDateConsumed,
    handleSelectTab,
    clearHighlightedExercise: () => setHighlightedExercise(null),
    clearInitialMuscleForAnalysis: () => {
      setInitialMuscleForAnalysis(null);
      setInitialWeeklySetsWindow(null);
    },
  };
}
