import { useEffect } from 'react';

export const usePrefetchHeavyViews = (): void => {
  useEffect(() => {
    const idle = (cb: () => void) =>
      'requestIdleCallback' in window
        ? (window as any).requestIdleCallback(cb)
        : setTimeout(cb, 300);

    idle(() => {
      import('../components/exerciseView/ExerciseView');
      import('../components/historyView/HistoryView');
      import('../components/muscleAnalysis/MuscleAnalysis');
      import('../components/flexView/FlexView');
    });
  }, []);
};
