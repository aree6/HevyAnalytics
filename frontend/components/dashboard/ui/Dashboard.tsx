import React, { useMemo, useState, useEffect } from 'react';
import { DailySummary, ExerciseStats, WorkoutSet } from '../../../types';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import { getSmartFilterMode, TimeFilterMode, WeightUnit } from '../../../utils/storage/localStorage';
import { CHART_TOOLTIP_STYLE, CHART_COLORS, ANIMATION_KEYFRAMES } from '../../../utils/ui/uiConstants';
import { getEffectiveNowFromWorkoutData, getSessionKey } from '../../../utils/date/dateUtils';
import { getExerciseAssets, ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { calculateDashboardInsights } from '../../../utils/analysis/insights';
import { computationCache } from '../../../utils/storage/computationCache';
import { dashboardCacheKeys } from '../../../utils/storage/cacheKeys';
import { prefetchExerciseData } from '../../../utils/prefetch/prefetchStrategies';
import { isWarmupSet } from '../../../utils/analysis/classification';
import { useDashboardIntensityEvolution } from '../hooks/useDashboardIntensityEvolution';
import { useDashboardMuscleTrend } from '../hooks/useDashboardMuscleTrend';
import { useDashboardPrTrend } from '../hooks/useDashboardPrTrend';
import { useDashboardTopExercises } from '../hooks/useDashboardTopExercises';
import { useDashboardVolumeDensity } from '../hooks/useDashboardVolumeDensity';
import { useDashboardWeeklySetsDashboard } from '../hooks/useDashboardWeeklySetsDashboard';
import { useTheme } from '../../theme/ThemeProvider';
import { DashboardLayout } from './DashboardLayout';
import { useDashboardPlateaus } from '../hooks/useDashboardPlateaus';
import { useWeeklyRhythm } from '../hooks/useWeeklyRhythm';

interface DashboardProps {
  dailyData: DailySummary[];
  exerciseStats: ExerciseStats[];
  fullData: WorkoutSet[];
  filterCacheKey: string;
  onDayClick?: (date: Date) => void;
  onMuscleClick?: (
    muscleId: string,
    viewMode: 'muscle' | 'group' | 'headless',
    weeklySetsWindow: 'all' | '7d' | '30d' | '365d'
  ) => void;
  onExerciseClick?: (exerciseName: string) => void;
  filtersSlot?: React.ReactNode;
  stickyHeader?: boolean;
  bodyMapGender?: BodyMapGender;
  weightUnit?: WeightUnit;
  now?: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({
  dailyData,
  exerciseStats,
  fullData,
  filterCacheKey,
  onDayClick,
  onMuscleClick,
  onExerciseClick,
  filtersSlot,
  stickyHeader = false,
  bodyMapGender = 'male' as BodyMapGender,
  weightUnit = 'kg' as WeightUnit,
  now,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const { mode: themeMode } = useTheme();

  const effectiveNow = useMemo(() => now ?? getEffectiveNowFromWorkoutData(fullData), [now, fullData]);

  const spanDays = useMemo(() => {
    if (!fullData.length) return 0;
    const dates = fullData.map((s) => s.parsedDate?.getTime() || 0).filter((t) => t > 0);
    if (dates.length === 0) return 0;
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return Math.max(1, Math.round((max - min) / (1000 * 60 * 60 * 24)) + 1);
  }, [fullData]);

  const smartMode = useMemo(() => getSmartFilterMode(spanDays), [spanDays]);

  const allAggregationMode = useMemo<'daily' | 'weekly' | 'monthly'>(() => {
    return smartMode === 'all' ? 'daily' : smartMode;
  }, [smartMode]);

  const totalWorkouts = useMemo(() => {
    const sessions = new Set<string>();
    for (const s of fullData) {
      if (isWarmupSet(s)) continue;
      const key = getSessionKey(s);
      if (!key) continue;
      sessions.add(key);
    }
    return sessions.size;
  }, [fullData]);

  const [chartOverrides, setChartOverrides] = useState<Record<string, TimeFilterMode | null>>({
    volumeVsDuration: null,
    intensityEvo: null,
    prTrend: null,
  });

  const chartModes = useMemo(() => ({
    volumeVsDuration: chartOverrides.volumeVsDuration ?? 'monthly',
    intensityEvo: chartOverrides.intensityEvo ?? 'monthly',
    prTrend: chartOverrides.prTrend ?? 'monthly',
  }), [chartOverrides]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleChartMode = (chart: string, mode: TimeFilterMode) => {
    setChartOverrides((prev) => ({ ...prev, [chart]: mode }));
  };

  const [topExerciseMode, setTopExerciseMode] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [topExercisesView, setTopExercisesView] = useState<'barh' | 'area'>('barh');

  const [prTrendView, setPrTrendView] = useState<'area' | 'bar'>('area');
  const [volumeView, setVolumeView] = useState<'area' | 'bar'>('area');
  const [intensityView, setIntensityView] = useState<'area' | 'stackedBar'>('area');
  const [weekShapeView, setWeekShapeView] = useState<'radar' | 'bar'>('radar');

  const [muscleGrouping, setMuscleGrouping] = useState<'groups' | 'muscles'>('groups');
  const [musclePeriod, setMusclePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [muscleTrendView, setMuscleTrendView] = useState<'area' | 'stackedBar'>('stackedBar');
  const [muscleCompQuick, setMuscleCompQuick] = useState<'all' | '7d' | '30d' | '365d'>('30d');
  const [compositionGrouping, setCompositionGrouping] = useState<'groups' | 'muscles'>('muscles');
  const [weeklySetsView, setWeeklySetsView] = useState<'radar' | 'heatmap'>('heatmap');

  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset> | null>(null);

  const assetsLowerMap = useMemo(() => {
    if (!assetsMap) return null;
    const m = new Map<string, ExerciseAsset>();
    assetsMap.forEach((v, k) => m.set(k.toLowerCase(), v));
    return m;
  }, [assetsMap]);

  useEffect(() => {
    let mounted = true;
    getExerciseAssets().then((m) => { if (mounted) setAssetsMap(m); }).catch(() => setAssetsMap(new Map()));
    return () => { mounted = false; };
  }, []);

  const totalPrs = useMemo(() => exerciseStats.reduce((acc, curr) => acc + curr.prCount, 0), [exerciseStats]);

  const totalSets = useMemo(() => {
    let count = 0;
    for (const s of fullData) {
      if (isWarmupSet(s)) continue;
      count += 1;
    }
    return count;
  }, [fullData]);

  const dashboardInsights = useMemo(() => {
    const cacheKey = dashboardCacheKeys.dashboardInsights(filterCacheKey);
    return computationCache.getOrCompute(
      cacheKey,
      fullData,
      () => calculateDashboardInsights(fullData, dailyData, effectiveNow),
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, dailyData, effectiveNow, filterCacheKey]);

  // Prefetch Exercise view data after 3 seconds on Dashboard
  useEffect(() => {
    if (fullData.length === 0) return;
    
    const timer = setTimeout(() => {
      prefetchExerciseData(filterCacheKey, fullData);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [filterCacheKey, fullData]);

  const { activePlateauExercises } = useDashboardPlateaus({
    fullData,
    exerciseStats,
    weightUnit,
    effectiveNow,
    filterCacheKey,
  });

  const { prsData, prTrendDelta, prTrendDelta7d } = useDashboardPrTrend({
    fullData,
    rangeMode: chartModes.prTrend,
    allAggregationMode,
    effectiveNow,
    dashboardInsights,
    filterCacheKey,
  });

  const { intensityData, intensityInsight } = useDashboardIntensityEvolution({
    fullData,
    rangeMode: chartModes.intensityEvo,
    allAggregationMode,
    effectiveNow,
    filterCacheKey,
  });

  const { volumeDurationData, volumeDensityTrend } = useDashboardVolumeDensity({
    dailyData,
    rangeMode: chartModes.volumeVsDuration,
    smartMode,
    weightUnit,
    effectiveNow,
    dashboardInsights,
    filterCacheKey,
  });

  const { weekShapeData, weeklyRhythmInsight } = useWeeklyRhythm(dailyData);

  const { topExercisesBarData, topExercisesOverTimeData, topExerciseNames, topExercisesInsight } = useDashboardTopExercises({
    fullData,
    exerciseStats,
    topExerciseMode,
    allAggregationMode,
    effectiveNow,
    filterCacheKey,
  });

  const { trendData, trendKeys, muscleTrendInsight, muscleVsLabel } = useDashboardMuscleTrend({
    fullData,
    assetsMap,
    assetsLowerMap,
    muscleGrouping,
    musclePeriod,
    effectiveNow,
    filterCacheKey,
  });

  const { weeklySetsDashboard } = useDashboardWeeklySetsDashboard({
    assetsMap,
    fullData,
    effectiveNow,
    muscleCompQuick,
    compositionGrouping,
    filterCacheKey,
  });

  const TooltipStyle = CHART_TOOLTIP_STYLE;
  const PIE_COLORS = useMemo(() => [...CHART_COLORS], []);

  return (
    <DashboardLayout
      isMounted={isMounted}
      filtersSlot={filtersSlot}
      stickyHeader={stickyHeader}
      totalWorkouts={totalWorkouts}
      totalSets={totalSets}
      totalPrs={totalPrs}
      dashboardInsights={dashboardInsights}
      onDayClick={onDayClick}
      onMuscleClick={onMuscleClick}
      onExerciseClick={onExerciseClick}
      activePlateauExercises={activePlateauExercises}
      assetsMap={assetsMap}
      assetsLowerMap={assetsLowerMap}
      weightUnit={weightUnit}
      dailyData={dailyData}
      effectiveNow={effectiveNow}
      chartModes={chartModes}
      toggleChartMode={toggleChartMode}
      prTrendView={prTrendView}
      setPrTrendView={setPrTrendView}
      prsData={prsData}
      prTrendDelta={prTrendDelta}
      prTrendDelta7d={prTrendDelta7d}
      weeklySetsView={weeklySetsView}
      setWeeklySetsView={setWeeklySetsView}
      compositionGrouping={compositionGrouping}
      setCompositionGrouping={setCompositionGrouping}
      muscleCompQuick={muscleCompQuick}
      setMuscleCompQuick={setMuscleCompQuick}
      weeklySetsDashboard={weeklySetsDashboard}
      bodyMapGender={bodyMapGender}
      intensityView={intensityView}
      setIntensityView={setIntensityView}
      intensityData={intensityData}
      intensityInsight={intensityInsight}
      muscleGrouping={muscleGrouping}
      setMuscleGrouping={setMuscleGrouping}
      musclePeriod={musclePeriod}
      setMusclePeriod={setMusclePeriod}
      muscleTrendView={muscleTrendView}
      setMuscleTrendView={setMuscleTrendView}
      trendData={trendData}
      trendKeys={trendKeys}
      muscleTrendInsight={muscleTrendInsight}
      muscleVsLabel={muscleVsLabel}
      weekShapeView={weekShapeView}
      setWeekShapeView={setWeekShapeView}
      weekShapeData={weekShapeData}
      weeklyRhythmInsight={weeklyRhythmInsight}
      volumeView={volumeView}
      setVolumeView={setVolumeView}
      volumeDurationData={volumeDurationData}
      volumeDensityTrend={volumeDensityTrend}
      topExerciseMode={topExerciseMode}
      setTopExerciseMode={setTopExerciseMode}
      topExercisesView={topExercisesView}
      setTopExercisesView={setTopExercisesView}
      topExercisesBarData={topExercisesBarData}
      topExercisesOverTimeData={topExercisesOverTimeData}
      topExerciseNames={topExerciseNames}
      topExercisesInsight={topExercisesInsight}
      pieColors={PIE_COLORS}
      tooltipStyle={TooltipStyle as any}
      aiAnalyzeOpen={aiAnalyzeOpen}
      setAiAnalyzeOpen={setAiAnalyzeOpen}
      fullData={fullData}
      exerciseStats={exerciseStats}
      themeMode={themeMode}
      animationKeyframes={ANIMATION_KEYFRAMES}
    />
  );
};
