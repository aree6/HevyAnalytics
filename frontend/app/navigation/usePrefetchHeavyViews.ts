import { useEffect } from 'react';

export const usePrefetchHeavyViews = (): void => {
  useEffect(() => {
    // Never prefetch on data-saver: it defeats tab code-splitting for users
    // who only ever open one tab.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    // Stagger: firing all four heavy imports in one idle callback contends
    // with the active tab's own chunk/network on tab switch.
    const views = [
      () => import('../../components/exerciseView/ui/ExerciseView'),
      () => import('../../components/historyView/ui/HistoryView'),
      () => import('../../components/muscleAnalysis/ui/MuscleAnalysis'),
      () => import('../../components/flexView/ui/FlexView'),
    ];
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    let cancelled = false;
    let idleId: number | ReturnType<typeof setTimeout> | undefined;
    const cancelIdle = () => {
      if (idleId === undefined) return;
      if ('cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId as ReturnType<typeof setTimeout>);
      }
    };
    const scheduleIdle = (cb: () => void, timeout = 2000) =>
      'requestIdleCallback' in window
        ? (window as any).requestIdleCallback(cb, { timeout })
        : setTimeout(cb, 300);

    idleId = scheduleIdle(() => {
      if (cancelled) return;
      views.forEach((load, i) => {
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            load().catch(() => {
              // Chunk prefetch is best-effort; the tab's own Suspense path
              // retries on actual navigation.
            });
          }, i * 1500),
        );
      });
    });

    return () => {
      cancelled = true;
      cancelIdle();
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);
};
