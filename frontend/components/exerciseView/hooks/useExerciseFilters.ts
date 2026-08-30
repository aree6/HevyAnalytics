import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { ExerciseStats } from '../../../types';
import { analyzeExerciseTrendCore, ExerciseTrendStatus, summarizeExerciseHistory } from '../../../utils/analysis/exerciseTrend';
import type { ExerciseTrendMode } from '../../../utils/storage/localStorage';
import { analyzeExerciseTrend, type StatusResult } from '../trend/exerciseTrendUi';
import type { ExerciseMuscleData } from '../../../utils/muscle/mapping';

export type ExerciseListSortMode = 'recent' | 'trend';

export interface UseExerciseFiltersReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  trendFilter: ExerciseTrendStatus | null;
  setTrendFilter: (filter: ExerciseTrendStatus | null) => void;
  exerciseListSortMode: ExerciseListSortMode;
  setExerciseListSortMode: (mode: ExerciseListSortMode) => void;
  exerciseListSortDir: 'desc' | 'asc';
  setExerciseListSortDir: (dir: 'desc' | 'asc') => void;
  showUnilateral: boolean;
  setShowUnilateral: (show: boolean) => void;
  viewModeOverride: 'all' | 'weekly' | 'monthly' | 'yearly' | null;
  setViewModeOverride: (mode: 'all' | 'weekly' | 'monthly' | 'yearly' | null) => void;
  filteredExercises: ExerciseStats[];
  statusMap: Record<string, StatusResult>;
  trainingStructure: {
    activeCount: number;
    overloadCount: number;
    plateauCount: number;
    regressionCount: number;
    newCount: number;
    statusByName: Map<string, ExerciseTrendStatus>;
    eligibleNames: Set<string>;
    eligibilityByName: Map<string, { isEligible: boolean; inactiveLabel: string }>;
  };
  lastSessionByName: Map<string, Date | null>;
  summarizedHistoryByName: Map<string, import('../../../utils/analysis/exerciseTrend').ExerciseSessionEntry[]>;
}

export interface UseExerciseFiltersProps {
  stats: ExerciseStats[];
  weightUnit: 'kg' | 'lbs';
  exerciseTrendMode: ExerciseTrendMode;
  effectiveNow: Date;
  muscleDataMap?: Map<string, ExerciseMuscleData>;
}

