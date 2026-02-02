import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { DailySummary, ExerciseStats, WorkoutSet } from '../../types';
import {
  getDayOfWeekShape
} from '../../utils/analysis/analytics';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import { getSmartFilterMode, TimeFilterMode, WeightUnit } from '../../utils/storage/localStorage';
import { CHART_TOOLTIP_STYLE, CHART_COLORS, ANIMATION_KEYFRAMES } from '../../utils/ui/uiConstants';
import { ActivityHeatmap } from './ActivityHeatmap';
import {
  Clock, Dumbbell, Brain, AlertTriangle
} from 'lucide-react';
import { subDays } from 'date-fns';
import { getEffectiveNowFromWorkoutData, getSessionKey } from '../../utils/date/dateUtils';
import { getExerciseAssets, ExerciseAsset } from '../../utils/data/exerciseAssets';
import { ViewHeader } from '../layout/ViewHeader';
import {
  calculateDashboardInsights,
  detectPlateaus,
} from '../../utils/analysis/insights';
import { InsightsPanel, PlateauAlert, RecentPRsPanel } from '../insights/InsightCards';
import { computationCache } from '../../utils/storage/computationCache';
import { MIN_SESSIONS_FOR_TREND, summarizeExerciseHistory } from '../../utils/analysis/exerciseTrend';
import { isWarmupSet } from '../../utils/analysis/setClassification';
import { ChartSkeleton } from '../ui/ChartSkeleton';
import { LazyRender } from '../ui/LazyRender';
import { useDashboardIntensityEvolution } from './useDashboardIntensityEvolution';
import { useDashboardMuscleTrend } from './useDashboardMuscleTrend';
import { useDashboardPrTrend } from './useDashboardPrTrend';
import { useDashboardTopExercises } from './useDashboardTopExercises';
import { useDashboardVolumeDensity } from './useDashboardVolumeDensity';
import { useDashboardWeeklySetsDashboard } from './useDashboardWeeklySetsDashboard';
import { AIAnalyzeModal } from '../modals/AIAnalyzeModal';
import { useTheme } from '../theme/ThemeProvider';

interface DashboardProps {
  dailyData: DailySummary[];
  exerciseStats: ExerciseStats[];
  fullData: WorkoutSet[];
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
  /** Reference date for relative time calculations. Pass from App for centralized date mode control. */
  now?: Date;
}

const safePct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

const WeeklySetsCard = React.lazy(() => import('./WeeklySetsCard').then((m) => ({ default: m.WeeklySetsCard })));
const MuscleTrendCard = React.lazy(() => import('./MuscleTrendCard').then((m) => ({ default: m.MuscleTrendCard })));
const PrTrendCard = React.lazy(() => import('./PrTrendCard').then((m) => ({ default: m.PrTrendCard })));
const IntensityEvolutionCard = React.lazy(() => import('./IntensityEvolutionCard').then((m) => ({ default: m.IntensityEvolutionCard })));
const WeeklyRhythmCard = React.lazy(() => import('./WeeklyRhythmCard').then((m) => ({ default: m.WeeklyRhythmCard })));
const VolumeDensityCard = React.lazy(() => import('./VolumeDensityCard').then((m) => ({ default: m.VolumeDensityCard })));
const TopExercisesCard = React.lazy(() => import('./TopExercisesCard').then((m) => ({ default: m.TopExercisesCard })));

// --- MAIN DASHBOARD ---

