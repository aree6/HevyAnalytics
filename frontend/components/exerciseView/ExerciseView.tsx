import React, { useState, useMemo, useEffect, useRef } from 'react';
import { subDays } from 'date-fns';
import { 
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Search, Activity, Hourglass,
  Dumbbell, Infinity
} from 'lucide-react';
import { ExerciseStats } from '../../types';
import { FANCY_FONT } from '../../utils/ui/uiConstants';
import { getExerciseAssets, ExerciseAsset } from '../../utils/data/exerciseAssets';
import { createExerciseAssetLookup, ExerciseAssetLookup } from '../../utils/exercise/exerciseAssetLookup';
import { formatRelativeTime } from '../../utils/date/dateUtils';
import { BodyMap, BodyMapGender } from '../bodyMap/BodyMap';
import { LazyRender } from '../ui/LazyRender';
import { ChartSkeleton } from '../ui/ChartSkeleton';
import { 
  loadExerciseMuscleData, 
  ExerciseMuscleData, 
  getExerciseMuscleVolumes,
  getVolumeColor,
  SVG_MUSCLE_NAMES,
  lookupExerciseMuscleData,
} from '../../utils/muscle/muscleMapping';
import { ExerciseTrendMode, WeightUnit, getSmartFilterMode, TimeFilterMode } from '../../utils/storage/localStorage';
import { summarizeExerciseHistory, analyzeExerciseTrendCore, ExerciseSessionEntry, ExerciseTrendStatus, MIN_SESSIONS_FOR_TREND } from '../../utils/analysis/exerciseTrend';
import { formatNumber } from '../../utils/format/formatters';
import { 
  getRechartsCategoricalTicks,
  getRechartsTickIndexMap,
  RECHARTS_XAXIS_PADDING,
} from '../../utils/chart/chartEnhancements';
import { addEmaSeries, DEFAULT_EMA_HALF_LIFE_DAYS } from '../../utils/analysis/ema';

import { calculateExerciseDeltas } from './exerciseDeltas';
import { buildExerciseChartData } from './exerciseChartData';
import { computeEffectiveNowFromStats, resolveEffectiveNow } from './effectiveNow';
import { getSelectedHighlightClasses } from './exerciseRowHighlight';
import { analyzeExerciseTrend, type StatusResult } from './exerciseTrendUi';
import { ConfidenceBadge } from './ExerciseBadges';
import { CustomTooltip } from './ExerciseChartTooltip';
import { StrengthProgressionValueDot } from './StrengthProgressionValueDot';

// --- MAIN COMPONENT ---

