import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SVG_TO_MUSCLE_GROUP,
  getHeadlessIdForDetailedSvgId,
  HEADLESS_MUSCLE_NAMES,
  type HeadlessMuscleId,
} from '../../../utils/muscle/muscleMappingConstants';
import { WeeklySetsWindow } from '../../../utils/muscle/dashboardWeeklySets';

export type ViewMode = 'muscle' | 'group' | 'headless';

export interface InitialMuscleSelection {
  muscleId: string;
  viewMode: ViewMode;
}

export interface UseMuscleSelectionProps {
  initialMuscle?: InitialMuscleSelection | null;
  initialWeeklySetsWindow?: WeeklySetsWindow | null;
  onInitialMuscleConsumed?: () => void;
  isLoading: boolean;
}

export interface UseMuscleSelectionReturn {
  selectedMuscle: string | null;
  setSelectedMuscle: React.Dispatch<React.SetStateAction<string | null>>;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  weeklySetsWindow: WeeklySetsWindow;
  setWeeklySetsWindow: React.Dispatch<React.SetStateAction<WeeklySetsWindow>>;
  activeQuickFilter: QuickFilterCategory | null;
  setActiveQuickFilter: React.Dispatch<React.SetStateAction<QuickFilterCategory | null>>;
  selectedSvgIdForUrlRef: React.MutableRefObject<string | null>;
  clearSelectionUrl: () => void;
  updateSelectionUrl: (opts: { svgId: string; mode: ViewMode; window: WeeklySetsWindow }) => void;
  handleViewModeChange: (mode: ViewMode) => void;
  handleQuickFilterClick: (category: QuickFilterCategory) => void;
  clearSelection: () => void;
}

export type QuickFilterCategory = 'PUS' | 'PUL' | 'LEG';

export function useMuscleSelection({
  initialMuscle,
  initialWeeklySetsWindow,
  onInitialMuscleConsumed,
  isLoading,
}: UseMuscleSelectionProps): UseMuscleSelectionReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('headless');
  const [weeklySetsWindow, setWeeklySetsWindow] = useState<WeeklySetsWindow>('30d');
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterCategory | null>(null);

  // In group mode, selectedMuscle stores the group name (e.g. "Back"), but we still want the URL to
  // round-trip through the underlying SVG id that was clicked.
  const selectedSvgIdForUrlRef = useRef<string | null>(null);

  const clearSelectionUrl = useCallback(() => {
    navigate({ pathname: location.pathname, search: '' });
  }, [navigate, location.pathname]);

  const updateSelectionUrl = useCallback(
    (opts: { svgId: string; mode: ViewMode; window: WeeklySetsWindow }) => {
      const params = new URLSearchParams();
      params.set('muscle', opts.svgId);
      params.set('view', opts.mode);
      params.set('window', opts.window);
      navigate({ pathname: location.pathname, search: `?${params.toString()}` });
    },
    [navigate, location.pathname]
  );

  // Apply initial muscle selection from dashboard navigation
  useEffect(() => {
    if (initialMuscle && !isLoading) {
      setViewMode(initialMuscle.viewMode);
      selectedSvgIdForUrlRef.current = initialMuscle.muscleId;
      if (initialMuscle.viewMode === 'group') {
        // For group mode, get the group name from the muscle ID
        const group = SVG_TO_MUSCLE_GROUP[initialMuscle.muscleId];
        if (group && group !== 'Other') {
          setSelectedMuscle(group);
        }
      } else if (initialMuscle.viewMode === 'headless') {
        // For headless mode, URL can contain either a headless id (preferred) or a detailed svg id.
        const headless = (HEADLESS_MUSCLE_NAMES as any)[initialMuscle.muscleId]
          ? (initialMuscle.muscleId as HeadlessMuscleId)
          : getHeadlessIdForDetailedSvgId(initialMuscle.muscleId);
        if (headless) {
          setSelectedMuscle(headless);
          // Ensure we keep URL round-trippable with a stable headless id.
          selectedSvgIdForUrlRef.current = headless;
        }
      } else {
        setSelectedMuscle(initialMuscle.muscleId);
      }
      onInitialMuscleConsumed?.();
    }
  }, [initialMuscle, isLoading, onInitialMuscleConsumed]);

  // Apply initial weekly sets window from dashboard navigation
  useEffect(() => {
    if (initialWeeklySetsWindow && !isLoading) {
      setWeeklySetsWindow(initialWeeklySetsWindow);
    }
  }, [initialWeeklySetsWindow, isLoading]);

  // Clear selection when switching view modes
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setSelectedMuscle(null);
    setActiveQuickFilter(null);
    setViewMode(mode);
    selectedSvgIdForUrlRef.current = null;
    clearSelectionUrl();
  }, [clearSelectionUrl]);

  // Handle quick filter click - auto-select muscles in category
  const handleQuickFilterClick = useCallback((category: QuickFilterCategory) => {
    if (activeQuickFilter === category) {
      setActiveQuickFilter(null);
    } else {
      // Headless view supports quick filters by mapping to headless ids.
      if (viewMode === 'group') setViewMode('headless');
      setActiveQuickFilter(category);
      setSelectedMuscle(null);
      selectedSvgIdForUrlRef.current = null;
      clearSelectionUrl();
    }
  }, [activeQuickFilter, viewMode, clearSelectionUrl]);

  const clearSelection = useCallback(() => {
    setSelectedMuscle(null);
    setActiveQuickFilter(null);
    selectedSvgIdForUrlRef.current = null;
    clearSelectionUrl();
  }, [clearSelectionUrl]);

  return {
    selectedMuscle,
    setSelectedMuscle,
    viewMode,
    setViewMode,
    weeklySetsWindow,
    setWeeklySetsWindow,
    activeQuickFilter,
    setActiveQuickFilter,
    selectedSvgIdForUrlRef,
    clearSelectionUrl,
    updateSelectionUrl,
    handleViewModeChange,
    handleQuickFilterClick,
    clearSelection,
  };
}
