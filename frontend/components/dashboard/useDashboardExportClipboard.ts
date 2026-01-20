import { useCallback, useEffect, useRef, useState } from 'react';

import type { DailySummary, ExerciseStats, WorkoutSet } from '../../types';
import { exportPackageAndCopyText } from '../../utils/export/clipboardExport';

export type DashboardExportWindow = '1' | '2' | '3' | '6' | '12' | 'all';

interface UseDashboardExportClipboardArgs {
  fullData: WorkoutSet[];
  dailyData: DailySummary[];
  exerciseStats: ExerciseStats[];
  effectiveNow: Date;
}

export const useDashboardExportClipboard = ({
  fullData,
  dailyData,
  exerciseStats,
  effectiveNow,
}: UseDashboardExportClipboardArgs) => {
  const [exportWindow, setExportWindow] = useState<DashboardExportWindow>('1');
  const [timelineSelected, setTimelineSelected] = useState<DashboardExportWindow | null>(null);
  const [showTimelineChips, setShowTimelineChips] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const [reCopyCopied, setReCopyCopied] = useState(false);
  const reCopyTimerRef = useRef<number | null>(null);

  const [exportCopied, setExportCopied] = useState(false);

  const handleExportAction = useCallback(() => {
    setShowTimelineChips(true);
  }, []);

  const performCopyForTimeline = useCallback(
    async (k: DashboardExportWindow) => {
      const months: number | 'all' = k === 'all' ? 'all' : Number(k);
      try {
        await exportPackageAndCopyText(fullData, dailyData, exerciseStats, months, new Date(), effectiveNow);
        setExportCopied(true);
        setExportWindow(k);
        setTimelineSelected(k);
        setShowTimelineChips(false);

        if (resetTimerRef.current) {
          window.clearTimeout(resetTimerRef.current);
        }

        resetTimerRef.current = window.setTimeout(() => {
          setExportCopied(false);
          setTimelineSelected(null);
          setExportWindow('1');
          setShowTimelineChips(false);
          resetTimerRef.current = null;
        }, 8000);
      } catch (e) {
        console.error('export failed', e);
      }
    },
    [dailyData, effectiveNow, exerciseStats, fullData]
  );

  const reCopy = useCallback(async () => {
    if (!timelineSelected) return;

    const months: number | 'all' = timelineSelected === 'all' ? 'all' : Number(timelineSelected);
    try {
      await exportPackageAndCopyText(fullData, dailyData, exerciseStats, months, new Date(), effectiveNow);
      setReCopyCopied(true);
      if (reCopyTimerRef.current) window.clearTimeout(reCopyTimerRef.current);
      reCopyTimerRef.current = window.setTimeout(() => setReCopyCopied(false), 2000);
    } catch (e) {
      console.error('recopy failed', e);
    }
  }, [dailyData, effectiveNow, exerciseStats, fullData, timelineSelected]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      if (reCopyTimerRef.current) window.clearTimeout(reCopyTimerRef.current);
    };
  }, []);

  return {
    exportWindow,
    timelineSelected,
    showTimelineChips,
    setShowTimelineChips,
    exportCopied,
    reCopyCopied,
    handleExportAction,
    performCopyForTimeline,
    reCopy,
  };
};