export const Dashboard: React.FC<DashboardProps> = ({ dailyData, exerciseStats, fullData, onDayClick, onMuscleClick, onExerciseClick, filtersSlot, stickyHeader = false, bodyMapGender = 'male' as BodyMapGender, weightUnit = 'kg' as WeightUnit, now }) => {
  // State to control animation retriggering on mount
  const [isMounted, setIsMounted] = useState(false);

  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  
  // Get theme mode for AIAnalyzeModal
  const { mode: themeMode } = useTheme();

  // Use centralized now if provided, otherwise fall back to data-based calculation
  const effectiveNow = useMemo(() => now ?? getEffectiveNowFromWorkoutData(fullData), [now, fullData]);

  // Calculate date range span for smart filter
  const spanDays = useMemo(() => {
    if (!fullData.length) return 0;
    const dates = fullData.map(s => s.parsedDate?.getTime() || 0).filter(t => t > 0);
    if (dates.length === 0) return 0;
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return Math.max(1, Math.round((max - min) / (1000 * 60 * 60 * 24)) + 1);
  }, [fullData]);

  // Smart filter mode based on date range span
  const smartMode = useMemo(() => getSmartFilterMode(spanDays), [spanDays]);

  const allAggregationMode = useMemo<'daily' | 'weekly' | 'monthly'>(() => {
    return smartMode === 'all' ? 'daily' : smartMode;
  }, [smartMode]);

  // Count total workouts (for display purposes)
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

  // Track user overrides only (null = use default)
  const [chartOverrides, setChartOverrides] = useState<Record<string, TimeFilterMode | null>>({
    volumeVsDuration: null,
    intensityEvo: null,
    prTrend: null,
  });

  // Effective chart modes: use override if set, otherwise default to last-month range.
  const chartModes = useMemo(() => ({
    volumeVsDuration: chartOverrides.volumeVsDuration ?? 'monthly',
    intensityEvo: chartOverrides.intensityEvo ?? 'monthly',
    prTrend: chartOverrides.prTrend ?? 'monthly',
  }), [chartOverrides]);

  // Simple effect to trigger animation after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Toggle chart mode (user override)
  const toggleChartMode = (chart: string, mode: TimeFilterMode) => {
    setChartOverrides(prev => ({ ...prev, [chart]: mode }));
  };

  const [topExerciseMode, setTopExerciseMode] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [topExercisesView, setTopExercisesView] = useState<'barh' | 'area'>('barh');

  // Chart view type states (defaults keep existing chart types)
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
    getExerciseAssets().then(m => { if (mounted) setAssetsMap(m); }).catch(() => setAssetsMap(new Map()));
    return () => { mounted = false; };
  }, []);

  // --- MEMOIZED DATA LOGIC ---

  const totalPrs = useMemo(() => exerciseStats.reduce((acc, curr) => acc + curr.prCount, 0), [exerciseStats]);

  const totalSets = useMemo(() => {
    let count = 0;
    for (const s of fullData) {
      if (isWarmupSet(s)) continue;
      count += 1;
    }
    return count;
  }, [fullData]);

  // Dashboard Insights (deltas, streaks, PR info, sparklines) - cached across tab switches
  const dashboardInsights = useMemo(() => {
    return computationCache.getOrCompute(
      'dashboardInsights',
      fullData,
      () => calculateDashboardInsights(fullData, dailyData, effectiveNow),
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, dailyData, effectiveNow]);

  // Plateau Detection - cached across tab switches
  const plateauAnalysis = useMemo(() => {
    return computationCache.getOrCompute(
      'plateauAnalysis',
      fullData,
      () => detectPlateaus(fullData, exerciseStats, effectiveNow, weightUnit, 'reactive'),
      { ttl: 10 * 60 * 1000 }
    );
  }, [fullData, exerciseStats, effectiveNow, weightUnit]);

  const exerciseStatsMap = useMemo(() => {
    const m = new Map<string, ExerciseStats>();
    for (const s of exerciseStats) m.set(s.name, s);
    return m;
  }, [exerciseStats]);

  const activePlateauExercises = useMemo(() => {
    const activeSince = subDays(effectiveNow, 60);
    return plateauAnalysis.plateauedExercises.filter((p) => {
      const stat = exerciseStatsMap.get(p.exerciseName);
      if (!stat) return false;
      const sessions = summarizeExerciseHistory(stat.history);
      const lastDate = sessions[0]?.date ?? null;
      if (!lastDate) return false;
      if (sessions.length < MIN_SESSIONS_FOR_TREND) return false;
      return lastDate >= activeSince;
    });
  }, [plateauAnalysis.plateauedExercises, exerciseStatsMap, effectiveNow]);

  const { prsData, prTrendDelta, prTrendDelta7d } = useDashboardPrTrend({
    fullData,
    rangeMode: chartModes.prTrend,
    allAggregationMode,
    effectiveNow,
    dashboardInsights,
  });

  const { intensityData, intensityInsight } = useDashboardIntensityEvolution({
    fullData,
    rangeMode: chartModes.intensityEvo,
    allAggregationMode,
    effectiveNow,
  });

  const { volumeDurationData, volumeDensityTrend } = useDashboardVolumeDensity({
    dailyData,
    rangeMode: chartModes.volumeVsDuration,
    smartMode,
    weightUnit,
    effectiveNow,
    dashboardInsights,
  });

  // Static Data
  const weekShapeData = useMemo(() => getDayOfWeekShape(dailyData), [dailyData]);

  const weeklyRhythmInsight = useMemo(() => {
    if (!weekShapeData || weekShapeData.length === 0) return null;
    const total = weekShapeData.reduce((acc, d) => acc + (d.A || 0), 0);
    if (total <= 0) return null;
    const sorted = [...weekShapeData].sort((a, b) => (b.A || 0) - (a.A || 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const topShare = safePct(top.A || 0, total);
    const bottomShare = safePct(bottom.A || 0, total);
    const spread = topShare - bottomShare;
    const rhythmLabel = spread <= 12 ? "It's even" : spread <= 22 ? "It's somewhat spiky" : "It's spiky";
    const rhythmTone = spread <= 12 ? 'good' : spread <= 22 ? 'neutral' : 'bad';
    return {
      total,
      top: { subject: top.subject, share: topShare },
      bottom: { subject: bottom.subject, share: bottomShare },
      spread,
      rhythmLabel,
      rhythmTone,
    };
  }, [weekShapeData]);

  const {
    topExercisesBarData,
    topExercisesOverTimeData,
    topExerciseNames,
    topExercisesInsight,
  } = useDashboardTopExercises({
    fullData,
    exerciseStats,
    topExerciseMode,
    allAggregationMode,
    effectiveNow,
  });

  const { trendData, trendKeys, muscleTrendInsight, muscleVsLabel } = useDashboardMuscleTrend({
    fullData,
    assetsMap,
    assetsLowerMap,
    muscleGrouping,
    musclePeriod,
    effectiveNow,
  });

  const { weeklySetsDashboard } = useDashboardWeeklySetsDashboard({
    assetsMap,
    fullData,
    effectiveNow,
    muscleCompQuick,
    compositionGrouping,
  });


  // Use shared constants for Recharts styles
  const TooltipStyle = CHART_TOOLTIP_STYLE;
  const PIE_COLORS = useMemo(() => [...CHART_COLORS], []);

  return (
    <>
      <style>{ANIMATION_KEYFRAMES}</style>
      <div className={`space-y-1 pb-4 sm:pb-12 transition-opacity duration-700 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}>

        <div className="hidden sm:contents">
          <ViewHeader
            leftStats={[
              { icon: Clock, value: totalWorkouts, label: 'Workouts' },
            ]}
            filtersSlot={filtersSlot}
            sticky={stickyHeader}
            rightSlot={
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="meteor-border-track">
                      <div className="meteor-premium" />
                      <div className="meteor-border-mask" />
                    </div>
                    <button
                      onClick={() => setAiAnalyzeOpen(true)}
                      className="relative z-[2] inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 px-3 py-1.5 bg-transparent text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-200"
                      title="AI Analyze"
                    >
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="hidden sm:inline">AI Analyze</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* INSIGHTS PANEL - KPIs with Deltas & Sparklines */}
        <InsightsPanel
          insights={dashboardInsights}
          totalWorkouts={totalWorkouts}
          totalSets={totalSets}
          totalPRs={totalPrs}
          onAIAnalyze={() => setAiAnalyzeOpen(true)}
        />

        {/* RECENT PRs TIMELINE */}
        <RecentPRsPanel prInsights={dashboardInsights.prInsights} weightUnit={weightUnit} now={effectiveNow} onExerciseClick={onExerciseClick} />

        {/* PLATEAU ALERTS */}
        {activePlateauExercises.length > 0 && (
          <div className="bg-black/70 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-white">Plateaus</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                  {activePlateauExercises.length} {activePlateauExercises.length === 1 ? 'exercise' : 'exercises'}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
              <div className="flex gap-2" style={{ minWidth: 'min-content' }}>
                {activePlateauExercises.map((p) => (
                  <div key={p.exerciseName} className="min-w-[280px] flex-shrink-0">
                    <PlateauAlert
                      exerciseName={p.exerciseName}
                      suggestion={p.suggestion}
                      weeksAtSameWeight={p.weeksAtSameWeight}
                      currentMaxWeight={p.currentMaxWeight}
                      lastProgressDate={p.lastProgressDate}
                      lastWeight={p.lastWeight}
                      lastReps={p.lastReps}
                      isBodyweightLike={p.isBodyweightLike}
                      asset={assetsMap?.get(p.exerciseName) || assetsLowerMap?.get(p.exerciseName.toLowerCase())}
                      weightUnit={weightUnit}
                      now={effectiveNow}
                      onClick={() => onExerciseClick?.(p.exerciseName)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. HEATMAP (Full Width) */}
        <ActivityHeatmap
          dailyData={dailyData}
          streakInfo={dashboardInsights.streakInfo}
          consistencySparkline={dashboardInsights.consistencySparkline}
          onDayClick={onDayClick}
          now={effectiveNow}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2">

          {/* 2. PR TRENDS (Area/Bar) */}
          <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[480px]" />}>
            <PrTrendCard
              isMounted={isMounted}
              mode={chartModes.prTrend}
              onToggle={(m) => toggleChartMode('prTrend', m)}
              view={prTrendView}
              onViewToggle={setPrTrendView}
              prsData={prsData}
              tooltipStyle={TooltipStyle as any}
              prTrendDelta={prTrendDelta}
              prTrendDelta7d={prTrendDelta7d}
            />
          </Suspense>

          {/* 3. WEEKLY SETS (Radar/Heatmap) */}
          <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[480px]" />}>
            <WeeklySetsCard
              isMounted={isMounted}
              weeklySetsView={weeklySetsView}
              setWeeklySetsView={setWeeklySetsView}
              compositionGrouping={compositionGrouping}
              setCompositionGrouping={setCompositionGrouping}
              muscleCompQuick={muscleCompQuick}
              setMuscleCompQuick={setMuscleCompQuick}
              heatmap={weeklySetsDashboard.heatmap}
              tooltipStyle={TooltipStyle as any}
              onMuscleClick={(muscleId, viewMode) => onMuscleClick?.(muscleId, viewMode, muscleCompQuick)}
              bodyMapGender={bodyMapGender}
              windowStart={weeklySetsDashboard.windowStart}
              now={effectiveNow}
            />
          </Suspense>
        </div>

        {/* 4. INTENSITY EVOLUTION (Area/Stacked Bar) */}
        <LazyRender className="min-w-0" placeholder={<ChartSkeleton className="min-h-[400px] sm:min-h-[480px]" />}>
          <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[480px]" />}>
            <IntensityEvolutionCard
              isMounted={isMounted}
              mode={chartModes.intensityEvo}
              onToggle={(m) => toggleChartMode('intensityEvo', m)}
              view={intensityView}
              onViewToggle={setIntensityView}
              intensityData={intensityData}
              intensityInsight={intensityInsight}
              tooltipStyle={TooltipStyle as any}
            />
          </Suspense>
        </LazyRender>

        {/* MUSCLE ANALYSIS (Unified) */}
        <LazyRender className="min-w-0" placeholder={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
          <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
            <MuscleTrendCard
              isMounted={isMounted}
              muscleGrouping={muscleGrouping}
              setMuscleGrouping={setMuscleGrouping}
              musclePeriod={musclePeriod}
              setMusclePeriod={setMusclePeriod}
              muscleTrendView={muscleTrendView}
              setMuscleTrendView={setMuscleTrendView}
              trendData={trendData}
              trendKeys={trendKeys}
              muscleTrendInsight={muscleTrendInsight as any}
              tooltipStyle={TooltipStyle as any}
              muscleVsLabel={muscleVsLabel}
            />
          </Suspense>
        </LazyRender>

      </div>

      {/* 5. Weekly Rhythm + Muscle Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2">

        {/* Weekly Rhythm: Radar/Bar */}
        <LazyRender className="min-w-0" placeholder={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
          <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
            <WeeklyRhythmCard
              isMounted={isMounted}
              view={weekShapeView}
              onViewToggle={setWeekShapeView}
              weekShapeData={weekShapeData}
              weeklyRhythmInsight={weeklyRhythmInsight as any}
              tooltipStyle={TooltipStyle as any}
            />
          </Suspense>
        </LazyRender>

        {/* Volume Density (Area/Bar) */}
        <LazyRender className="min-w-0" placeholder={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
          <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
            <VolumeDensityCard
              isMounted={isMounted}
              mode={chartModes.volumeVsDuration}
              onToggle={(m) => toggleChartMode('volumeVsDuration', m)}
              view={volumeView}
              onViewToggle={setVolumeView}
              weightUnit={weightUnit}
              volumeDurationData={volumeDurationData}
              volumeDensityTrend={volumeDensityTrend as any}
              tooltipStyle={TooltipStyle as any}
            />
          </Suspense>
        </LazyRender>
      </div>

      {/* 6. Top Exercises (Full Width, Bars/Area Views) */}
      <LazyRender className="min-w-0" placeholder={<ChartSkeleton className="min-h-[360px]" />}>
        <Suspense fallback={<ChartSkeleton className="min-h-[360px]" />}>
          <TopExercisesCard
            isMounted={isMounted}
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
            onExerciseClick={onExerciseClick}
            assetsMap={assetsMap}
            assetsLowerMap={assetsLowerMap}
          />
        </Suspense>
      </LazyRender>

      <AIAnalyzeModal
        isOpen={aiAnalyzeOpen}
        onClose={() => setAiAnalyzeOpen(false)}
        fullData={fullData}
        dailyData={dailyData}
        exerciseStats={exerciseStats}
        effectiveNow={effectiveNow}
        themeMode={themeMode}
      />

    </>
  );
};