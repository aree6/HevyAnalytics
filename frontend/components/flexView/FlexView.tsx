import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DailySummary, ExerciseStats, WorkoutSet } from '../../types';
import { ChevronLeft, ChevronRight, Dumbbell, Weight } from 'lucide-react';
import { ViewHeader } from '../layout/ViewHeader';
import { useTheme } from '../theme/ThemeProvider';
import { formatLargeNumber } from '../../utils/data/comparisonData';
import { WeightUnit } from '../../utils/storage/localStorage';
import { convertWeight } from '../../utils/format/units';
import { getDisplayVolume } from '../../utils/format/volumeDisplay';
import { calculateStreakInfo, calculatePRInsights } from '../../utils/analysis/insights';
import { getDailySummaries, getExerciseStats } from '../../utils/analysis/analytics';
import { getExerciseAssets, ExerciseAsset } from '../../utils/data/exerciseAssets';
import { isWarmupSet } from '../../utils/analysis/setClassification';
import { normalizeMuscleGroup, type NormalizedMuscleGroup } from '../../utils/muscle/muscleNormalization';
import { type BodyMapGender } from '../bodyMap/BodyMap';
import { getMonth } from 'date-fns';
import { getEffectiveNowFromWorkoutData, getSessionKey } from '../../utils/date/dateUtils';
import { type CardTheme } from './FlexCard';
import { LazyRender } from '../ui/LazyRender';
import { BestMonthCard } from './BestMonthCard';
import { MuscleFocusCard } from './MuscleFocusCard';
import { PersonalRecordsCard } from './PersonalRecordsCard';
import { StreakCard } from './StreakCard';
import { SummaryCard } from './SummaryCard';
import { TopExercisesCard } from './TopExercisesCard';
import { VolumeComparisonCard } from './VolumeComparisonCard';
import { YearlyHeatmapCard } from './YearlyHeatmapCard';

interface FlexViewProps {
  data: WorkoutSet[];
  filtersSlot?: React.ReactNode;
  weightUnit?: WeightUnit;
  dailySummaries?: DailySummary[];
  exerciseStats?: ExerciseStats[];
  stickyHeader?: boolean;
  bodyMapGender?: BodyMapGender;
}

