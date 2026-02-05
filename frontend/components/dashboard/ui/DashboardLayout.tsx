import React from 'react';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { DailySummary, ExerciseStats, WorkoutSet } from '../../../types';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import { DashboardHeaderBar } from './DashboardHeaderBar';
import { DashboardInsightsSection } from './DashboardInsightsSection';
import { DashboardPrimaryCharts } from './DashboardPrimaryCharts';
import { DashboardSecondaryCharts } from './DashboardSecondaryCharts';
import { AIAnalyzeModal } from '../../modals/aiAnalyze/AIAnalyzeModal';

interface DashboardLayoutProps {
  isMounted: boolean;
  filtersSlot?: React.ReactNode;
  stickyHeader: boolean;
  totalWorkouts: number;
  totalSets: number;
  totalPrs: number;
  dashboardInsights: any;
  onDayClick?: (date: Date) => void;
  onMuscleClick?: (muscleId: string, viewMode: 'muscle' | 'group' | 'headless', weeklySetsWindow: 'all' | '7d' | '30d' | '365d') => void;
  onExerciseClick?: (exerciseName: string) => void;
  activePlateauExercises: any[];
  assetsMap?: Map<string, any> | null;
  assetsLowerMap?: Map<string, any> | null;
  weightUnit: WeightUnit;
  dailyData: DailySummary[];
  effectiveNow: Date;
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
  bodyMapGender: BodyMapGender;
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
  weekShapeView: 'radar' | 'bar';
  setWeekShapeView: (v: 'radar' | 'bar') => void;
  weekShapeData: any[];
  weeklyRhythmInsight: any;
  volumeView: 'area' | 'bar';
  setVolumeView: (v: 'area' | 'bar') => void;
  volumeDurationData: any[];
  volumeDensityTrend: any;
  topExerciseMode: 'volume' | 'pr';
  setTopExerciseMode: (v: 'volume' | 'pr') => void;
  topExercisesView: 'barh' | 'area';
  setTopExercisesView: (v: 'barh' | 'area') => void;
  topExercisesBarData: any[];
  topExercisesOverTimeData: any[];
  topExerciseNames: string[];
  topExercisesInsight: any;
  pieColors: string[];
  tooltipStyle: any;
  aiAnalyzeOpen: boolean;
  setAiAnalyzeOpen: (open: boolean) => void;
  fullData: WorkoutSet[];
  exerciseStats: ExerciseStats[];
  themeMode: string;
  animationKeyframes: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  const {
    isMounted,
    filtersSlot,
    stickyHeader,
    totalWorkouts,
    totalSets,
    totalPrs,
    dashboardInsights,
    onDayClick,
    onMuscleClick,
    onExerciseClick,
    activePlateauExercises,
    assetsMap,
    assetsLowerMap,
    weightUnit,
    dailyData,
    effectiveNow,
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
    bodyMapGender,
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
    weekShapeView,
    setWeekShapeView,
    weekShapeData,
    weeklyRhythmInsight,
    volumeView,
    setVolumeView,
    volumeDurationData,
    volumeDensityTrend,
    topExerciseMode,
    setTopExerciseMode,
    topExercisesView,
    setTopExercisesView,
    topExercisesBarData,
    topExercisesOverTimeData,
    topExerciseNames,
    topExercisesInsight,
    pieColors,
    tooltipStyle,
    aiAnalyzeOpen,
    setAiAnalyzeOpen,
    fullData,
    exerciseStats,
    themeMode,
    animationKeyframes,
  } = props;

  return (
    <>
      <style>{animationKeyframes}</style>
      <div className={`space-y-1 pb-4 sm:pb-12 transition-opacity duration-700 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
        <DashboardHeaderBar
          totalWorkouts={totalWorkouts}
          filtersSlot={filtersSlot}
          stickyHeader={stickyHeader}
          onAIAnalyze={() => setAiAnalyzeOpen(true)}
        />

        <DashboardInsightsSection
          dashboardInsights={dashboardInsights}
          totalWorkouts={totalWorkouts}
          totalSets={totalSets}
          totalPrs={totalPrs}
          weightUnit={weightUnit}
          effectiveNow={effectiveNow}
          onExerciseClick={onExerciseClick}
          onDayClick={onDayClick}
          activePlateauExercises={activePlateauExercises}
          assetsMap={assetsMap}
          assetsLowerMap={assetsLowerMap}
          dailyData={dailyData}
          onAIAnalyze={() => setAiAnalyzeOpen(true)}
        />

        <DashboardPrimaryCharts
          isMounted={isMounted}
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
          onMuscleClick={onMuscleClick}
          bodyMapGender={bodyMapGender}
          effectiveNow={effectiveNow}
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
          tooltipStyle={tooltipStyle}
        />
      </div>

      <DashboardSecondaryCharts
        isMounted={isMounted}
        weekShapeView={weekShapeView}
        setWeekShapeView={setWeekShapeView}
        weekShapeData={weekShapeData}
        weeklyRhythmInsight={weeklyRhythmInsight}
        chartModes={chartModes}
        toggleChartMode={toggleChartMode}
        volumeView={volumeView}
        setVolumeView={setVolumeView}
        weightUnit={weightUnit}
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
        pieColors={pieColors}
        tooltipStyle={tooltipStyle}
        onExerciseClick={onExerciseClick}
        assetsMap={assetsMap}
        assetsLowerMap={assetsLowerMap}
      />

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
