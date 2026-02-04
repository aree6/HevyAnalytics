import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WorkoutSet } from '../../types';
import { BodyMap, BodyMapGender } from '../bodyMap/BodyMap';
import { ViewHeader } from '../layout/ViewHeader';
import { differenceInCalendarDays, subDays } from 'date-fns';
import {
  loadExerciseMuscleData,
  calculateMuscleVolume,
  SVG_MUSCLE_NAMES,
  ExerciseMuscleData,
  MuscleVolumeEntry,
  getExerciseMuscleVolumes,
  getVolumeColor,
  lookupExerciseMuscleData,
  toHeadlessVolumeMap,
} from '../../utils/muscle/muscleMapping';
import { getExerciseAssets, ExerciseAsset } from '../../utils/data/exerciseAssets';
import { ExerciseThumbnail } from '../common/ExerciseThumbnail';
import { getSvgMuscleVolumeTimeSeriesRolling, getMuscleVolumeTimeSeriesRolling } from '../../utils/muscle/rollingVolumeCalculator';
import { bucketRollingWeeklySeriesToWeeks } from '../../utils/muscle/rollingSeriesBucketing';
import { getEffectiveNowFromWorkoutData } from '../../utils/date/dateUtils';
import {
  computeWeeklySetsDashboardData,
  WeeklySetsWindow,
} from '../../utils/muscle/dashboardWeeklySets';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Dumbbell, X, Activity, Infinity, Scan, Grid3X3 } from 'lucide-react';
import { type NormalizedMuscleGroup } from '../../utils/muscle/muscleNormalization';
import { LazyRender } from '../ui/LazyRender';
import { ChartSkeleton } from '../ui/ChartSkeleton';
import { Tooltip as HoverTooltip, TooltipData } from '../ui/Tooltip';
import { CHART_TOOLTIP_STYLE, RADAR_TICK_FILL } from '../../utils/ui/uiConstants';
import { formatNumber } from '../../utils/format/formatters';
import { computationCache } from '../../utils/storage/computationCache';
import { computeWindowedExerciseBreakdown } from '../../utils/muscle/windowedExerciseBreakdown';
import { getRechartsXAxisInterval, RECHARTS_XAXIS_PADDING } from '../../utils/chart/chartEnhancements';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SVG_TO_MUSCLE_GROUP,
  MUSCLE_GROUP_ORDER,
  getSvgIdsForGroup,
  getGroupForSvgId,
  QuickFilterCategory,
  QUICK_FILTER_LABELS,
  QUICK_FILTER_GROUPS,
  getSvgIdsForQuickFilter,
  getHeadlessIdForDetailedSvgId,
  HEADLESS_ID_TO_DETAILED_SVG_IDS,
  HEADLESS_MUSCLE_NAMES,
  getHeadlessRadarSeries,
  type HeadlessMuscleId,
} from '../../utils/muscle/muscleMappingConstants';

import { resolveSelectedSubjectKeys } from './selectedSubjectKeys';
import {
  computeWeeklySetsSummary,
  computeWeeklySetsDelta,
} from './weeklySetsMetrics';

interface MuscleAnalysisProps {
  data: WorkoutSet[];
  filtersSlot?: React.ReactNode;
  onExerciseClick?: (exerciseName: string) => void;
  initialMuscle?: { muscleId: string; viewMode: 'muscle' | 'group' | 'headless' } | null;
  initialWeeklySetsWindow?: WeeklySetsWindow | null;
  onInitialMuscleConsumed?: () => void;
  stickyHeader?: boolean;
  bodyMapGender?: BodyMapGender;
  /** Reference date for relative time calculations. Pass from App for centralized date mode control. */
  now?: Date;
}

type ViewMode = 'muscle' | 'group' | 'headless';

/** Alias to centralized constant for backward compatibility within this file */
const MUSCLE_GROUP_DISPLAY = SVG_TO_MUSCLE_GROUP;