export const FlexView: React.FC<FlexViewProps> = ({
  data,
  filtersSlot,
  weightUnit = 'kg' as WeightUnit,
  dailySummaries: dailySummariesProp,
  exerciseStats: exerciseStatsProp,
  stickyHeader = false,
  bodyMapGender = 'male',
}) => {
  const { mode } = useTheme();
  const cardTheme: CardTheme = mode === 'light' ? 'light' : 'dark';

  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [showFocusedNav, setShowFocusedNav] = useState(false);
  const [volumeCardTheme, setVolumeCardTheme] = useState<CardTheme>(cardTheme);
  const hideNavTimeoutRef = useRef<number | null>(null);
  const canHover = useMemo(
    () => (typeof window !== 'undefined' ? window.matchMedia?.('(hover: hover)')?.matches : true),
    []
  );

  useEffect(() => {
    if (!focusedCardId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedCardId(null);
    };

    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [focusedCardId]);

  useEffect(() => {
    if (!focusedCardId) {
      setShowFocusedNav(false);
      if (hideNavTimeoutRef.current) {
        window.clearTimeout(hideNavTimeoutRef.current);
        hideNavTimeoutRef.current = null;
      }
      return;
    }
    if (!canHover) {
      setShowFocusedNav(true);
    }
    return () => {
      if (hideNavTimeoutRef.current) {
        window.clearTimeout(hideNavTimeoutRef.current);
        hideNavTimeoutRef.current = null;
      }
    };
  }, [focusedCardId, canHover]);

  const toggleFocusedNavTouch = () => {
    if (canHover) return;
    setShowFocusedNav((v) => !v);
    if (hideNavTimeoutRef.current) {
      window.clearTimeout(hideNavTimeoutRef.current);
      hideNavTimeoutRef.current = null;
    }
  };

  // Get exercise assets for thumbnails
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    getExerciseAssets()
      .then((m) => {
        if (!cancelled) setAssetsMap(m);
      })
      .catch(() => {
        if (!cancelled) setAssetsMap(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveNow = useMemo(() => getEffectiveNowFromWorkoutData(data), [data]);

  // Calculate all stats from data
  const stats = useMemo(() => {
    let totalVolumeKg = 0;
    let totalReps = 0;
    let totalDuration = 0;
    const sessions = new Set<string>();
    const exerciseCounts = new Map<string, number>();
    const muscleGroups = new Map<NormalizedMuscleGroup, number>();

    // Case-insensitive lookup cache for assets
    const lowerAssetsMap = new Map<string, ExerciseAsset>();
    assetsMap.forEach((v, k) => lowerAssetsMap.set(k.toLowerCase(), v));

    for (const set of data) {
      if (isWarmupSet(set)) continue;
      totalVolumeKg += (set.weight_kg || 0) * (set.reps || 0);
      totalReps += set.reps || 0;
      
      const sessionKey = getSessionKey(set);
      if (sessionKey) sessions.add(sessionKey);

      // Count exercises
      const exerciseName = set.exercise_title || '';
      if (exerciseName) {
        exerciseCounts.set(exerciseName, (exerciseCounts.get(exerciseName) || 0) + 1);
      }

      // Muscle groups
      if (set.parsedDate) {
        const asset = assetsMap.get(exerciseName) || lowerAssetsMap.get(exerciseName.toLowerCase());
        if (asset) {
          const primaryMuscle = normalizeMuscleGroup(asset.primary_muscle);
          if (primaryMuscle !== 'Cardio') {
            if (primaryMuscle === 'Full Body') {
              // Distribute to all groups
              const groups: NormalizedMuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
              for (const g of groups) {
                muscleGroups.set(g, (muscleGroups.get(g) || 0) + 1);
              }
            } else {
              muscleGroups.set(primaryMuscle, (muscleGroups.get(primaryMuscle) || 0) + 1);
            }
          }
          // Secondary muscles (0.5 contribution)
          const secondary = asset.secondary_muscle;
          if (secondary && secondary !== 'None') {
            for (const s of secondary.split(',')) {
              const secGroup = normalizeMuscleGroup(s.trim());
              if (secGroup !== 'Cardio' && secGroup !== 'Other' && secGroup !== 'Full Body') {
                muscleGroups.set(secGroup, (muscleGroups.get(secGroup) || 0) + 0.5);
              }
            }
          }
        }
      }
    }

    // Calculate duration from daily summaries
    const dailySummaries = dailySummariesProp ?? getDailySummaries(data);
    totalDuration = dailySummaries.reduce((sum, d) => sum + d.durationMinutes, 0);

    // Top exercises with thumbnails
    const topExercises = Array.from(exerciseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => {
        const asset = assetsMap.get(name) || lowerAssetsMap.get(name.toLowerCase());
        return {
          name,
          count,
          thumbnail: asset?.thumbnail,
        };
      });

    // Monthly data - only for the selected year
    const selectedYear = effectiveNow.getFullYear();
    const monthlyWorkoutsByYear = new Map<number, Map<number, Set<string>>>();
    
    for (const set of data) {
      if (isWarmupSet(set)) continue;
      
      const sessionKey = getSessionKey(set);
      if (sessionKey && set.parsedDate) {
        const year = set.parsedDate.getFullYear();
        const month = getMonth(set.parsedDate);
        
        if (!monthlyWorkoutsByYear.has(year)) {
          monthlyWorkoutsByYear.set(year, new Map());
        }
        const yearMap = monthlyWorkoutsByYear.get(year)!;
        
        if (!yearMap.has(month)) {
          yearMap.set(month, new Set());
        }
        yearMap.get(month)!.add(sessionKey);
      }
    }
    
    // Get monthly data for the selected year
    const currentYearMonthlyWorkouts = monthlyWorkoutsByYear.get(selectedYear) || new Map();
    const monthlyData = Array.from({ length: 12 }, (_, idx) => ({
      month: idx,
      workouts: currentYearMonthlyWorkouts.get(idx)?.size || 0,
    }));

    // Muscle data
    const muscleData = Array.from(muscleGroups.entries()).map(([group, sets]) => ({
      group,
      sets: Math.round(sets),
    }));

    return {
      totalVolume: getDisplayVolume(totalVolumeKg, weightUnit, { round: 'int' }),
      totalVolumeKg,
      totalSets: data.reduce((acc, s) => acc + (isWarmupSet(s) ? 0 : 1), 0),
      totalReps,
      totalDuration,
      totalWorkouts: sessions.size,
      topExercises,
      monthlyData,
      muscleData,
    };
  }, [data, weightUnit, assetsMap, dailySummariesProp, effectiveNow]);

  // Streak info
  const streakInfo = useMemo(() => calculateStreakInfo(data, effectiveNow), [data, effectiveNow]);

  // PR insights
  const prInsights = useMemo(() => calculatePRInsights(data, effectiveNow), [data, effectiveNow]);

  // Top PR exercises
  const topPRExercises = useMemo(() => {
    const exerciseStats = exerciseStatsProp ?? getExerciseStats(data);
    const lowerAssetsMap = new Map<string, ExerciseAsset>();
    assetsMap.forEach((v, k) => lowerAssetsMap.set(k.toLowerCase(), v));
    return exerciseStats
      .filter(s => s.prCount > 0)
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 3)
      .map(s => {
        const asset = assetsMap.get(s.name) || lowerAssetsMap.get(s.name.toLowerCase());
        return {
          name: s.name,
          weight: convertWeight(s.maxWeight, weightUnit),
          thumbnail: asset?.thumbnail,
        };
      });
  }, [data, weightUnit, assetsMap, exerciseStatsProp]);

  // Cards configuration
  const CARDS = [
    { id: 'summary', label: 'Summary' },
    { id: 'volume', label: 'Volume Comparison' },
    { id: 'year-heatmap', label: 'Year Heatmap' },
    { id: 'muscle-focus', label: 'Muscle Focus' },
    { id: 'best-month', label: 'Best Month' },
    { id: 'top-exercises', label: 'Top Exercises' },
    { id: 'prs', label: 'Personal Records' },
    { id: 'streak', label: 'Streak' },
  ];

  const focusAdjacentCard = (direction: -1 | 1) => {
    setFocusedCardId((currentId) => {
      if (!currentId) return currentId;
      const idx = CARDS.findIndex((c) => c.id === currentId);
      if (idx < 0) return currentId;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= CARDS.length) return currentId;
      return CARDS[nextIdx].id;
    });
  };

  const renderCardById = (id: string) => {
    switch (id) {
      case 'summary':
        return (
          <SummaryCard
            totalWorkouts={stats.totalWorkouts}
            totalDuration={stats.totalDuration}
            totalVolume={stats.totalVolume}
            totalSets={stats.totalSets}
            totalReps={stats.totalReps}
            weightUnit={weightUnit}
            theme={cardTheme}
          />
        );
      case 'volume':
        return (
          <VolumeComparisonCard
            totalVolume={stats.totalVolume}
            totalVolumeKg={stats.totalVolumeKg}
            weightUnit={weightUnit}
            theme={volumeCardTheme}
            showThemeToggle={true}
            onThemeToggle={() => setVolumeCardTheme(volumeCardTheme === 'dark' ? 'light' : 'dark')}
          />
        );
      case 'year-heatmap':
        return <YearlyHeatmapCard data={data} theme={cardTheme} />;
      case 'streak':
        return <StreakCard streakInfo={streakInfo} theme={cardTheme} />;
      case 'prs':
        return (
          <PersonalRecordsCard
            prInsights={prInsights}
            topPRExercises={topPRExercises}
            weightUnit={weightUnit}
            theme={cardTheme}
          />
        );
      case 'best-month':
        return <BestMonthCard monthlyData={stats.monthlyData} theme={cardTheme} selectedYear={effectiveNow.getFullYear()} />;
      case 'top-exercises':
        return <TopExercisesCard exercises={stats.topExercises} theme={cardTheme} />;
      case 'muscle-focus':
        return <MuscleFocusCard muscleData={stats.muscleData} theme={cardTheme} gender={bodyMapGender} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full text-slate-200 pb-6">
      {/* Header */}
      <div className="hidden sm:contents">
        <ViewHeader
          leftStats={[{ icon: Dumbbell, value: stats.totalSets, label: 'Total Sets' }]}
          rightStats={[{ icon: Weight, value: `${formatLargeNumber(stats.totalVolume)} ${weightUnit}`, label: 'Volume' }]}
          filtersSlot={filtersSlot}
          sticky={stickyHeader}
        />
      </div>

      {/* Carousel container */}
      <div className="relative w-full overflow-hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 px-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CARDS.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0 w-[calc(100%-2rem)] max-w-md snap-center mx-auto cursor-pointer"
              onClick={() => setFocusedCardId(card.id)}
            >
              <LazyRender
                className="w-full"
                placeholder={
                  <div className="min-h-[500px] rounded-2xl border border-slate-700/50 bg-black/70 p-6">
                    <div className="animate-pulse">
                      <div className="h-6 w-1/2 rounded bg-slate-800/60" />
                      <div className="mt-4 h-24 rounded bg-slate-800/40" />
                      <div className="mt-3 h-24 rounded bg-slate-800/35" />
                      <div className="mt-3 h-24 rounded bg-slate-800/30" />
                    </div>
                  </div>
                }
                rootMargin="600px 0px"
              >
                {renderCardById(card.id)}
              </LazyRender>
            </div>
          ))}
        </div>
      </div>

      {/* Card navigation dots */}
      <div className="hidden" />

      {/* Card label */}
      <div className="hidden" />

      {/* Focus modal */}
      {focusedCardId && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={() => setFocusedCardId(null)}
        >
          <div
            className="relative w-full max-w-md"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleFocusedNavTouch();
            }}
            onMouseEnter={() => {
              setShowFocusedNav(true);
              if (hideNavTimeoutRef.current) {
                window.clearTimeout(hideNavTimeoutRef.current);
                hideNavTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              setShowFocusedNav(false);
              if (hideNavTimeoutRef.current) {
                window.clearTimeout(hideNavTimeoutRef.current);
                hideNavTimeoutRef.current = null;
              }
            }}
          >
            <div>
              {renderCardById(focusedCardId)}
            </div>

            {/* Tap-to-reveal navigation buttons (auto-hide) */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                focusAdjacentCard(-1);
                if (!canHover) setShowFocusedNav(true);
              }}
              className={`absolute left-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 w-12 h-12 flex items-center justify-center z-[1005] ${
                showFocusedNav ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${cardTheme === 'dark' ? 'text-white hover:text-white' : 'text-black hover:text-black'} drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]`}
              aria-label="Previous card"
              title="Previous"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="pointer-events-none w-10 h-10" strokeWidth={3} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                focusAdjacentCard(1);
                if (!canHover) setShowFocusedNav(true);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 w-12 h-12 flex items-center justify-center z-[1005] ${
                showFocusedNav ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${cardTheme === 'dark' ? 'text-white hover:text-white' : 'text-black hover:text-black'} drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]`}
              aria-label="Next card"
              title="Next"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="pointer-events-none w-10 h-10" strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlexView;
