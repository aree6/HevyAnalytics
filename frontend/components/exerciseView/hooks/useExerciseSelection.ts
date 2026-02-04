import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ExerciseStats } from '../../../types';
import { summarizeExerciseHistory, type ExerciseSessionEntry } from '../../../utils/analysis/exerciseTrend';

export interface UseExerciseSelectionReturn {
  selectedExerciseName: string;
  setSelectedExerciseName: (name: string) => void;
  exerciseButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  mostRecentExerciseName: string;
  scrollToExercise: (exerciseName: string) => void;
}

export interface UseExerciseSelectionProps {
  stats: ExerciseStats[];
  highlightedExercise?: string | null;
  onHighlightApplied?: () => void;
}

export function useExerciseSelection({
  stats,
  highlightedExercise,
  onHighlightApplied,
}: UseExerciseSelectionProps): UseExerciseSelectionReturn {
  // Find most recent exercise
  const mostRecentExerciseName = useMemo(() => {
    if (stats.length === 0) return '';
    let mostRecentName = stats[0].name;
    let mostRecentDate: Date | null = null;

    for (const stat of stats) {
      const lastSession = stat.history[0]?.date || null;
      if (lastSession && (!mostRecentDate || lastSession > mostRecentDate)) {
        mostRecentDate = lastSession;
        mostRecentName = stat.name;
      }
    }
    return mostRecentName;
  }, [stats]);

  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(highlightedExercise || mostRecentExerciseName || '');
  const exerciseButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-select most recent on load
  useEffect(() => {
    if (!selectedExerciseName && mostRecentExerciseName) {
      setSelectedExerciseName(mostRecentExerciseName);
    }
  }, [selectedExerciseName, mostRecentExerciseName]);

  // Handle highlight from URL param
  useEffect(() => {
    if (!highlightedExercise) return;

    const trimmed = highlightedExercise.trim();
    const exact = stats.find(s => s.name === trimmed)?.name;
    const caseInsensitive = exact
      ? exact
      : stats.find(s => s.name.trim().toLowerCase() === trimmed.toLowerCase())?.name;

    if (!caseInsensitive) return;

    setSelectedExerciseName(caseInsensitive);
    requestAnimationFrame(() => {
      const el = exerciseButtonRefs.current[caseInsensitive];
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    onHighlightApplied?.();
  }, [highlightedExercise, onHighlightApplied, stats]);

  const scrollToExercise = useCallback((exerciseName: string) => {
    const el = exerciseButtonRefs.current[exerciseName];
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  return {
    selectedExerciseName,
    setSelectedExerciseName,
    exerciseButtonRefs,
    mostRecentExerciseName,
    scrollToExercise,
  };
}
