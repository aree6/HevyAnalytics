import type React from 'react';

export const startProgress = ({
  setProgress,
  progressTimerRef,
}: {
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  progressTimerRef: React.MutableRefObject<number | null>;
}): number => {
  setProgress(0);
  if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
  const start = Date.now();
  const t = window.setInterval(() => {
    setProgress((prev) => Math.min(90, Math.round(prev + Math.max(1, (90 - prev) * 0.05))));
  }, 100);
  progressTimerRef.current = t;
  return start;
};

export const finishProgress = ({
  startedAt,
  setProgress,
  setIsAnalyzing,
  setLoadingKind,
  progressTimerRef,
}: {
  startedAt: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingKind: React.Dispatch<React.SetStateAction<'hevy' | 'lyfta' | 'csv' | null>>;
  progressTimerRef: React.MutableRefObject<number | null>;
}): void => {
  const MIN_MS = 1200;
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, MIN_MS - elapsed);
  window.setTimeout(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
    setTimeout(() => {
      setIsAnalyzing(false);
      setLoadingKind(null);
      setProgress(0);
    }, 200);
  }, remaining);
};
