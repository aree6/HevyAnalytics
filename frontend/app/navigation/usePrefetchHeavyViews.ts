import { useEffect } from 'react';

export const usePrefetchHeavyViews = (): void => {
  useEffect(() => {
    const idle = (cb: () => void) =>
      'requestIdleCallback' in window
        ? (window as any).requestIdleCallback(cb)
        : setTimeout(cb, 300);

    idle(() => {
      import('../../components/exerciseView/ui/ExerciseView');
      import('../../components/historyView/ui/HistoryView');
      import('../../components/muscleAnalysis/ui/MuscleAnalysis');
      import('../../components/flexView/ui/FlexView');
    });
  }, []);
};
