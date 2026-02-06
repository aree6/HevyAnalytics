import React, { useMemo, useState, useEffect } from 'react';
import { WorkoutSet } from '../../../types';
import { Calendar, Dumbbell } from 'lucide-react';
import { getExerciseAssets, ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { loadExerciseMuscleData, ExerciseMuscleData } from '../../../utils/muscle/mapping';
import { isWarmupSet } from '../../../utils/analysis/masterAlgorithm';
import { ViewHeader } from '../../layout/ViewHeader';
import { WeightUnit } from '../../../utils/storage/localStorage';
import { getEffectiveNowFromWorkoutData } from '../../../utils/date/dateUtils';
import { BodyMapGender } from '../../bodyMap/BodyMap';
import { useTheme } from '../../theme/ThemeProvider';
import { TooltipPortal } from './HistoryTooltipPortal';
import { buildHistorySessions, type Session } from '../utils/historySessions';
import { useExerciseBestHistory, useExerciseVolumeHistory, useExerciseVolumePrHistory } from '../utils/exerciseHistoryHooks';
import { useHistoryTooltip } from '../hooks/useHistoryTooltip';
import { HistoryPaginationControls } from './HistoryPaginationControls';
import { HistorySessionBlock } from './HistorySessionBlock';
import { ITEMS_PER_PAGE, isSameCalendarDay } from '../utils/historyViewConstants';
import { prefetchFlexData } from '../../../utils/prefetch/prefetchStrategies';

interface HistoryViewProps {
  data: WorkoutSet[];
  filterCacheKey: string;
  filtersSlot?: React.ReactNode;
  weightUnit?: WeightUnit;
  bodyMapGender?: BodyMapGender;
  stickyHeader?: boolean;
  onExerciseClick?: (exerciseName: string) => void;
  onDayTitleClick?: (date: Date) => void;
  targetDate?: Date | null;
  onTargetDateConsumed?: () => void;
  now?: Date;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  data,
  filterCacheKey,
  filtersSlot,
  weightUnit = 'kg',
  bodyMapGender = 'male',
  stickyHeader = false,
  onExerciseClick,
  targetDate,
  onTargetDateConsumed,
  now,
}) => {
  const { mode } = useTheme();
  const isLightMode = mode === 'light';
  const [currentPage, setCurrentPage] = useState(1);
  const { tooltip, setTooltip, handleMouseEnter, handleTooltipToggle } = useHistoryTooltip();
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset> | null>(null);
  const [exerciseMuscleData, setExerciseMuscleData] = useState<Map<string, ExerciseMuscleData>>(new Map());
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(() => new Set());

  const effectiveNow = useMemo(() => now ?? getEffectiveNowFromWorkoutData(data, new Date(0)), [now, data]);

  const exerciseVolumeHistory = useExerciseVolumeHistory(data);
  const { exerciseBests, currentBests } = useExerciseBestHistory(data);
  const { exerciseVolumePrBests } = useExerciseVolumePrHistory(data);

  useEffect(() => setCurrentPage(1), [data]);

  useEffect(() => {
    setCollapsedSessions(new Set());
  }, [data]);

  useEffect(() => {
    let mounted = true;
    getExerciseAssets()
      .then((m) => { if (mounted) setAssetsMap(m); })
      .catch(() => setAssetsMap(new Map()));
    loadExerciseMuscleData()
      .then((m) => { if (mounted) setExerciseMuscleData(m); });
    return () => { mounted = false; };
  }, []);

  // Prefetch Flex view data after 3 seconds on History view
  useEffect(() => {
    if (data.length === 0) return;
    
    const timer = setTimeout(() => {
      prefetchFlexData(filterCacheKey, data, effectiveNow);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [filterCacheKey, data, effectiveNow]);

  const sessions: Session[] = useMemo(() => buildHistorySessions(data), [data]);
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const currentSessions = sessions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (!targetDate || sessions.length === 0) return;

    const targetSessionIndex = sessions.findIndex((session) =>
      session.date && isSameCalendarDay(session.date, targetDate)
    );

    if (targetSessionIndex !== -1) {
      const targetPage = Math.floor(targetSessionIndex / ITEMS_PER_PAGE) + 1;

      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }

      setTimeout(() => {
        const sessionElement = document.getElementById(`session-${sessions[targetSessionIndex].key}`);
        if (sessionElement) {
          sessionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sessionElement.classList.add('bg-emerald-400/10');
          setTimeout(() => {
            sessionElement.classList.remove('bg-emerald-400/10');
          }, 2000);
        }
        onTargetDateConsumed?.();
      }, 100);
    } else {
      onTargetDateConsumed?.();
    }
  }, [targetDate, sessions, currentPage, onTargetDateConsumed]);

  const totalSessions = sessions.length;
  const totalSets = useMemo(() => {
    return data.reduce((acc, s) => (isWarmupSet(s) ? acc : acc + 1), 0);
  }, [data]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      const historyElement = document.querySelector('[data-history-view]') as HTMLElement;
      if (historyElement) {
        historyElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }, 150);
  };

  const paginationControls = (
    <HistoryPaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );

  return (
    <div
      data-history-view
      className="flex flex-col gap-1 w-full text-slate-200 pb-10"
      onClick={(e) => {
        if (tooltip && e.target === e.currentTarget) {
          setTooltip(null);
        }
      }}
    >
      <div className="hidden sm:contents">
        <ViewHeader
          leftStats={[{ icon: Calendar, value: totalSessions, label: 'Sessions' }]}
          rightStats={[{ icon: Dumbbell, value: totalSets, label: 'Sets' }]}
          filtersSlot={filtersSlot}
          sticky={stickyHeader}
          rightSlot={totalPages > 1 ? paginationControls : null}
        />
      </div>

      {totalPages > 1 && (
        <div className="sm:hidden flex justify-center pt-2 pb-4">
          {paginationControls}
        </div>
      )}

      <div key={currentPage} className="space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-forwards">
        {currentSessions.map((session, index) => (
          <HistorySessionBlock
            key={session.key}
            session={session}
            index={index}
            currentSessions={currentSessions}
            sessions={sessions}
            collapsedSessions={collapsedSessions}
            setCollapsedSessions={setCollapsedSessions}
            weightUnit={weightUnit}
            bodyMapGender={bodyMapGender}
            exerciseMuscleData={exerciseMuscleData}
            assetsMap={assetsMap}
            effectiveNow={effectiveNow}
            isLightMode={isLightMode}
            exerciseVolumeHistory={exerciseVolumeHistory}
            exerciseBests={exerciseBests}
            currentBests={currentBests}
            exerciseVolumePrBests={exerciseVolumePrBests}
            onExerciseClick={onExerciseClick}
            onTooltipToggle={handleTooltipToggle}
            onMouseEnter={handleMouseEnter}
            onClearTooltip={() => setTooltip(null)}
            setTooltip={setTooltip}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-4 pb-6">
          {paginationControls}
        </div>
      )}

      {tooltip && <TooltipPortal data={tooltip} />}
    </div>
  );
};
