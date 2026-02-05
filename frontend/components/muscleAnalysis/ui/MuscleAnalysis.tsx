import React, { useState } from 'react';
import { WorkoutSet } from '../../../types';
import { ViewHeader } from '../../layout/ViewHeader';
import { Activity, Dumbbell } from 'lucide-react';
import { BodyMapGender } from '../../bodyMap/BodyMap';
import { useMuscleSelection } from '../hooks/useMuscleSelection';
import { useMuscleVolumeData } from '../hooks/useMuscleVolumeData';
import type { WeeklySetsWindow } from '../../../utils/muscle/analytics';
import { useMuscleHeatmapData } from '../hooks/useMuscleHeatmapData';
import { useMuscleTrendData } from '../hooks/useMuscleTrendData';
import { useMuscleAnalysisHandlers } from '../hooks/useMuscleAnalysisHandlers';
import { MuscleAnalysisBodyMapPanel } from './MuscleAnalysisBodyMapPanel';
import { MuscleAnalysisDetailPanel } from './MuscleAnalysisDetailPanel';
import { TooltipData } from '../../ui/Tooltip';

interface MuscleAnalysisProps {
  data: WorkoutSet[];
  filtersSlot?: React.ReactNode;
  onExerciseClick?: (exerciseName: string) => void;
  initialMuscle?: { muscleId: string; viewMode: 'muscle' | 'group' | 'headless' } | null;
  initialWeeklySetsWindow?: WeeklySetsWindow | null;
  onInitialMuscleConsumed?: () => void;
  stickyHeader?: boolean;
  bodyMapGender?: BodyMapGender;
  now?: Date;
}

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
  const [weeklySetsChartView, setWeeklySetsChartView] = useState<'heatmap' | 'radar'>('heatmap');
  const [hoverTooltip, setHoverTooltip] = useState<TooltipData | null>(null);

  const {
    selectedMuscle,
    setSelectedMuscle,
    viewMode,
    weeklySetsWindow,
    setWeeklySetsWindow,
    activeQuickFilter,
    setActiveQuickFilter,
    selectedSvgIdForUrlRef,
    clearSelectionUrl,
    updateSelectionUrl,
    handleQuickFilterClick,
    clearSelection,
  } = useMuscleSelection({
    initialMuscle,
    initialWeeklySetsWindow,
    onInitialMuscleConsumed,
    isLoading: false,
  });

  const {
    exerciseMuscleData,
    muscleVolume,
    isLoading,
    assetsMap,
    windowStart,
    effectiveNow,
    allTimeWindowStart,
  } = useMuscleVolumeData({
    data,
    weeklySetsWindow,
    now,
  });

  const {
    muscleVolumes,
    maxVolume,
    windowedGroupVolumes,
    groupedBodyMapVolumes,
    maxGroupVolume,
    selectedSubjectKeys,
    groupWeeklyRatesBySubject,
    headlessRatesMap,
    radarData,
  } = useMuscleHeatmapData({
    data,
    assetsMap,
    windowStart,
    effectiveNow,
    weeklySetsWindow,
    viewMode,
    selectedMuscle,
    activeQuickFilter,
  });

  const {
    weeklySetsSummary,
    weeklySetsDelta,
    trendData,
    windowedSelectionBreakdown,
    contributingExercises,
    totalSets,
    musclesWorked,
  } = useMuscleTrendData({
    data,
    assetsMap,
    windowStart,
    effectiveNow,
    allTimeWindowStart,
    weeklySetsWindow,
    viewMode,
    selectedSubjectKeys,
    groupWeeklyRatesBySubject,
    headlessRatesMap,
    muscleVolume,
    windowedGroupVolumes,
    muscleVolumes,
  });
  const {
    handleMuscleClick,
    handleMuscleHover,
    selectedBodyMapIds,
    hoveredBodyMapIds,
  } = useMuscleAnalysisHandlers({
    viewMode,
    selectedMuscle,
    activeQuickFilter,
    setSelectedMuscle,
    setActiveQuickFilter,
    selectedSvgIdForUrlRef,
    clearSelectionUrl,
    updateSelectionUrl,
    weeklySetsWindow,
    windowedGroupVolumes,
    headlessRatesMap,
    setHoverTooltip,
  });

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
      <div className="hidden sm:contents">
        <ViewHeader
          leftStats={[{ icon: Activity, value: totalSets, label: 'Total Sets' }]}
          rightStats={[{ icon: Dumbbell, value: musclesWorked, label: 'Muscles' }]}
          filtersSlot={filtersSlot}
          sticky={stickyHeader}
        />
      </div>

      <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
        <MuscleAnalysisBodyMapPanel
          viewMode={viewMode}
          bodyMapGender={bodyMapGender}
          activeQuickFilter={activeQuickFilter}
          onQuickFilterClick={handleQuickFilterClick}
          weeklySetsChartView={weeklySetsChartView}
          setWeeklySetsChartView={setWeeklySetsChartView}
          weeklySetsWindow={weeklySetsWindow}
          setWeeklySetsWindow={setWeeklySetsWindow}
          selectedSvgIdForUrlRef={selectedSvgIdForUrlRef}
          updateSelectionUrl={updateSelectionUrl}
          muscleVolumes={muscleVolumes}
          maxVolume={maxVolume}
          groupedBodyMapVolumes={groupedBodyMapVolumes}
          maxGroupVolume={maxGroupVolume}
          selectedMuscle={selectedMuscle}
          selectedBodyMapIds={selectedBodyMapIds}
          hoveredBodyMapIds={hoveredBodyMapIds}
          handleMuscleClick={handleMuscleClick}
          handleMuscleHover={handleMuscleHover}
          radarData={radarData}
          hoverTooltip={hoverTooltip}
        />

        <MuscleAnalysisDetailPanel
          activeQuickFilter={activeQuickFilter}
          selectedMuscle={selectedMuscle}
          viewMode={viewMode}
          weeklySetsWindow={weeklySetsWindow}
          weeklySetsSummary={weeklySetsSummary}
          volumeDelta={weeklySetsDelta}
          trendData={trendData}
          windowedSelectionBreakdown={windowedSelectionBreakdown}
          contributingExercises={contributingExercises}
          assetsMap={assetsMap}
          exerciseMuscleData={exerciseMuscleData}
          onExerciseClick={onExerciseClick}
          clearSelection={() => {
            setSelectedMuscle(null);
            setActiveQuickFilter(null);
            selectedSvgIdForUrlRef.current = null;
            clearSelectionUrl();
          }}
        />
      </div>
    </div>
  );
};