export function useExerciseFilters({
  stats,
  weightUnit,
  exerciseTrendMode,
  effectiveNow,
  muscleDataMap,
}: UseExerciseFiltersProps): UseExerciseFiltersReturn {
  const [searchTerm, setSearchTerm] = useState('');
  // Deferred filter term: keystrokes paint immediately while the 50–200-row
  // filter+sort resolves at lower priority (was fully synchronous per char).
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [trendFilter, setTrendFilter] = useState<ExerciseTrendStatus | null>(null);
  const [exerciseListSortMode, setExerciseListSortMode] = useState<ExerciseListSortMode>('recent');
  const [exerciseListSortDir, setExerciseListSortDir] = useState<'desc' | 'asc'>('desc');
  const [showUnilateral, setShowUnilateral] = useState(false);
  const [viewModeOverride, setViewModeOverride] = useState<'all' | 'weekly' | 'monthly' | 'yearly' | null>(null);

  // (Removed: mount-only effect resetting sort dir to 'desc' — the useState
  // initializer above is already 'desc', so the effect only added one wasted
  // commit per mount.)

  // Summarize history for all exercises
  const summarizedHistoryByName = useMemo(() => {
    const map = new Map<string, import('../../../utils/analysis/exerciseTrend').ExerciseSessionEntry[]>();
    for (const s of stats) {
      map.set(s.name, summarizeExerciseHistory(s.history, { exerciseName: s.name }));
    }
    return map;
  }, [stats]);

  // Calculate status for all exercises
  const statusMap = useMemo<Record<string, StatusResult>>(() => {
    const map: Record<string, StatusResult> = Object.create(null);
    for (const s of stats) {
      map[s.name] = analyzeExerciseTrend(s, weightUnit, { trendMode: exerciseTrendMode, summarizedHistory: summarizedHistoryByName.get(s.name) });
    }
    return map;
  }, [exerciseTrendMode, stats, weightUnit, summarizedHistoryByName]);

  // Track last session dates
  const lastSessionByName = useMemo(() => {
    const map = new Map<string, Date | null>();
    for (const s of stats) {
      let last: Date | null = null;
      for (const h of s.history) {
        const d = h.date;
        if (!d) continue;
        const ts = d.getTime();
        if (!Number.isFinite(ts) || ts <= 0) continue;
        const y = d.getFullYear();
        if (y <= 1970 || y >= 2100) continue;
        if (!last || ts > last.getTime()) last = d;
      }
      map.set(s.name, last);
    }
    return map;
  }, [stats]);

  // Calculate training structure
  const trainingStructure = useMemo(() => {
    const activeSince = new Date(effectiveNow.getTime() - 45 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let overloadCount = 0;
    let plateauCount = 0;
    let regressionCount = 0;
    let newCount = 0;

    const statusByName = new Map<string, ExerciseTrendStatus>();
    const eligibleNames = new Set<string>();
    const eligibilityByName = new Map<string, { isEligible: boolean; inactiveLabel: string }>();

    for (const stat of stats) {
      const sessions = summarizedHistoryByName.get(stat.name) ?? [];
      const lastDate = sessions[0]?.date ?? null;
      const tooOld = !lastDate || lastDate < activeSince;
      const isEligible = !tooOld;
      eligibilityByName.set(stat.name, {
        isEligible,
        inactiveLabel: 'inactive',
      });

      if (!isEligible) continue;

      eligibleNames.add(stat.name);

      activeCount += 1;
      const st = statusMap[stat.name]?.status ?? analyzeExerciseTrendCore(stat, { trendMode: exerciseTrendMode, summarizedHistory: sessions }).status;
      statusByName.set(stat.name, st);
      if (st === 'overload') overloadCount += 1;
      else if (st === 'stagnant') plateauCount += 1;
      else if (st === 'regression') regressionCount += 1;
      else newCount += 1;
    }

    return {
      activeCount,
      overloadCount,
      plateauCount,
      regressionCount,
      newCount,
      statusByName,
      eligibleNames,
      eligibilityByName,
    };
  }, [effectiveNow, exerciseTrendMode, stats, statusMap, summarizedHistoryByName]);

  // Filtered and sorted exercises: single pass, hoisted term/lower-casing.
  // (Was three chained passes with toLowerCase() re-allocated per row per
  // pass — the per-keystroke cost on 50–200 rows.)
  const filteredExercises = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();
    const hasTerm = term.length > 0;
    const out: ExerciseStats[] = [];
    for (const s of stats) {
      if (hasTerm) {
        const lowerName = s.name.toLowerCase();
        if (!lowerName.includes(term)) {
          const m = muscleDataMap?.get(lowerName);
          if (!m) continue;
          const inPrimary = m.primary_muscle ? m.primary_muscle.toLowerCase().includes(term) : false;
          const inSecondary = m.secondary_muscle ? m.secondary_muscle.toLowerCase().includes(term) : false;
          if (!inPrimary && !inSecondary) continue;
        }
      }
      if (trendFilter) {
        if (!trainingStructure.eligibleNames.has(s.name)) continue;
        const st = trainingStructure.statusByName.get(s.name);
        if (st !== trendFilter) continue;
      }
      out.push(s);
    }
    out.sort((a, b) => {
        const aEligible = trainingStructure.eligibleNames.has(a.name);
        const bEligible = trainingStructure.eligibleNames.has(b.name);
        if (aEligible !== bEligible) return aEligible ? -1 : 1;

        const dir = exerciseListSortDir === 'desc' ? 1 : -1;

        if (exerciseListSortMode === 'trend') {
          const ap = statusMap[a.name]?.diffPct;
          const bp = statusMap[b.name]?.diffPct;
          const aHas = ap !== undefined && Number.isFinite(ap);
          const bHas = bp !== undefined && Number.isFinite(bp);
          if (aHas && bHas && bp !== ap) return ((bp ?? 0) - (ap ?? 0)) * dir;
          if (aHas !== bHas) return aHas ? -1 : 1;
        }

        const at = lastSessionByName.get(a.name)?.getTime() ?? -Infinity;
        const bt = lastSessionByName.get(b.name)?.getTime() ?? -Infinity;
        if (bt !== at) return (bt - at) * dir;
        return a.name.localeCompare(b.name);
      });
      return out;
    },
    [exerciseListSortDir, exerciseListSortMode, lastSessionByName, muscleDataMap, stats, deferredSearchTerm, statusMap, trendFilter, trainingStructure.eligibleNames, trainingStructure.statusByName]);

  return {
    searchTerm,
    setSearchTerm,
    trendFilter,
    setTrendFilter,
    exerciseListSortMode,
    setExerciseListSortMode,
    exerciseListSortDir,
    setExerciseListSortDir,
    showUnilateral,
    setShowUnilateral,
    viewModeOverride,
    setViewModeOverride,
    filteredExercises,
    statusMap,
    trainingStructure,
    lastSessionByName,
    summarizedHistoryByName,
  };
}