interface ExerciseViewProps {
  stats: ExerciseStats[];
  filtersSlot?: React.ReactNode;
  highlightedExercise?: string | null;
  onHighlightApplied?: () => void;
  onExerciseClick?: (exerciseName: string) => void;
  weightUnit?: WeightUnit;
  exerciseTrendMode: ExerciseTrendMode;
  bodyMapGender?: BodyMapGender;
  stickyHeader?: boolean;
  now?: Date;
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({ stats, filtersSlot, highlightedExercise, onHighlightApplied, onExerciseClick, weightUnit = 'kg' as WeightUnit, exerciseTrendMode, bodyMapGender = 'male', stickyHeader = false, now }) => {
  // Find the most recent exercise for auto-selection
  const mostRecentExerciseName = useMemo(() => {
    if (stats.length === 0) return "";
    
    // Find exercise with most recent session
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

  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(highlightedExercise || mostRecentExerciseName || "");
  const [trendFilter, setTrendFilter] = useState<ExerciseTrendStatus | null>(null);
  // Toggle for showing unilateral (L/R) view
  const [showUnilateral, setShowUnilateral] = useState(false);

  // Auto-select most recent exercise when component loads or when no exercise is selected
  useEffect(() => {
    if (!selectedExerciseName && mostRecentExerciseName) {
      setSelectedExerciseName(mostRecentExerciseName);
    }
  }, [selectedExerciseName, mostRecentExerciseName]);
 
  const exerciseButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Update selection when highlightedExercise changes
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

  const computedEffectiveNow = useMemo(() => {
    return computeEffectiveNowFromStats(stats);
  }, [stats]);

  const effectiveNow = useMemo(() => {
    return resolveEffectiveNow(computedEffectiveNow, now);
  }, [computedEffectiveNow, now]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset> | null>(null);
  const [viewModeOverride, setViewModeOverride] = useState<TimeFilterMode | null>(null);
  const [exerciseMuscleData, setExerciseMuscleData] = useState<Map<string, ExerciseMuscleData>>(new Map());

  // Create fuzzy asset lookup that can resolve exercise name variations
  const assetLookup = useMemo<ExerciseAssetLookup | null>(() => {
    if (!assetsMap) return null;
    return createExerciseAssetLookup(assetsMap);
  }, [assetsMap]);

  // Selected exercise stats
  const selectedStats = useMemo(() => 
    stats.find(s => s.name === selectedExerciseName), 
  [stats, selectedExerciseName]);

  const selectedSessions = useMemo(() => {
    if (!selectedStats) return [] as ExerciseSessionEntry[];
    // If exercise has unilateral data, separate by side so we can show L/R on chart
    const separateSides = selectedStats.hasUnilateralData ?? false;
    return summarizeExerciseHistory(selectedStats.history, { separateSides });
  }, [selectedStats]);

  const inactiveReason = useMemo(() => {
    if (!selectedStats) return null;

    const activeSince = subDays(effectiveNow, 60);
    const lastDate = selectedSessions[0]?.date ?? null;
    const tooOld = !lastDate || lastDate < activeSince;
    const notEnoughData = selectedSessions.length < MIN_SESSIONS_FOR_TREND;

    if (!tooOld && !notEnoughData) return null;

    const parts: string[] = [];
    if (tooOld) parts.push('You haven\'t trained this exercise recently');
    if (notEnoughData) parts.push('New exercise: keep logging sessions to build your baseline (check back soon for trends)');

    return {
      parts,
      tooOld,
      notEnoughData,
    };
  }, [effectiveNow, selectedSessions, selectedStats]);

  // Calculate date range span for selected exercise
  const exerciseSpanDays = useMemo(() => {
    if (selectedSessions.length === 0) return 0;
    const dates = selectedSessions.map(h => h.date.getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return Math.max(1, Math.round((max - min) / (1000 * 60 * 60 * 24)) + 1);
  }, [selectedSessions]);

  // Smart mode based on date range span
  const smartMode = useMemo(() => getSmartFilterMode(exerciseSpanDays), [exerciseSpanDays]);

  const allAggregationMode = useMemo<'daily' | 'weekly' | 'monthly'>(() => {
    return smartMode === 'all' ? 'daily' : smartMode;
  }, [smartMode]);

  // Reset override when exercise changes
  // Effective view mode: override if set, otherwise default to last-year range.
  const viewMode = viewModeOverride ?? 'yearly';
  const setViewMode = setViewModeOverride;

  useEffect(() => {
    let mounted = true;
    getExerciseAssets()
      .then(m => { if (mounted) setAssetsMap(m); })
      .catch(() => setAssetsMap(new Map()));
    loadExerciseMuscleData()
      .then(m => { if (mounted) setExerciseMuscleData(m); });
    return () => { mounted = false; };
  }, []);

  // Memoize status map to prevent recalc on every render
  const statusMap = useMemo<Record<string, StatusResult>>(() => {
    const map: Record<string, StatusResult> = Object.create(null);
    for (const s of stats) {
      map[s.name] = analyzeExerciseTrend(s, weightUnit, { trendMode: exerciseTrendMode });
    }
    return map;
  }, [exerciseTrendMode, stats, weightUnit]);

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

  const selectedExerciseMuscleInfo = useMemo(() => {
    const exData = selectedStats ? lookupExerciseMuscleData(selectedStats.name, exerciseMuscleData) : undefined;
    const { volumes, maxVolume } = getExerciseMuscleVolumes(exData);

    // Aggregate by display name (e.g. Chest has multiple SVG ids)
    const aggregated = new Map<string, { sets: number }>();
    volumes.forEach((sets, svgId) => {
      const label = SVG_MUSCLE_NAMES[svgId] || svgId;
      const prev = aggregated.get(label);
      if (!prev || sets > prev.sets) {
        aggregated.set(label, { sets });
      }
    });

    const primaryTargets: Array<{ label: string; sets: number }> = [];
    const secondaryTargets: Array<{ label: string; sets: number }> = [];

    for (const [label, { sets }] of aggregated.entries()) {
      if (sets >= 1) primaryTargets.push({ label, sets });
      else secondaryTargets.push({ label, sets });
    }

    primaryTargets.sort((a, b) => a.label.localeCompare(b.label));
    secondaryTargets.sort((a, b) => a.label.localeCompare(b.label));

    return { exData, volumes, maxVolume, primaryTargets, secondaryTargets };
  }, [selectedStats, exerciseMuscleData]);

  const getTargetTextColor = (sets: number, maxSets: number): string => {
    const ratio = sets / Math.max(maxSets, 1);
    return ratio >= 0.55 ? '#ffffff' : '#0f172a';
  };

  const trainingStructure = useMemo(() => {
    const activeSince = subDays(effectiveNow, 60);

    let activeCount = 0;
    let overloadCount = 0;
    let plateauCount = 0;
    let regressionCount = 0;
    let neutralCount = 0;
    let newCount = 0;

    const statusByName = new Map<string, ExerciseTrendStatus>();
    const eligibleNames = new Set<string>();
    const eligibilityByName = new Map<string, { isEligible: boolean; inactiveLabel: string }>();

    for (const stat of stats) {
      const sessions = summarizeExerciseHistory(stat.history);
      const lastDate = sessions[0]?.date ?? null;
      const tooOld = !lastDate || lastDate < activeSince;
      const notEnoughData = sessions.length < MIN_SESSIONS_FOR_TREND;
      const isEligible = !tooOld && !notEnoughData;
      eligibilityByName.set(stat.name, {
        isEligible,
        inactiveLabel: notEnoughData ? 'baseline' : 'inactive',
      });

      if (!isEligible) continue;

      eligibleNames.add(stat.name);

      activeCount += 1;
      const core = analyzeExerciseTrendCore(stat, { trendMode: exerciseTrendMode });
      statusByName.set(stat.name, core.status);
      if (core.status === 'overload') overloadCount += 1;
      else if (core.status === 'stagnant') plateauCount += 1;
      else if (core.status === 'regression') regressionCount += 1;
      else if (core.status === 'neutral') neutralCount += 1;
      else newCount += 1;
    }

    return {
      activeCount,
      overloadCount,
      plateauCount,
      regressionCount,
      neutralCount,
      newCount,
      statusByName,
      eligibleNames,
      eligibilityByName,
    };
  }, [effectiveNow, exerciseTrendMode, stats]);

  useEffect(() => {
    if (!trendFilter) return;
    if (!selectedStats) return;
    if (!trainingStructure.eligibleNames.has(selectedStats.name)) {
      const firstEligible = Array.from(trainingStructure.eligibleNames)[0];
      if (firstEligible) setSelectedExerciseName(firstEligible);
      return;
    }
    const s = trainingStructure.statusByName.get(selectedStats.name);
    if (s && s !== trendFilter) {
      const firstMatch = Array.from(trainingStructure.statusByName.entries()).find(([, st]) => st === trendFilter)?.[0];
      if (firstMatch) setSelectedExerciseName(firstMatch);
    }
  }, [selectedStats, trendFilter, trainingStructure.eligibleNames, trainingStructure.statusByName]);

  const filteredExercises = useMemo(() => 
    stats
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(s => {
        if (!trendFilter) return true;
        if (!trainingStructure.eligibleNames.has(s.name)) return false;
        const st = trainingStructure.statusByName.get(s.name);
        return st === trendFilter;
      })
      .sort((a, b) => {
        const at = lastSessionByName.get(a.name)?.getTime() ?? -Infinity;
        const bt = lastSessionByName.get(b.name)?.getTime() ?? -Infinity;
        if (bt !== at) return bt - at;
        return a.name.localeCompare(b.name);
      }),
  [lastSessionByName, stats, searchTerm, trendFilter, trainingStructure.eligibleNames, trainingStructure.statusByName]);

  const capitalizeLabel = (s: string): string => {
    const trimmed = String(s ?? '').trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const headerCenterSlot = useMemo(() => {
    if (trainingStructure.activeCount <= 0) return filtersSlot;

    const isSelected = (s: ExerciseTrendStatus) => trendFilter === s;
    const chipCls = (s: ExerciseTrendStatus, tone: 'good' | 'warn' | 'bad' | 'neutral' | 'info') => {
      const base = 'text-[10px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200';
      const selected = isSelected(s);
      const hasAnyFilter = trendFilter !== null;
      
      if (selected) {
        // Highlighted state - full opacity and enhanced styling
        if (tone === 'good') return `${base} bg-emerald-500/20 text-emerald-200 border-emerald-400/50 shadow-lg shadow-emerald-500/20`;
        if (tone === 'warn') return `${base} bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-lg shadow-amber-500/20`;
        if (tone === 'bad') return `${base} bg-rose-500/20 text-rose-200 border-rose-400/50 shadow-lg shadow-rose-500/20`;
        if (tone === 'neutral') return `${base} bg-indigo-500/20 text-indigo-200 border-indigo-400/50 shadow-lg shadow-indigo-500/20`;
        return `${base} bg-blue-500/20 text-blue-200 border-blue-400/50 shadow-lg shadow-blue-500/20`;
      } else if (hasAnyFilter) {
        // Dimmed state - reduced opacity when another filter is selected
        if (tone === 'good') return `${base} bg-emerald-500/5 text-emerald-400/80 border-emerald-500/15 hover:bg-emerald-500/10 hover:text-emerald-300/90 hover:border-emerald-400/30`;
        if (tone === 'warn') return `${base} bg-amber-500/5 text-amber-400/80 border-amber-500/15 hover:bg-amber-500/10 hover:text-amber-300/90 hover:border-amber-400/30`;
        if (tone === 'bad') return `${base} bg-rose-500/5 text-rose-400/80 border-rose-500/15 hover:bg-rose-500/10 hover:text-rose-300/90 hover:border-rose-400/30`;
        if (tone === 'neutral') return `${base} bg-indigo-500/5 text-indigo-400/80 border-indigo-500/15 hover:bg-indigo-500/10 hover:text-indigo-300/90 hover:border-indigo-400/30`;
        return `${base} bg-blue-500/5 text-blue-400/80 border-blue-500/15 hover:bg-blue-500/10 hover:text-blue-300/90 hover:border-blue-400/30`;
      } else {
        // Normal state - full opacity when no filter is selected
        if (tone === 'good') return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:border-emerald-400/40`;
        if (tone === 'warn') return `${base} bg-amber-500/10 text-amber-300 border-amber-500/20 hover:border-amber-400/40`;
        if (tone === 'bad') return `${base} bg-rose-500/10 text-rose-300 border-rose-500/20 hover:border-rose-400/40`;
        if (tone === 'neutral') return `${base} bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:border-indigo-400/40`;
        return `${base} bg-blue-500/10 text-blue-300 border-blue-500/20 hover:border-blue-400/40`;
      }
    };

    const toggle = (s: ExerciseTrendStatus) => {
      setTrendFilter(prev => (prev === s ? null : s));
    };

    return (
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 justify-start min-w-0">
          <span className="text-xs text-slate-200 font-semibold whitespace-nowrap">
            {trainingStructure.activeCount} active exercises
          </span>
          <button type="button" onClick={() => toggle('overload')} className={chipCls('overload', 'good')}>
            {trainingStructure.overloadCount} Gaining
          </button>
          <button type="button" onClick={() => toggle('stagnant')} className={chipCls('stagnant', 'warn')}>
            {trainingStructure.plateauCount} Plateauing
          </button>
        </div>

        <div className="justify-self-center">{filtersSlot}</div>

        <div className="flex items-center gap-2 justify-end min-w-0">
          <button type="button" onClick={() => toggle('regression')} className={chipCls('regression', 'bad')}>
            {trainingStructure.regressionCount} Losing
          </button>
          <button type="button" onClick={() => toggle('neutral')} className={chipCls('neutral', 'neutral')}>
            {trainingStructure.neutralCount} Maintaining
          </button>
          <button type="button" onClick={() => toggle('new')} className={chipCls('new', 'info')}>
            {trainingStructure.newCount} Baseline
          </button>
        </div>
      </div>
    );
  }, [filtersSlot, trainingStructure.activeCount, trainingStructure.neutralCount, trainingStructure.newCount, trainingStructure.overloadCount, trainingStructure.plateauCount, trainingStructure.regressionCount, trendFilter]);

  const currentStatus = selectedStats ? statusMap[selectedStats.name] : null;
  const isBodyweightLike = currentStatus?.isBodyweightLike ?? false;

  const currentCore = useMemo(() => {
    if (!selectedStats) return null;
    return analyzeExerciseTrendCore(selectedStats, { trendMode: exerciseTrendMode });
  }, [exerciseTrendMode, selectedStats]);

  const chartData = useMemo(() => {
    return buildExerciseChartData({
      selectedStats,
      selectedSessions,
      viewMode,
      allAggregationMode,
      weightUnit,
      effectiveNow,
      isBodyweightLike,
    });
  }, [selectedStats, selectedSessions, viewMode, allAggregationMode, weightUnit, effectiveNow, isBodyweightLike]);

  // Check if chart has unilateral L/R data
  const hasUnilateralChartData = useMemo(() => {
    if (!selectedStats?.hasUnilateralData) return false;
    return chartData.some((d: any) => d.leftOneRepMax !== undefined || d.rightOneRepMax !== undefined);
  }, [chartData, selectedStats?.hasUnilateralData]);

  const chartDataWithEma = useMemo(() => {
    const key = isBodyweightLike ? 'reps' : 'oneRepMax';
    return addEmaSeries(chartData as any, key, 'emaValue', {
      halfLifeDays: DEFAULT_EMA_HALF_LIFE_DAYS,
      timestampKey: 'timestamp',
    });
  }, [chartData, isBodyweightLike]);

  const xTicks = useMemo(() => {
    return getRechartsCategoricalTicks(chartDataWithEma, (row: any) => row?.date);
  }, [chartDataWithEma]);

  const tickIndexMap = useMemo(() => {
    return getRechartsTickIndexMap(chartDataWithEma.length);
  }, [chartDataWithEma.length]);
  const isSelectedEligible = useMemo(() => {
    if (!selectedStats) return true;
    return trainingStructure.eligibilityByName.get(selectedStats.name)?.isEligible ?? false;
  }, [selectedStats, trainingStructure.eligibilityByName]);

  // Calculate deltas for selected exercise
  const exerciseDeltas = useMemo(() => {
    if (!selectedStats || selectedStats.history.length < 2) return null;
    return calculateExerciseDeltas(selectedStats.history);
  }, [selectedStats]);

  // Stats for header
  const sessionsCount = selectedStats ? selectedSessions.length : 0;


  const bestRepsImprovement = useMemo(() => {
    if (selectedSessions.length === 0) return 0;
    const reps: number[] = selectedSessions.map((s) => s.maxReps);
    const unique: number[] = Array.from(new Set<number>(reps)).sort((a, b) => b - a);
    if (unique.length < 2) return 0;
    return unique[0] - unique[1];
  }, [selectedSessions]);

  const repsDeltaFromLastSession = useMemo(() => {
    if (selectedSessions.length < 2) return 0;
    return (selectedSessions[0]?.maxReps ?? 0) - (selectedSessions[1]?.maxReps ?? 0);
  }, [selectedSessions]);

  const avgRepsLast3 = useMemo(() => {
    if (selectedSessions.length === 0) return 0;
    const last3 = selectedSessions.slice(0, 3);
    const sum = last3.reduce((acc, s) => acc + s.maxReps, 0);
    return sum / last3.length;
  }, [selectedSessions]);

  return (
    <div className="flex flex-col gap-2 w-full text-slate-200 pb-10">
      <div className="sm:hidden">
        <div className="bg-black/70 p-2 rounded-xl">
          {trainingStructure.activeCount > 0 ? (
            <div className="flex items-center gap-0.5 overflow-x-auto whitespace-nowrap custom-scrollbar">
              <button type="button" onClick={() => setTrendFilter(null)} className={`text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === null ? 'bg-slate-500/20 text-slate-200 border-slate-400/50 ring-2 ring-slate-500/30 shadow-lg shadow-slate-500/20' : trendFilter !== null ? 'bg-slate-500/5 text-slate-400/80 border-slate-500/15 hover:bg-slate-500/10 hover:text-slate-300/90 hover:border-slate-400/30' : 'bg-slate-500/10 text-slate-300 border-slate-500/20 hover:border-slate-400/40'}`}>
                {trainingStructure.activeCount} active
              </button>
              <button type="button" onClick={() => setTrendFilter(prev => (prev === 'overload' ? null : 'overload'))} className={`text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'overload' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20' : trendFilter !== null ? 'bg-emerald-500/5 text-emerald-400/80 border-emerald-500/15 hover:bg-emerald-500/10 hover:text-emerald-300/90 hover:border-emerald-400/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:border-emerald-400/40'}`}>
                {trainingStructure.overloadCount} Gaining
              </button>
              <button type="button" onClick={() => setTrendFilter(prev => (prev === 'stagnant' ? null : 'stagnant'))} className={`text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'stagnant' ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20' : trendFilter !== null ? 'bg-amber-500/5 text-amber-400/80 border-amber-500/15 hover:bg-amber-500/10 hover:text-amber-300/90 hover:border-amber-400/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:border-amber-400/40'}`}>
                {trainingStructure.plateauCount} Plateauing
              </button>
              <button type="button" onClick={() => setTrendFilter(prev => (prev === 'regression' ? null : 'regression'))} className={`text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'regression' ? 'bg-rose-500/20 text-rose-200 border-rose-400/50 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/20' : trendFilter !== null ? 'bg-rose-500/5 text-rose-400/80 border-rose-500/15 hover:bg-rose-500/10 hover:text-rose-300/90 hover:border-rose-400/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:border-rose-400/40'}`}>
                {trainingStructure.regressionCount} Losing
              </button>
              <button type="button" onClick={() => setTrendFilter(prev => (prev === 'neutral' ? null : 'neutral'))} className={`text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'neutral' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20' : trendFilter !== null ? 'bg-indigo-500/5 text-indigo-400/80 border-indigo-500/15 hover:bg-indigo-500/10 hover:text-indigo-300/90 hover:border-indigo-400/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:border-indigo-400/40'}`}>
                {trainingStructure.neutralCount} Maintaining
              </button>
              <button type="button" onClick={() => setTrendFilter(prev => (prev === 'new' ? null : 'new'))} className={`text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'new' ? 'bg-blue-500/20 text-blue-200 border-blue-400/50 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20' : trendFilter !== null ? 'bg-blue-500/5 text-blue-400/80 border-blue-500/15 hover:bg-blue-500/10 hover:text-blue-300/90 hover:border-blue-400/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:border-blue-400/40'}`}>
                {trainingStructure.newCount} Baseline
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden sm:contents">
        <div className={`${stickyHeader ? 'sticky top-0 z-30' : ''} bg-black/70 p-2 sm:p-3 rounded-xl`}>
          {headerCenterSlot}
        </div>
      </div>
      
      {/* 
          TOP SECTION: GRID LAYOUT 
          Grid items default to stretch, so columns will be equal height.
      */}
      <div className="grid grid-cols-1 lg:[grid-template-columns:40%_60%] gap-2 items-stretch">
        
        {/* --- LEFT: SIDEBAR --- */}
        {/* 
            Height logic:
            Mobile: h-[40.5vh]
            Desktop (lg): h-0 + min-h-full. 
            This forces the grid row height to be determined by the RIGHT panel (the bottleneck),
            and the left panel stretches to match it, then scrolls internally.
        */}
        <div className="lg:col-span-1 flex flex-col gap-1 h-[25vh] lg:h-0 lg:min-h-full">
          {/* Search Header */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search for exercises..."
              className="w-full bg-black/70 border border-slate-700/50 rounded-lg pl-9 pr-3 py-1 sm:py-2 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* LIST WRAPPER */}
          <div className="flex-1 bg-black/70 border border-slate-700/50 rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar flex-1">
              {filteredExercises.map((ex) => {
                const status = statusMap[ex.name];
                const isSelected = selectedExerciseName === ex.name;
                const asset = assetLookup?.getAsset(ex.name);
                const isEligible = trainingStructure.eligibilityByName.get(ex.name)?.isEligible ?? false;
                const subLabel = isEligible
                  ? status.label
                  : (trainingStructure.eligibilityByName.get(ex.name)?.inactiveLabel ?? 'inactive');

                const lastDone = lastSessionByName.get(ex.name) ?? null;
                const lastDoneLabel = lastDone
                  ? formatRelativeTime(lastDone, effectiveNow)
                  : '—';

                const selectedHighlight = getSelectedHighlightClasses(status.status, !isEligible ? 'soft' : 'strong');
                const RowStatusIcon = status.icon;
                const displayLabel = capitalizeLabel(subLabel);
                const IneligibleStatusIcon = displayLabel === 'Baseline' ? Hourglass : null;

                return (
                  <button
                    key={ex.name}
                    ref={(el) => {
                      exerciseButtonRefs.current[ex.name] = el;
                    }}
                    onClick={() => {
                      if (onExerciseClick) {
                        onExerciseClick(ex.name);
                        return;
                      }
                      setSelectedExerciseName(ex.name);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-all duration-200 flex items-center justify-between group border ${
                      isSelected
                        ? selectedHighlight.button
                        : 'border-transparent hover:bg-black/60 hover:border-slate-600/50'
                    } ${!isEligible ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {(() => {
                        if (!asset) return (
                          <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-black/50 flex items-center justify-center text-slate-500">
                            <Dumbbell className="w-5 h-5" />
                          </div>
                        );
                        const imgUrl = asset.sourceType === 'video' ? asset.thumbnail : (asset.thumbnail || asset.source);
                        return imgUrl ? (
                          <img src={imgUrl} alt="" className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover bg-white" loading="lazy" decoding="async" />
                        ) : (
                          <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-black/50 flex items-center justify-center text-slate-500">
                            <Dumbbell className="w-5 h-5" />
                          </div>
                        );
                      })()}
                      <div className="flex flex-col min-w-0 h-12 sm:h-16 justify-between py-1">
                        <span className={`truncate text-xs ${isSelected ? 'text-slate-200 font-semibold' : 'text-slate-300 group-hover:text-white'}`}>
                          {ex.name}
                        </span>
                        <span className={`truncate text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                          {lastDoneLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEligible ? (
                        <div className={`px-1.5 py-1 rounded-md ${status.bgColor} ${isSelected ? 'animate-in zoom-in-50 duration-200' : ''} flex items-center gap-1`}>
                          <RowStatusIcon className={`w-3 h-3 ${status.color}`} />
                          <span className={`text-[10px] font-bold ${status.color}`}>{displayLabel}</span>
                        </div>
                      ) : (
                        <div className={`px-1.5 py-1 rounded-md bg-slate-700/20 border border-slate-700/30 ${isSelected ? 'animate-in zoom-in-50 duration-200' : ''} flex items-center gap-1`}>
                          {IneligibleStatusIcon ? (
                            <IneligibleStatusIcon className="w-3 h-3 text-slate-400" />
                          ) : null}
                          <span className="text-[10px] font-bold text-slate-400">{displayLabel}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- RIGHT: HEADER & METRICS --- */}
        <div className="lg:col-span-1 flex flex-col gap-2 h-full min-h-0">
          {selectedStats && currentStatus ? (
            <div className="flex flex-col h-full gap-2">
              
              {/* 1. Header with exercise image and mini heatmap */}
              <div className="inline-flex items-start gap-4 shrink-0 bg-white rounded-xl p-3 self-start w-fit max-w-full">
                {/* Mini Body Map showing muscles this exercise targets */}
                <div className="flex items-start gap-3">
                  <div className="w-24 h-20 flex items-center justify-center rounded-lg ">
                    <BodyMap
                      onPartClick={() => {}}
                      selectedPart={null}
                      muscleVolumes={selectedExerciseMuscleInfo.volumes}
                      maxVolume={selectedExerciseMuscleInfo.maxVolume}
                      compact
                      gender={bodyMapGender}
                    />
                  </div>

                  {(selectedExerciseMuscleInfo.primaryTargets.length > 0 || selectedExerciseMuscleInfo.secondaryTargets.length > 0) && (
                    <div className="space-y-2 min-w-0 max-w-[220px]">
                      {selectedExerciseMuscleInfo.primaryTargets.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-700">Primary</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedExerciseMuscleInfo.primaryTargets.map(t => (
                              <span
                                key={`primary-${t.label}`}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-900/10"
                                style={{
                                  backgroundColor: getVolumeColor(t.sets, selectedExerciseMuscleInfo.maxVolume),
                                  color: getTargetTextColor(t.sets, selectedExerciseMuscleInfo.maxVolume),
                                }}
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedExerciseMuscleInfo.secondaryTargets.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-700">Secondary</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedExerciseMuscleInfo.secondaryTargets.map(t => (
                              <span
                                key={`secondary-${t.label}`}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-900/10"
                                style={{
                                  backgroundColor: getVolumeColor(t.sets, selectedExerciseMuscleInfo.maxVolume),
                                  color: '#ffffff',
                                }}
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {assetLookup && selectedStats && (() => {
                  const a = assetLookup.getAsset(selectedStats.name);
                  if (!a) return null;

                  const videoSrc = (a.sourceType === 'video' ? (a.video ?? a.source) : undefined) ?? undefined;
                  const imgSrc = a.sourceType === 'video' ? a.thumbnail : (a.thumbnail || a.source);

                  if (videoSrc) {
                    return (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-none">
                        <video
                          key={videoSrc}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          poster={a.thumbnail}
                          src={videoSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    );
                  }

                  return imgSrc ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-none">
                      <img src={imgSrc} alt={selectedStats.name} width={80} height={80} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  ) : null;
                })()}
              </div>

              {/* 2. Key Metrics Grid (Bottom Half - Fills Remaining Height) */}
              <div className="hidden" />

              <div className="flex items-baseline gap-3">
                <h2 
                  className="text-xl sm:text-3xl text-white tracking-tight drop-shadow-lg"
                  style={FANCY_FONT}
                >
                  {selectedStats.name}
                </h2>
              </div>

              {!isSelectedEligible ? (
                <div
                  className="rounded-lg p-3 border border-slate-700/50 relative overflow-hidden"
                  style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.85)' }}
                >
                  <div className="absolute inset-0 bg-slate-700/10 pointer-events-none" />
                  <div className="relative z-10">
                    <h4 className="text-sm sm:text-base text-slate-300 mb-1" style={FANCY_FONT}>
                      Inactive
                    </h4>
                    <p className="text-slate-300 text-xs sm:text-sm leading-tight">
                      {inactiveReason?.parts?.length
                        ? inactiveReason.parts.join(' · ')
                        : 'This exercise is inactive because it has not been trained recently or there is not enough data to generate meaningful insights.'}
                    </p>
                  </div>
                  <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 bg-slate-600" />
                </div>
              ) : (
                <div
                  className={`rounded-lg p-2.5 sm:p-3 border ${currentStatus.borderColor} relative overflow-hidden transition-all duration-500`}
                  style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.85)' }}
                >
                  <div className={`absolute inset-0 ${currentStatus.bgColor} pointer-events-none`} />
                  <div className="relative z-10 flex items-start gap-2.5">
                    <div className={`p-2 rounded-lg bg-black/40 ${currentStatus.color} flex-shrink-0`}>
                      <currentStatus.icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm sm:text-base ${currentStatus.color} leading-tight`}
                          style={FANCY_FONT}
                        >
                          {currentStatus.title}
                        </h4>

                        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                          <ConfidenceBadge confidence={currentStatus.confidence} />
                          {currentCore?.prematurePr ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold whitespace-nowrap bg-orange-500/10 text-orange-400 border-orange-500/20"
                              title="This looks like a PR spike that may not be sustainable yet. Keep building consistency at this level."
                              aria-label="Premature PR"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              Premature PR
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-0.5 text-slate-300 text-xs sm:text-sm leading-snug">
                        {currentStatus.description}
                      </p>

                      {currentStatus.evidence && currentStatus.evidence.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {currentStatus.evidence.slice(0, 2).map((t, i) => {
                            const isStrengthLike = /^(Strength|Reps):\s/.test(t);
                            return (
                              <span
                                key={i}
                                className={`inline-flex items-center px-2 py-0.5 rounded-md border max-w-full ${currentStatus.bgColor} ${currentStatus.borderColor} ${isStrengthLike ? currentStatus.color : 'text-slate-300'} ${isStrengthLike ? 'font-bold' : 'font-mono'} text-[10px] whitespace-normal break-words`}
                              >
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {currentStatus.subtext && (
                        <div className="mt-2">
                          <div className={`relative inline-flex flex-col w-fit max-w-full rounded-md border px-2 py-1.5 ${currentStatus.borderColor} overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/30" />
                            <div className={`absolute inset-0 ${currentStatus.bgColor}`} />
                            <div className="relative z-10">
                              <div className={`text-[10px] uppercase tracking-wider font-bold ${currentStatus.color}`}>Next</div>
                              <div className="mt-0.5 text-[11px] sm:text-xs font-mono text-slate-200 leading-snug whitespace-normal">
                                {currentStatus.subtext}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 border border-dashed border-slate-800 rounded-xl bg-black/40">
              <div className="p-4 bg-black/70 rounded-full">
                <Activity className="w-10 h-10 opacity-50" />
              </div>
              <p className="font-medium text-sm text-center px-4">Select an exercise</p>
            </div>
          )}
        </div>
      </div>

      {/* 
          BOTTOM SECTION: CHART 
          Full width, sits below the grid.
      */}
      {selectedStats && (
        <div className="w-full bg-black/70 border border-slate-700/50 rounded-2xl p-4 sm:p-6 relative flex flex-col h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 sm:mb-6 gap-2 shrink-0">
             <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">{isBodyweightLike ? 'Reps Progression' : 'Strength Progression'}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">{isBodyweightLike ? 'Top reps vs sets' : 'Estimated 1RM vs Actual Lift Weight'}</p>
             </div>
             <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 min-h-8 bg-black/70 border border-slate-700/50 rounded-lg">
                    <Activity className="w-3 h-3 text-slate-400" />
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-white font-bold">{sessionsCount}</span>
                      <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">Sessions</span>
                    </div>
                  </div>
                </div>
                {isBodyweightLike ? (
                  <>
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500"></span> Top reps
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-500"></span> Sets
                    </div>
                  </>
                ) : showUnilateral && hasUnilateralChartData ? (
                  <>
                    <div className="flex items-center gap-2 text-cyan-400">
                      <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-500"></span> Left
                    </div>
                    <div className="flex items-center gap-2 text-violet-400">
                      <span className="w-2.5 h-2.5 rounded bg-violet-500/20 border border-violet-500"></span> Right
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500"></span> Est. 1RM
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-500"></span> Lift Weight
                    </div>
                  </>
                )}
                
                {/* Unilateral toggle - only show if exercise has L/R data */}
                {hasUnilateralChartData && !isBodyweightLike && (
                  <button
                    onClick={() => setShowUnilateral(!showUnilateral)}
                    title={showUnilateral ? 'Hide L/R split' : 'Show L/R split'}
                    aria-label={showUnilateral ? 'Hide L/R split' : 'Show L/R split'}
                    className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 ${
                      showUnilateral
                        ? 'bg-blue-600 text-white border-transparent'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-black/60 border border-slate-700/50'
                    }`}
                  >
                    L / R
                  </button>
                )}

                <div className="bg-black/70 p-1 rounded-lg flex gap-1 border border-slate-700/50">
                  <button
                    onClick={() => setViewMode('all')}
                    title="All"
                    aria-label="All"
                    className={`px-2 py-1 rounded text-[10px] font-bold ${viewMode==='all'?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                  >
                    <Infinity className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    title="Last Week"
                    aria-label="Last Week"
                    className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap ${viewMode==='weekly'?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                  >
                    lst wk
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    title="Last Month"
                    aria-label="Last Month"
                    className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap ${viewMode==='monthly'?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                  >
                    lst mo
                  </button>
                  <button
                    onClick={() => setViewMode('yearly')}
                    title="Last Year"
                    aria-label="Last Year"
                    className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap ${viewMode==='yearly'?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                  >
                    lst yr
                  </button>
                </div>
             </div>
          </div>

          <div className="w-full flex-1 min-h-0">
            {chartData.length === 0 ? (
              <div className="w-full h-full min-h-[260px] flex items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg px-4 sm:px-0 text-center">
                Building baseline — log a few more sessions to see Strength Progression.
              </div>
            ) : (
            <LazyRender className="w-full h-full" placeholder={<ChartSkeleton className="h-full min-h-[260px]" />}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  key={`${selectedStats.name}:${viewMode}:${allAggregationMode}:${weightUnit}:${showUnilateral}`}
                  data={chartDataWithEma}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLeftRM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRightRM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-rgb) / 0.35)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    animationDuration={1000}
                    padding={RECHARTS_XAXIS_PADDING as any}
                    interval={0}
                    ticks={xTicks as any}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      isBodyweightLike
                        ? `${formatNumber(Number(val), { maxDecimals: 0 })}`
                        : `${formatNumber(Number(val), { maxDecimals: 1 })}${weightUnit}`
                    }
                  />
                  <Tooltip
                    content={<CustomTooltip weightUnit={weightUnit} hasUnilateralData={hasUnilateralChartData} showUnilateral={showUnilateral} />}
                    cursor={{ stroke: 'rgb(var(--border-rgb) / 0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  {/* Show either Combined chart OR L/R charts based on toggle */}
                  {(!showUnilateral || !hasUnilateralChartData) ? (
                    <>
                      {/* Combined/Normal chart */}
                      <Area
                        type="monotone"
                        dataKey={isBodyweightLike ? 'reps' : 'oneRepMax'}
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#color1RM)"
                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        isAnimationActive={true}
                        animationDuration={1000}
                      />
                      <Line
                        type="monotone"
                        dataKey={isBodyweightLike ? 'reps' : 'weight'}
                        stroke="transparent"
                        strokeWidth={0}
                        dot={<StrengthProgressionValueDot 
                          valueKey={isBodyweightLike ? 'reps' : 'weight'} 
                          unit={isBodyweightLike ? undefined : weightUnit} 
                          data={chartDataWithEma}
                          color="var(--text-muted)"
                          showAtIndexMap={tickIndexMap}
                          showDotWhenHidden={false}
                          isBodyweightLike={isBodyweightLike}
                          selectedSessions={selectedSessions}
                          selectedStats={selectedStats}
                          weightUnit={weightUnit}
                        />}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        isAnimationActive={true}
                        animationDuration={1000}
                      />
                    </>
                  ) : (
                    <>
                      {/* Left side - cyan with visible dots */}
                      <Area
                        type="monotone"
                        dataKey={isBodyweightLike ? 'leftReps' : 'leftOneRepMax'}
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill="url(#colorLeftRM)"
                        dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#06b6d4' }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        name="Left"
                        connectNulls
                      />
                      {/* Right side - purple with visible dots */}
                      <Area
                        type="monotone"
                        dataKey={isBodyweightLike ? 'rightReps' : 'rightOneRepMax'}
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#colorRightRM)"
                        dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        name="Right"
                        connectNulls
                      />
                    </>
                  )}

                  <Line
                    type="stepAfter" 
                    dataKey={isBodyweightLike ? 'sets' : 'weight'}
                    stroke="var(--text-muted)" 
                    strokeWidth={1}
                    strokeDasharray="4 4" 
                    dot={false}
                    activeDot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </LazyRender>
            )}
          </div>
        </div>
      )}
    </div>
  );
};