export const MuscleAnalysis: React.FC<MuscleAnalysisProps> = ({
  data,
  filtersSlot,
  onExerciseClick,
  initialMuscle,
  initialWeeklySetsWindow,
  onInitialMuscleConsumed,
  stickyHeader = false,
  bodyMapGender = 'male',
  now,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [exerciseMuscleData, setExerciseMuscleData] = useState<Map<string, ExerciseMuscleData>>(new Map());
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [muscleVolume, setMuscleVolume] = useState<Map<string, MuscleVolumeEntry>>(new Map());
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset> | null>(null);
  const [weeklySetsWindow, setWeeklySetsWindow] = useState<WeeklySetsWindow>('30d');
  const [viewMode, setViewMode] = useState<ViewMode>('headless');
  const [weeklySetsChartView, setWeeklySetsChartView] = useState<'heatmap' | 'radar'>('heatmap');
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterCategory | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<TooltipData | null>(null);

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

  const effectiveNow = useMemo(() => now ?? getEffectiveNowFromWorkoutData(data), [now, data]);

  const allTimeWindowStart = useMemo(() => {
    let start: Date | null = null;
    for (const s of data) {
      const d = s.parsedDate;
      if (!d) continue;
      if (!start || d < start) start = d;
    }
    return start;
  }, [data]);

  const windowStart = useMemo(() => {
    if (!allTimeWindowStart) return null;
    if (weeklySetsWindow === 'all') return allTimeWindowStart;

    // Show current period + previous period (2x window) for better visual comparison
    const candidate =
      weeklySetsWindow === '7d'
        ? subDays(effectiveNow, 14)   // current week + previous week
        : weeklySetsWindow === '30d'
          ? subDays(effectiveNow, 60) // current month + previous month
          : subDays(effectiveNow, 730); // current year + previous year

    // Clamp to the user's first workout date so we don't include pre-history empty time.
    return allTimeWindowStart > candidate ? allTimeWindowStart : candidate;
  }, [weeklySetsWindow, effectiveNow, allTimeWindowStart]);

  const getChipTextColor = useCallback((sets: number, maxSets: number): string => {
    const ratio = sets / Math.max(maxSets, 1);
    return ratio >= 0.55 ? '#ffffff' : '#0f172a';
  }, []);

  // Load exercise muscle data and assets on mount
  useEffect(() => {
    loadExerciseMuscleData().then(loadedData => {
      setExerciseMuscleData(loadedData);
      setIsLoading(false);
    });
    getExerciseAssets()
      .then(m => setAssetsMap(m))
      .catch(() => setAssetsMap(new Map()));
  }, []);

  // Calculate muscle volumes whenever data or windowStart changes
  useEffect(() => {
    if (exerciseMuscleData.size === 0 || data.length === 0) {
      setMuscleVolume(new Map());
      return;
    }

    // Filter data based on selected window to ensure BodyMap matches the time period
    let processedData = data;
    if (windowStart) {
      processedData = data.filter(s => s.parsedDate && s.parsedDate >= windowStart);
    }

    calculateMuscleVolume(processedData, exerciseMuscleData).then(setMuscleVolume);
  }, [data, exerciseMuscleData, windowStart]);

  // Apply initial muscle selection from dashboard navigation
  useEffect(() => {
    if (initialMuscle && !isLoading) {
      setViewMode(initialMuscle.viewMode);
      selectedSvgIdForUrlRef.current = initialMuscle.muscleId;
      if (initialMuscle.viewMode === 'group') {
        // For group mode, get the group name from the muscle ID
        const group = MUSCLE_GROUP_DISPLAY[initialMuscle.muscleId];
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

  // Window-based heatmap volumes that update based on selected time filter
  const weeklySetsDashboardMuscles = useMemo(() => {
    if (!assetsMap) return null;

    const window: WeeklySetsWindow = weeklySetsWindow === 'all' ? 'all' : weeklySetsWindow;
    const cacheKey = `weeklySetsDashboard:v2:${window}:muscles`;
    return computationCache.getOrCompute(
      cacheKey,
      data,
      () => computeWeeklySetsDashboardData(data, assetsMap, effectiveNow, window, 'muscles'),
      { ttl: 10 * 60 * 1000 }
    );
  }, [assetsMap, data, effectiveNow, weeklySetsWindow]);

  const weeklySetsDashboardGroups = useMemo(() => {
    if (!assetsMap) return null;

    const window: WeeklySetsWindow = weeklySetsWindow === 'all' ? 'all' : weeklySetsWindow;
    const cacheKey = `weeklySetsDashboard:v2:${window}:groups`;
    return computationCache.getOrCompute(
      cacheKey,
      data,
      () => computeWeeklySetsDashboardData(data, assetsMap, effectiveNow, window, 'groups'),
      { ttl: 10 * 60 * 1000 }
    );
  }, [assetsMap, data, effectiveNow, weeklySetsWindow]);

  const windowedHeatmapData = useMemo(() => {
    if (!assetsMap || !windowStart) return { volumes: new Map<string, number>(), maxVolume: 1 };

    if (viewMode === 'group') {
      return weeklySetsDashboardGroups?.heatmap ?? { volumes: new Map<string, number>(), maxVolume: 1 };
    }

    const heatmap = weeklySetsDashboardMuscles?.heatmap ?? { volumes: new Map<string, number>(), maxVolume: 1 };
    if (viewMode !== 'headless') return heatmap;

    // Convert detailed svg-id volumes to headless ids (group SVG regions).
    // Use MAX aggregation to avoid double-counting when upstream propagation assigns the
    // same contribution to multiple detailed SVG parts for one anatomical muscle.
    const headlessVolumes = toHeadlessVolumeMap(heatmap.volumes);
    const headlessMaxVolume = Math.max(1, ...Array.from(headlessVolumes.values()));
    return { volumes: headlessVolumes, maxVolume: headlessMaxVolume };
  }, [assetsMap, windowStart, viewMode, weeklySetsDashboardGroups, weeklySetsDashboardMuscles]);

  // Get volumes for heatmap - now uses windowed data
  const muscleVolumes = useMemo(() => {
    return windowedHeatmapData.volumes;
  }, [windowedHeatmapData]);

  // Max volume for scaling - now uses windowed data
  const maxVolume = useMemo(() => {
    return Math.max(windowedHeatmapData.maxVolume, 1);
  }, [windowedHeatmapData]);

  // Window-based group volumes for group view - calculated from the same windowed data
  const windowedGroupVolumes = useMemo(() => {
    const groupVolumes = new Map<NormalizedMuscleGroup, number>();
    MUSCLE_GROUP_ORDER.forEach(g => groupVolumes.set(g, 0));

    if (!assetsMap || !windowStart) return groupVolumes;

    const weeklyRatesBySubject = weeklySetsDashboardGroups?.weeklyRatesBySubject;
    if (!weeklyRatesBySubject) return groupVolumes;

    // Use the unsliced per-subject weekly rates for accuracy and consistency with dashboard hover.
    for (const [subject, value] of weeklyRatesBySubject.entries()) {
      const group = subject as NormalizedMuscleGroup;
      if (MUSCLE_GROUP_ORDER.includes(group)) groupVolumes.set(group, value);
    }

    return groupVolumes;
  }, [assetsMap, windowStart, weeklySetsDashboardGroups]);

  // Body map volumes for group view - now uses windowed data
  const groupedBodyMapVolumes = useMemo(() => {
    const volumes = new Map<string, number>();
    Object.entries(MUSCLE_GROUP_DISPLAY).forEach(([svgId, group]) => {
      if (group !== 'Other') {
        volumes.set(svgId, windowedGroupVolumes.get(group) || 0);
      }
    });
    return volumes;
  }, [windowedGroupVolumes]);

  // Max group volume for scaling - now uses windowed data
  const maxGroupVolume = useMemo(() => {
    let max = 0;
    windowedGroupVolumes.forEach(v => {
      if (v > max) max = v;
    });
    return Math.max(max, 1);
  }, [windowedGroupVolumes]);

  const selectedSubjectKeys = useMemo(() => {
    return resolveSelectedSubjectKeys({ viewMode, selectedMuscle, activeQuickFilter });
  }, [activeQuickFilter, selectedMuscle, viewMode]);

  const groupWeeklyRatesBySubject = useMemo(() => {
    if (!assetsMap || !windowStart) return null;
    return weeklySetsDashboardGroups?.weeklyRatesBySubject ?? null;
  }, [assetsMap, windowStart, weeklySetsDashboardGroups]);

  // Pre-calculate per-muscle weekly rates for tooltip consistency
  // This calculates values EXACTLY as the sidebar would for a single selected muscle
  const headlessRatesMap = useMemo(() => {
    if (!assetsMap || !windowStart) return new Map<string, number>();
    const heatmap = weeklySetsDashboardMuscles?.heatmap;
    if (!heatmap) return new Map<string, number>();

    // Derive headless weekly rates from the same cached weekly-sets computation the Dashboard uses.
    return toHeadlessVolumeMap(heatmap.volumes);
  }, [assetsMap, windowStart, weeklySetsDashboardMuscles]);

  const radarData = useMemo(() => getHeadlessRadarSeries(headlessRatesMap), [headlessRatesMap]);

  const weeklySetsSummary = useMemo(() => {
    if (viewMode === 'headless') {
      if (selectedSubjectKeys.length > 0) {
        let sum = 0;
        for (const k of selectedSubjectKeys) sum += headlessRatesMap.get(k) ?? 0;
        return Math.round(sum * 10) / 10;
      }

      let sum = 0;
      for (const v of headlessRatesMap.values()) sum += v;
      return Math.round(sum * 10) / 10;
    }

    return computeWeeklySetsSummary({
      assetsMap,
      windowStart,
      selectedSubjectKeys,
      viewMode,
      data,
      effectiveNow,
      groupWeeklyRatesBySubject,
    });
  }, [assetsMap, windowStart, selectedSubjectKeys, viewMode, data, effectiveNow, groupWeeklyRatesBySubject, headlessRatesMap]);

  const weeklySetsDelta = useMemo(() => {
    return computeWeeklySetsDelta({
      assetsMap,
      windowStart,
      weeklySetsWindow,
      selectedSubjectKeys,
      viewMode,
      data,
      effectiveNow,
      allTimeWindowStart,
    });
  }, [assetsMap, windowStart, weeklySetsWindow, selectedSubjectKeys, viewMode, data, effectiveNow, allTimeWindowStart]);

  // Trend chart: constrained to selected window; resolution depends on window size.
  const trendData = useMemo(() => {
    if (!assetsMap || data.length === 0) return [];
    if (!windowStart) return [];

    const isGroupMode = viewMode === 'group';
    const isAll = weeklySetsWindow === 'all';

    // Choose chart period/bucketing
    let chartPeriod: 'weekly' | 'monthly' = 'weekly';
    let shouldBucketToWeeks = false;

    if (isAll) {
      const spanDays = Math.max(1, differenceInCalendarDays(effectiveNow, windowStart) + 1);
      if (spanDays < 35) {
        chartPeriod = 'weekly';
      } else if (spanDays < 150) {
        chartPeriod = 'weekly';
        shouldBucketToWeeks = true;
      } else {
        chartPeriod = 'monthly';
      }
    } else if (weeklySetsWindow === '365d') {
      chartPeriod = 'weekly';
      shouldBucketToWeeks = true;
    } else {
      chartPeriod = 'weekly';
    }

    const baseSeries = isGroupMode
      ? getMuscleVolumeTimeSeriesRolling(data, assetsMap, chartPeriod, true)
      : getSvgMuscleVolumeTimeSeriesRolling(data, assetsMap, chartPeriod);

    const series = shouldBucketToWeeks
      ? bucketRollingWeeklySeriesToWeeks(baseSeries as any)
      : baseSeries;

    if (!series.data || series.data.length === 0) return [];

    const filtered = series.data.filter((row: any) => {
      const ts = typeof row.timestamp === 'number' ? row.timestamp : 0;
      if (!ts) return false;
      return ts >= windowStart.getTime() && ts <= effectiveNow.getTime();
    });

    const keys = selectedSubjectKeys;

    return filtered.map((row: any) => {
      const sumAll = () => (baseSeries.keys || []).reduce((acc, k) => acc + (typeof row[k] === 'number' ? row[k] : 0), 0);

      const sumHeadlessSelected = () => {
        if (keys.length === 0) return sumAll();
        let acc = 0;
        for (const headlessId of keys) {
          const detailed = (HEADLESS_ID_TO_DETAILED_SVG_IDS as any)[headlessId] as readonly string[] | undefined;
          if (!detailed) continue;
          for (const d of detailed) acc += (typeof row[d] === 'number' ? (row[d] as number) : 0);
        }
        return acc;
      };

      const v = viewMode === 'headless'
        ? sumHeadlessSelected()
        : keys.length > 0
          ? keys.reduce((acc, k) => acc + (typeof row[k] === 'number' ? row[k] : 0), 0)
          : sumAll();
      return {
        period: row.dateFormatted,
        timestamp: row.timestamp,
        sets: Math.round(Number(v) * 10) / 10,
      };
    });
  }, [assetsMap, data, windowStart, effectiveNow, weeklySetsWindow, viewMode, selectedSubjectKeys]);

  const trendDataWithEma = trendData;

  const volumeDelta = weeklySetsDelta;

  const windowedSelectionBreakdown = useMemo(() => {
    if (!assetsMap || !windowStart) return null;

    const grouping = viewMode === 'group' ? 'groups' : 'muscles';

    const selectedForBreakdown =
      viewMode === 'headless'
        ? selectedSubjectKeys.flatMap((h) => (HEADLESS_ID_TO_DETAILED_SVG_IDS as any)[h] ?? [])
        : selectedSubjectKeys;

    return computeWindowedExerciseBreakdown({
      data,
      assetsMap,
      start: windowStart,
      end: effectiveNow,
      grouping,
      selectedSubjects: selectedForBreakdown,
    });
  }, [assetsMap, windowStart, effectiveNow, viewMode, selectedSubjectKeys, data]);

  // Contributing exercises (works for muscle, group, and quick filter views)
  const contributingExercises = useMemo(() => {
    if (!windowedSelectionBreakdown) return [];
    const exercises: Array<{ name: string; sets: number; primarySets: number; secondarySets: number }> = [];
    windowedSelectionBreakdown.exercises.forEach((exData, name) => {
      exercises.push({ name, ...exData });
    });
    return exercises.sort((a, b) => b.sets - a.sets).slice(0, 8);
  }, [windowedSelectionBreakdown]);

  // Total sets for the period
  const totalSets = useMemo(() => {
    return data.length;
  }, [data]);

  // Muscles worked count
  const musclesWorked = useMemo(() => {
    if (viewMode === 'muscle') {
      let count = 0;
      muscleVolume.forEach(entry => { if (entry.sets > 0) count++; });
      return count;
    }

    if (viewMode === 'headless') {
      let count = 0;
      for (const v of muscleVolumes.values()) {
        if ((v ?? 0) > 0) count += 1;
      }
      return count;
    }

    let count = 0;
    for (const g of MUSCLE_GROUP_ORDER) {
      if ((windowedGroupVolumes.get(g) ?? 0) > 0) count += 1;
    }
    return count;
  }, [viewMode, windowedGroupVolumes, muscleVolumes, muscleVolume]);

  const handleMuscleClick = useCallback((muscleId: string) => {
    // Clear quick filter when clicking a specific muscle
    setActiveQuickFilter(null);
    if (viewMode === 'group') {
      // In group view, clicking a muscle selects its group
      const group = getGroupForSvgId(muscleId);
      if (group === 'Other') return;
      setSelectedMuscle(prev => {
        const next = prev === group ? null : group;
        if (!next) {
          selectedSvgIdForUrlRef.current = null;
          clearSelectionUrl();
        } else {
          selectedSvgIdForUrlRef.current = muscleId;
          updateSelectionUrl({ svgId: muscleId, mode: 'group', window: weeklySetsWindow });
        }
        return next;
      });
    } else if (viewMode === 'headless') {
      setSelectedMuscle(prev => {
        const next = prev === muscleId ? null : muscleId;
        if (!next) {
          selectedSvgIdForUrlRef.current = null;
          clearSelectionUrl();
        } else {
          selectedSvgIdForUrlRef.current = muscleId;
          updateSelectionUrl({ svgId: muscleId, mode: 'headless', window: weeklySetsWindow });
        }
        return next;
      });
    } else {
      setSelectedMuscle(prev => {
        const next = prev === muscleId ? null : muscleId;
        if (!next) {
          selectedSvgIdForUrlRef.current = null;
          clearSelectionUrl();
        } else {
          selectedSvgIdForUrlRef.current = muscleId;
          updateSelectionUrl({ svgId: muscleId, mode: 'muscle', window: weeklySetsWindow });
        }
        return next;
      });
    }
  }, [viewMode, clearSelectionUrl, updateSelectionUrl, weeklySetsWindow]);

  const handleMuscleHover = useCallback((muscleId: string | null, e?: MouseEvent) => {
    setHoveredMuscle(muscleId);
    if (!muscleId || !e) {
      setHoverTooltip(null);
      return;
    }

    const target = e.target as Element | null;
    const groupEl = target?.closest?.('g[id]') as Element | null;
    const rect = groupEl?.getBoundingClientRect?.() as DOMRect | undefined;
    if (!rect) {
      setHoverTooltip(null);
      return;
    }

    // Compute tooltip content inline (avoid relying on hoveredTooltipMeta which is async)
    if (viewMode === 'group') {
      const groupName = MUSCLE_GROUP_DISPLAY[muscleId];
      if (!groupName || groupName === 'Other') {
        setHoverTooltip(null);
        return;
      }

      const sets = windowedGroupVolumes.get(groupName as any) || 0;
      setHoverTooltip({
        rect,
        title: groupName,
        body: `${Math.round(sets * 10) / 10} sets`,
        status: sets > 0 ? 'success' : 'default',
      });
      return;
    }

    if (viewMode === 'headless') {
      // Use pre-calculated rate which matches sidebar logic
      const rate = headlessRatesMap.get(muscleId) || 0;
      const bodyText = `${rate.toFixed(1)} sets/wk`;

      setHoverTooltip({
        rect,
        title: (HEADLESS_MUSCLE_NAMES as any)[muscleId] ?? muscleId,
        body: bodyText,
        status: rate > 0 ? 'success' : 'default',
      });
      return;
    }

    const sets = headlessRatesMap.get(muscleId) || 0;
    setHoverTooltip({
      rect,
      title: SVG_MUSCLE_NAMES[muscleId] ?? muscleId,
      body: `${sets.toFixed(1)} sets/wk`,
      status: sets > 0 ? 'success' : 'default',
    });
  }, [windowedGroupVolumes, headlessRatesMap, viewMode]);

  const selectedBodyMapIds = useMemo(() => {
    // Quick filter takes precedence for highlighting (works in both view modes)
    if (activeQuickFilter) {
      if (viewMode === 'headless') {
        const ids = new Set<string>();
        for (const d of getSvgIdsForQuickFilter(activeQuickFilter)) {
          const h = getHeadlessIdForDetailedSvgId(d);
          if (h) ids.add(h);
        }
        return [...ids];
      }
      return [...getSvgIdsForQuickFilter(activeQuickFilter)];
    }
    if (!selectedMuscle) return undefined;
    if (viewMode === 'muscle') return undefined;

    if (viewMode === 'headless') return [selectedMuscle];

    const group = selectedMuscle as NormalizedMuscleGroup;
    if (!MUSCLE_GROUP_ORDER.includes(group)) return undefined;

    return [...getSvgIdsForGroup(group)];
  }, [selectedMuscle, viewMode, activeQuickFilter]);

  const hoveredBodyMapIds = useMemo(() => {
    if (!hoveredMuscle) return undefined;
    if (viewMode === 'muscle') return undefined;

    if (viewMode === 'headless') return [hoveredMuscle];

    const group = getGroupForSvgId(hoveredMuscle);
    if (group === 'Other') return undefined;

    return [...getSvgIdsForGroup(group)];
  }, [hoveredMuscle, viewMode]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading muscle data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-slate-400 mb-2">No workout data for current filter</div>
        <div className="text-slate-500 text-sm">Try adjusting your date filter to see muscle analysis</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header - consistent with Dashboard */}
      <div className="hidden sm:contents">
        <ViewHeader
          leftStats={[{ icon: Activity, value: totalSets, label: 'Total Sets' }]}
          rightStats={[{ icon: Dumbbell, value: musclesWorked, label: 'Muscles' }]}
          filtersSlot={filtersSlot}
          sticky={stickyHeader}
        />
      </div>

      {/* Main Content - Always Side by Side Layout */}
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
        {/* Left: Body Map */}
        <div className="bg-black/70 rounded-xl border border-slate-700/50 p-4 relative flex flex-col min-h-0">
          {/* Top Bar: Quick Filters (left) + Time Window (right) */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
            {/* Quick Filters - Left */}
            <div className="flex items-center gap-1 bg-black/70 rounded-lg p-1 shadow-lg">
              {(['PUS', 'PUL', 'LEG'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => handleQuickFilterClick(filter)}
                  title={QUICK_FILTER_LABELS[filter]}
                  className={`px-1 py-0.5 rounded text-[9px] font-bold transition-all ${activeQuickFilter === filter
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Heatmap / Radar view - center */}
            <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-700/50 shrink-0">
              <button
                onClick={() => setWeeklySetsChartView('heatmap')}
                title="Heatmap"
                aria-label="Heatmap"
                className={`w-6 h-5 flex items-center justify-center rounded ${weeklySetsChartView === 'heatmap' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                <Grid3X3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setWeeklySetsChartView('radar')}
                title="Radar"
                aria-label="Radar"
                className={`w-6 h-5 flex items-center justify-center rounded ${weeklySetsChartView === 'radar' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                <Scan className="w-3 h-3" />
              </button>
            </div>

            {/* Time Window Toggle - Right */}
            <div className="inline-flex bg-black/70 rounded-lg p-0.5 border border-slate-700/50">
              {(['all', '7d', '30d', '365d'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => {
                    setWeeklySetsWindow(w);
                    const svgId = selectedSvgIdForUrlRef.current;
                    if (!svgId) return;
                    updateSelectionUrl({ svgId, mode: viewMode, window: w });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${weeklySetsWindow === w
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  title={w === 'all' ? 'All time' : w === '7d' ? 'Last week' : w === '30d' ? 'Last month' : 'Last year'}
                >
                  {w === 'all' ? <Infinity className="w-2.5 h-2.5" /> : w === '7d' ? 'lst wk' : w === '30d' ? 'lst mo' : 'lst yr'}
                </button>
              ))}
            </div>
          </div>

          {weeklySetsChartView === 'radar' ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 pt-10">
            {radarData.some((d) => (d.value ?? 0) > 0) ? (
              <div className="w-full min-h-[280px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={({ payload, x, y, index, cx, cy }: { payload?: { subject?: string }; x?: number; y?: number; index?: number; cx?: number; cy?: number }) => {
                        const label = radarData[index ?? 0]?.subject ?? payload?.subject ?? '';
                        const px = x ?? 0;
                        const py = y ?? 0;
                        const outward = 1.18;
                        const tx = cx != null && cy != null ? cx + (px - cx) * outward : px;
                        const ty = cx != null && cy != null ? cy + (py - cy) * outward : py;
                        return (
                          <g transform={`translate(${tx},${ty})`}>
                            <text fill={RADAR_TICK_FILL} fontSize={11} textAnchor="middle" dominantBaseline="middle">
                              {label}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar
                      name="Weekly Sets"
                      dataKey="value"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fill="#06b6d4"
                      fillOpacity={0.35}
                      animationDuration={1500}
                    />
                    <RechartsTooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      formatter={(value: number) => [`${Number(value).toFixed(1)} sets/wk`]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[280px] text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg mx-2 w-full">
                No muscle composition for this period yet.
              </div>
            )}
          </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 pt-10">
              <div className="sm:transform sm:scale-[0.8] sm:origin-middle">
                <BodyMap
                  onPartClick={handleMuscleClick}
                  selectedPart={selectedMuscle}
                  selectedMuscleIdsOverride={selectedBodyMapIds}
                  hoveredMuscleIdsOverride={hoveredBodyMapIds}
                  muscleVolumes={viewMode === 'group' ? groupedBodyMapVolumes : muscleVolumes}
                  maxVolume={viewMode === 'group' ? maxGroupVolume : maxVolume}
                  onPartHover={handleMuscleHover}
                  gender={bodyMapGender}
                  viewMode={viewMode}
                />
              </div>

              <div className="sm:hidden mb-10 text-center text-[11px] font-semibold text-slate-600">
                Tap to see more details
              </div>

              {/* Color Legend - Bottom of body map */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/75 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                    <span>None</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--heatmap-hue), 75%, 75%)' }}></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--heatmap-hue), 75%, 50%)' }}></div>
                    <span>Med</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--heatmap-hue), 75%, 25%)' }}></div>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hover Tooltip */}
          {hoverTooltip && <HoverTooltip data={hoverTooltip} />}
        </div>

        {/* Right: Detail Panel - Always visible */}
        <div className="bg-black/70 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Panel Header */}
          <div className="bg-black/70 border-b border-slate-800/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h2 className="text-lg font-bold text-white truncate">
                {activeQuickFilter
                  ? QUICK_FILTER_LABELS[activeQuickFilter]
                  : selectedMuscle
                    ? (viewMode === 'group'
                      ? selectedMuscle
                      : viewMode === 'headless'
                        ? ((HEADLESS_MUSCLE_NAMES as any)[selectedMuscle] ?? selectedMuscle)
                        : SVG_MUSCLE_NAMES[selectedMuscle])
                    : (viewMode === 'group' ? 'All Groups' : viewMode === 'headless' ? 'All Muscles' : 'All Muscles')}
              </h2>
              <span
                className="text-red-400 text-sm font-semibold whitespace-nowrap"
                title={activeQuickFilter || selectedMuscle ? 'sets in current filter' : ''}
              >
                {activeQuickFilter || selectedMuscle
                  ? `${Math.round((windowedSelectionBreakdown?.totalSetsInWindow ?? 0) * 10) / 10} sets`
                  : null}
              </span>
              <span
                className="text-cyan-400 text-sm font-semibold whitespace-nowrap"
                title="avg weekly sets in selected window"
              >
                {weeklySetsSummary !== null && `${weeklySetsSummary.toFixed(1)} sets/wk`}
              </span>
              {/* Volume Delta Badge */}
              {volumeDelta && volumeDelta.direction !== 'same' && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${volumeDelta.direction === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
                  }`}>
                  {volumeDelta.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {volumeDelta.formattedPercent} vs prev {weeklySetsWindow === '7d' ? 'wk' : weeklySetsWindow === '30d' ? 'mo' : 'yr'}
                </span>
              )}
            </div>
            {(selectedMuscle || activeQuickFilter) && (
              <button
                onClick={() => {
                  setSelectedMuscle(null);
                  setActiveQuickFilter(null);
                  selectedSvgIdForUrlRef.current = null;
                  clearSelectionUrl();
                }}
                className="p-1.5 hover:bg-black/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Fixed content area */}
          <div className="p-3 space-y-3">
            {/* Trend Chart - Period toggle moved to top bar */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-white">Weekly sets</h3>
                </div>
              </div>
              <div className="h-32 bg-black/50 rounded-lg p-2">
                {trendData.length > 0 ? (
                  <LazyRender className="w-full h-full" placeholder={<ChartSkeleton className="h-full" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendDataWithEma}>
                        <defs>
                          <linearGradient id="muscleColorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={volumeDelta?.direction === 'down' ? '#f43f5e' : '#10b981'} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={volumeDelta?.direction === 'down' ? '#f43f5e' : '#10b981'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="period"
                          tick={{ fill: '#64748b', fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                          padding={RECHARTS_XAXIS_PADDING as any}
                          interval={getRechartsXAxisInterval(trendDataWithEma.length, 7)}
                        />
                        <YAxis hide />
                        <RechartsTooltip
                          contentStyle={CHART_TOOLTIP_STYLE}
                          labelStyle={{ color: 'var(--text-primary)' }}
                          formatter={(value: number) => {
                            const v = formatNumber(Number(value), { maxDecimals: 1 });
                            return [`${v} sets/wk`];
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="sets"
                          stroke={volumeDelta?.direction === 'down' ? '#f43f5e' : '#10b981'}
                          strokeWidth={2}
                          fill="url(#muscleColorGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </LazyRender>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No muscle data for this period yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Exercises Section */}
          {windowedSelectionBreakdown && (
            <div className="border-t border-slate-800/30">

              <div className="overflow-y-auto h-64 sm:h-80 px-4 mt-2 scroll-smooth">
                <div className="space-y-2 pb-4">
                  {contributingExercises.map((ex, i) => {
                    const asset = assetsMap?.get(ex.name);
                    const exData = lookupExerciseMuscleData(ex.name, exerciseMuscleData);
                    const { volumes: exVolumes, maxVolume: exMaxVol } = getExerciseMuscleVolumes(exData);
                    const exHeadlessVolumes = toHeadlessVolumeMap(exVolumes);
                    const exHeadlessMaxVol = Math.max(1, ...Array.from(exHeadlessVolumes.values()));
                    const totalSetsForCalc = windowedSelectionBreakdown?.totalSetsInWindow || 1;
                    const pct = totalSetsForCalc > 0 ? Math.round((ex.sets / totalSetsForCalc) * 100) : 0;

                    const isPrimary = ex.primarySets > 0;
                    const isSecondary = ex.secondarySets > 0;
                    const chipBg = getVolumeColor(ex.sets, totalSetsForCalc);
                    const chipFg = getChipTextColor(ex.sets, totalSetsForCalc);
                    const setsRounded = Math.round(ex.sets * 10) / 10;
                    const primaryRounded = Math.round(ex.primarySets * 10) / 10;
                    const secondaryRounded = Math.round(ex.secondarySets * 10) / 10;

                    return (
                      <button
                        key={ex.name}
                        onClick={() => onExerciseClick?.(ex.name)}
                        type="button"
                        className="group relative w-full text-left rounded-lg bg-black/50 p-2 shadow-sm transition-all focus:outline-none border border-transparent hover:border-slate-600/40"
                        title={ex.name}
                      >

                        <div className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr_5.25rem] items-stretch gap-2">
                          {/* First column: Image/Icon */}
                          <div className="flex items-center justify-center">
                            <div className="w-full aspect-square">
                              <ExerciseThumbnail
                                asset={asset}
                                className="h-full w-full rounded-md"
                                imageClassName="h-full w-full rounded-md object-cover bg-white"
                              />
                            </div>
                          </div>

                          {/* Middle column: Content */}
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-2 min-w-0 pt-1">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white truncate">{ex.name}</div>
                              </div>
                            </div>

                            <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] pb-1">
                              <div className="text-slate-400">
                                {pct}% of sets
                              </div>
                              {isPrimary && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-200"
                                  title={`${primaryRounded} direct set${primaryRounded === 1 ? '' : 's'}`}
                                >
                                  {primaryRounded} direct set{primaryRounded === 1 ? '' : 's'}
                                </span>
                              )}
                              {isSecondary && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-200"
                                  title={`${secondaryRounded} indirect set${secondaryRounded === 1 ? '' : 's'}`}
                                >
                                  {secondaryRounded} indirect set{secondaryRounded === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right column: BodyMap */}
                          <div className="hidden sm:flex w-[5.25rem] justify-end">
                            <div className="h-full w-[5.25rem] rounded-md p-1">
                              <div className="h-full w-full flex items-center justify-center">
                                <BodyMap
                                  onPartClick={() => { }}
                                  selectedPart={null}
                                  muscleVolumes={exHeadlessVolumes}
                                  maxVolume={exHeadlessMaxVol}
                                  compact
                                  compactFill
                                  viewMode="headless"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {contributingExercises.length === 0 && (
                    <div className="text-center text-slate-500 py-4">
                      No exercises found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hint when no muscle selected */}
          {!selectedMuscle && (
            <div className="p-4 pt-0">
              <p className="text-xs text-slate-500 text-center py-2">
                Click on a {viewMode === 'group' ? 'muscle group' : 'muscle'} to see its exercises
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
