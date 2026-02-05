import React, { Suspense } from 'react';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { LazyRender } from '../../ui/LazyRender';
import type { WeightUnit } from '../../../utils/storage/localStorage';

const WeeklyRhythmCard = React.lazy(() => import('../weeklyRhythm/WeeklyRhythmCard').then((m) => ({ default: m.WeeklyRhythmCard })));
const VolumeDensityCard = React.lazy(() => import('../volumeDensity/VolumeDensityCard').then((m) => ({ default: m.VolumeDensityCard })));
const TopExercisesCard = React.lazy(() => import('../topExercises/TopExercisesCard').then((m) => ({ default: m.TopExercisesCard })));

interface DashboardSecondaryChartsProps {
  isMounted: boolean;
  weekShapeView: 'radar' | 'bar';
  setWeekShapeView: (v: 'radar' | 'bar') => void;
  weekShapeData: any[];
  weeklyRhythmInsight: any;
  chartModes: { volumeVsDuration: 'daily' | 'weekly' | 'monthly' | 'yearly' };
  toggleChartMode: (key: 'volumeVsDuration' | 'intensityEvo' | 'prTrend', mode: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  volumeView: 'area' | 'bar';
  setVolumeView: (v: 'area' | 'bar') => void;
  weightUnit: WeightUnit;
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
  onExerciseClick?: (exerciseName: string) => void;
  assetsMap?: Map<string, any> | null;
  assetsLowerMap?: Map<string, any> | null;
}

export const DashboardSecondaryCharts: React.FC<DashboardSecondaryChartsProps> = ({
  isMounted,
  weekShapeView,
  setWeekShapeView,
  weekShapeData,
  weeklyRhythmInsight,
  chartModes,
  toggleChartMode,
  volumeView,
  setVolumeView,
  weightUnit,
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
  onExerciseClick,
  assetsMap,
  assetsLowerMap,
}) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2">
      <LazyRender className="min-w-0" placeholder={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
        <Suspense fallback={<ChartSkeleton className="min-h-[400px] sm:min-h-[520px]" />}>
          <WeeklyRhythmCard
            isMounted={isMounted}
            view={weekShapeView}
            onViewToggle={setWeekShapeView}
            weekShapeData={weekShapeData}
            weeklyRhythmInsight={weeklyRhythmInsight as any}
            tooltipStyle={tooltipStyle as any}
          />
        </Suspense>
      </LazyRender>

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
            tooltipStyle={tooltipStyle as any}
          />
        </Suspense>
      </LazyRender>
    </div>

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
          pieColors={pieColors}
          tooltipStyle={tooltipStyle as any}
          onExerciseClick={onExerciseClick}
          assetsMap={assetsMap}
          assetsLowerMap={assetsLowerMap}
        />
      </Suspense>
    </LazyRender>
  </>
);
