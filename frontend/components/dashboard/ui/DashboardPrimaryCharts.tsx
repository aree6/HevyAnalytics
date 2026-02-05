import React, { Suspense } from 'react';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { LazyRender } from '../../ui/LazyRender';
import type { BodyMapGender } from '../../bodyMap/BodyMap';

const WeeklySetsCard = React.lazy(() => import('../weeklySets/WeeklySetsCard').then((m) => ({ default: m.WeeklySetsCard })));
const MuscleTrendCard = React.lazy(() => import('../muscleTrend/MuscleTrendCard').then((m) => ({ default: m.MuscleTrendCard })));
const PrTrendCard = React.lazy(() => import('../prTrend/PrTrendCard').then((m) => ({ default: m.PrTrendCard })));
const IntensityEvolutionCard = React.lazy(() => import('../intensityEvolution/IntensityEvolutionCard').then((m) => ({ default: m.IntensityEvolutionCard })));

interface DashboardPrimaryChartsProps {
  isMounted: boolean;
  chartModes: { volumeVsDuration: 'daily' | 'weekly' | 'monthly' | 'yearly'; intensityEvo: 'daily' | 'weekly' | 'monthly' | 'yearly'; prTrend: 'daily' | 'weekly' | 'monthly' | 'yearly' };
  toggleChartMode: (key: 'volumeVsDuration' | 'intensityEvo' | 'prTrend', mode: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  prTrendView: 'area' | 'bar';
  setPrTrendView: (v: 'area' | 'bar') => void;
  prsData: any[];
  prTrendDelta: any;
  prTrendDelta7d: any;
  weeklySetsView: 'heatmap' | 'radar';
  setWeeklySetsView: (v: 'heatmap' | 'radar') => void;
  compositionGrouping: 'muscles' | 'groups';
  setCompositionGrouping: (v: 'muscles' | 'groups') => void;
  muscleCompQuick: 'all' | '7d' | '30d' | '365d';
  setMuscleCompQuick: (v: 'all' | '7d' | '30d' | '365d') => void;
  weeklySetsDashboard: any;
  onMuscleClick?: (muscleId: string, viewMode: 'muscle' | 'group' | 'headless', weeklySetsWindow: 'all' | '7d' | '30d' | '365d') => void;
  bodyMapGender: BodyMapGender;
  effectiveNow: Date;
  intensityView: 'area' | 'stackedBar';
  setIntensityView: (v: 'area' | 'stackedBar') => void;
  intensityData: any[];
  intensityInsight: any;
  muscleGrouping: 'groups' | 'muscles';
  setMuscleGrouping: (v: 'groups' | 'muscles') => void;
  musclePeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
  setMusclePeriod: (v: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all') => void;
  muscleTrendView: 'area' | 'stackedBar';
  setMuscleTrendView: (v: 'area' | 'stackedBar') => void;
  trendData: any[];
  trendKeys: string[];
  muscleTrendInsight: any;
  muscleVsLabel: string;
  tooltipStyle: any;
}

export const DashboardPrimaryCharts: React.FC<DashboardPrimaryChartsProps> = ({
  isMounted,
  chartModes,
  toggleChartMode,
  prTrendView,
  setPrTrendView,
  prsData,
  prTrendDelta,
  prTrendDelta7d,
  weeklySetsView,
  setWeeklySetsView,
  compositionGrouping,
  setCompositionGrouping,
  muscleCompQuick,
  setMuscleCompQuick,
  weeklySetsDashboard,
  onMuscleClick,
  bodyMapGender,
  effectiveNow,
  intensityView,
  setIntensityView,
  intensityData,
  intensityInsight,
  muscleGrouping,
  setMuscleGrouping,
  musclePeriod,
  setMusclePeriod,
  muscleTrendView,
  setMuscleTrendView,
  trendData,
  trendKeys,
  muscleTrendInsight,
  muscleVsLabel,
  tooltipStyle,
}) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2">
      <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[480px]" />}>
        <PrTrendCard
          isMounted={isMounted}
          mode={chartModes.prTrend}
          onToggle={(m) => toggleChartMode('prTrend', m)}
          view={prTrendView}
          onViewToggle={setPrTrendView}
          prsData={prsData}
          tooltipStyle={tooltipStyle as any}
          prTrendDelta={prTrendDelta}
          prTrendDelta7d={prTrendDelta7d}
        />
      </Suspense>

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
          tooltipStyle={tooltipStyle as any}
          onMuscleClick={(muscleId, viewMode) => onMuscleClick?.(muscleId, viewMode, muscleCompQuick)}
          bodyMapGender={bodyMapGender}
          windowStart={weeklySetsDashboard.windowStart}
          now={effectiveNow}
        />
      </Suspense>
    </div>

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
          tooltipStyle={tooltipStyle as any}
        />
      </Suspense>
    </LazyRender>

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
          tooltipStyle={tooltipStyle as any}
          muscleVsLabel={muscleVsLabel}
        />
      </Suspense>
    </LazyRender>
  </>
);
