import { WorkoutSet, ExerciseStats, DailySummary } from '../../types';
import { format, differenceInDays, differenceInCalendarWeeks, startOfDay, endOfDay, startOfWeek, subDays, subWeeks, isWithinInterval, isSameDay } from 'date-fns';
import { analyzeExerciseTrendCore, summarizeExerciseHistory, WEIGHT_STATIC_EPSILON_KG } from './exerciseTrend';
import { formatDayContraction, formatWeekContraction, getSessionKey } from '../date/dateUtils';
import { isWarmupSet } from './setClassification';
import { ExerciseTrendMode, WeightUnit } from '../storage/localStorage';
import { convertWeight, getStandardWeightIncrementKg } from '../format/units';
import { formatDeltaPercentage, getDeltaFormatPreset } from '../format/deltaFormat';
import { getPlateauAdvice } from '../../components/exerciseView/exerciseTrendUi';

// ============================================================================
// DELTA CALCULATIONS - Show movement vs previous periods
// ============================================================================

export interface PeriodStats {
  totalVolume: number;
  totalSets: number;
  totalWorkouts: number;
  totalPRs: number;
  avgSetsPerWorkout: number;
  avgVolumePerWorkout: number;
}

export interface DeltaResult {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  formattedPercent: string;
  direction: 'up' | 'down' | 'same';
}

export const calculatePeriodStats = (data: WorkoutSet[], startDate: Date, endDate: Date): PeriodStats => {
  const filtered = data.filter(s => {
    if (!s.parsedDate) return false;
    return isWithinInterval(s.parsedDate, { start: startDate, end: endDate });
  });

  const sessions = new Set<string>();
  let totalVolume = 0;
  let totalPRs = 0;
  let totalSets = 0;

  for (const set of filtered) {
    if (isWarmupSet(set)) continue;

    const sessionKey = getSessionKey(set);
    if (sessionKey) sessions.add(sessionKey);
    totalSets += 1;
    totalVolume += (set.weight_kg || 0) * (set.reps || 0);
    if (set.isPr) totalPRs++;
  }

  const totalWorkouts = sessions.size;

  return {
    totalVolume,
    totalSets,
    totalWorkouts,
    totalPRs,
    avgSetsPerWorkout: totalWorkouts > 0 ? Math.round(totalSets / totalWorkouts) : 0,
    avgVolumePerWorkout: totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0,
  };
};

export const calculateDelta = (current: number, previous: number): DeltaResult => {
  const delta = Number((current - previous).toFixed(2));
  const deltaPercent = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0);
  const direction: 'up' | 'down' | 'same' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
  
  // Use centralized formatting for better UX with large percentages
  const formattedPercent = formatDeltaPercentage(deltaPercent, getDeltaFormatPreset('badge'));
  
  return { 
    current: Number(current.toFixed(2)), 
    previous: Number(previous.toFixed(2)), 
    delta, 
    deltaPercent, 
    formattedPercent,
    direction 
  };
};

export interface WeeklyComparison {
  volume: DeltaResult;
  sets: DeltaResult;
  workouts: DeltaResult;
  prs: DeltaResult;
}

export interface RollingWindowComparison {
  windowDays: 7 | 30 | 365;
  eligible: boolean;
  minWorkoutsRequired: number;
  current: PeriodStats;
  previous: PeriodStats;
  volume: DeltaResult | null;
  sets: DeltaResult | null;
  workouts: DeltaResult | null;
  prs: DeltaResult | null;
}

const getRollingWindowRange = (now: Date, windowDays: 7 | 30 | 365) => {
  const currentStart = startOfDay(subDays(now, windowDays - 1));
  const currentEnd = now;

  const previousStart = startOfDay(subDays(currentStart, windowDays));
  const previousEnd = endOfDay(subDays(currentStart, 1));

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
  };
};

export const getRollingWindowComparison = (
  data: WorkoutSet[],
  windowDays: 7 | 30 | 365,
  now: Date = new Date(0),
  minWorkoutsRequired: number = 2
): RollingWindowComparison => {
  const range = getRollingWindowRange(now, windowDays);
  const current = calculatePeriodStats(data, range.current.start, range.current.end);
  const previous = calculatePeriodStats(data, range.previous.start, range.previous.end);

  const eligible = current.totalWorkouts >= minWorkoutsRequired && previous.totalWorkouts >= minWorkoutsRequired;

  return {
    windowDays,
    eligible,
    minWorkoutsRequired,
    current,
    previous,
    volume: eligible ? calculateDelta(current.totalVolume, previous.totalVolume) : null,
    sets: eligible ? calculateDelta(current.totalSets, previous.totalSets) : null,
    workouts: eligible ? calculateDelta(current.totalWorkouts, previous.totalWorkouts) : null,
    prs: eligible ? calculateDelta(current.totalPRs, previous.totalPRs) : null,
  };
};

// ============================================================================
// STREAK TRACKING - Consistency markers
// ============================================================================

export interface StreakInfo {
  currentStreak: number;      // Current consecutive weeks with workouts
  longestStreak: number;      // All-time longest streak
  isOnStreak: boolean;        // Did they work out this week?
  streakType: 'hot' | 'warm' | 'cold'; // Visual indicator
  workoutsThisWeek: number;   // Unique sessions this week
  avgWorkoutsPerWeek: number; // Avg unique sessions per week
  totalWeeksTracked: number;
  weeksWithWorkouts: number;
  consistencyScore: number;   // 0-100 score
}

export const calculateStreakInfo = (data: WorkoutSet[], now: Date = new Date(0)): StreakInfo => {
  if (data.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isOnStreak: false,
      streakType: 'cold',
      workoutsThisWeek: 0,
      avgWorkoutsPerWeek: 0,
      totalWeeksTracked: 0,
      weeksWithWorkouts: 0,
      consistencyScore: 0,
    };
  }

  // Get unique session and date markers (session = unique workout instance)
  const workoutDates = new Set<string>();
  const workoutWeeks = new Set<string>();
  const workoutSessions = new Set<string>();
  const sessionsThisWeek = new Set<string>();
  
  for (const set of data) {
    if (set.parsedDate && !isWarmupSet(set)) {
      workoutDates.add(format(set.parsedDate, 'yyyy-MM-dd'));
      workoutWeeks.add(format(startOfWeek(set.parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));

      const sessionKey = getSessionKey(set);
      if (sessionKey) {
        workoutSessions.add(sessionKey);
      }
    }
  }

  // Sort dates to find streaks
  const sortedDates = Array.from(workoutDates).sort();
  if (sortedDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isOnStreak: false,
      streakType: 'cold',
      workoutsThisWeek: 0,
      avgWorkoutsPerWeek: 0,
      totalWeeksTracked: 0,
      weeksWithWorkouts: 0,
      consistencyScore: 0,
    };
  }

  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  for (const set of data) {
    if (!set.parsedDate) continue;
    if (isWarmupSet(set)) continue;
    if (set.parsedDate < thisWeekStart || set.parsedDate > now) continue;
    const sessionKey = getSessionKey(set);
    if (sessionKey) sessionsThisWeek.add(sessionKey);
  }

  // Count workouts this week
  const workoutsThisWeek = sessionsThisWeek.size;

  // Calculate week-based streaks
  const sortedWeeks = Array.from(workoutWeeks).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Check consecutive weeks from most recent
  const thisWeekKey = format(thisWeekStart, 'yyyy-MM-dd');
  const lastWeekKey = format(subWeeks(thisWeekStart, 1), 'yyyy-MM-dd');
  
  // Determine if current/last week has workouts
  const hasThisWeek = workoutWeeks.has(thisWeekKey);
  const hasLastWeek = workoutWeeks.has(lastWeekKey);
  
  // Calculate streaks by iterating through weeks
  for (let i = sortedWeeks.length - 1; i >= 0; i--) {
    const weekDate = new Date(sortedWeeks[i]);
    const expectedPrevWeek = i > 0 ? new Date(sortedWeeks[i - 1]) : null;
    
    tempStreak++;
    
    if (expectedPrevWeek) {
      const weekDiff = differenceInCalendarWeeks(weekDate, expectedPrevWeek, { weekStartsOn: 1 });
      if (weekDiff > 1) {
        // Gap in weeks, streak broken
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  // Current streak: count back from this/last week
  if (hasThisWeek || hasLastWeek) {
    let checkWeek = hasThisWeek ? thisWeekStart : subWeeks(thisWeekStart, 1);
    currentStreak = 0;
    while (workoutWeeks.has(format(checkWeek, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkWeek = subWeeks(checkWeek, 1);
    }
  }

  // Calculate total weeks tracked and consistency
  const totalWeeksTracked = Math.max(1, differenceInCalendarWeeks(now, firstDate, { weekStartsOn: 1 }) + 1);
  const weeksWithWorkouts = workoutWeeks.size;
  const consistencyScore = Math.round((weeksWithWorkouts / totalWeeksTracked) * 100);

  // Average workouts per week
  const avgWorkoutsPerWeek = totalWeeksTracked > 0 
    ? Math.round((workoutSessions.size / totalWeeksTracked) * 10) / 10 
    : 0;

  // Determine streak type
  let streakType: 'hot' | 'warm' | 'cold' = 'cold';
  if (currentStreak >= 4) streakType = 'hot';
  else if (currentStreak >= 2) streakType = 'warm';

  return {
    currentStreak,
    longestStreak,
    isOnStreak: hasThisWeek || hasLastWeek,
    streakType,
    workoutsThisWeek,
    avgWorkoutsPerWeek,
    totalWeeksTracked,
    weeksWithWorkouts,
    consistencyScore,
  };
};

// ============================================================================
// PR INSIGHTS - Timeline and drought detection
// ============================================================================

export interface RecentPR {
  date: Date;
  exercise: string;
  weight: number;
  reps: number;
  previousBest: number;      // Previous best weight for this exercise
  improvement: number;       // Weight improvement (current - previous)
}

export interface PRInsights {
  daysSinceLastPR: number;
  lastPRDate: Date | null;
  lastPRExercise: string | null;
  prDrought: boolean;        // More than 14 days without PR
  recentPRs: RecentPR[];
  prFrequency: number;       // PRs per week average
  totalPRs: number;
}

export const calculatePRInsights = (data: WorkoutSet[], now: Date = new Date(0)): PRInsights => {
  const sorted = [...data]
    .filter((s) => s.parsedDate && !isWarmupSet(s) && (s.weight_kg || 0) > 0)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const dt = (a.s.parsedDate!.getTime() || 0) - (b.s.parsedDate!.getTime() || 0);
      if (dt !== 0) return dt;
      const dsi = (a.s.set_index || 0) - (b.s.set_index || 0);
      if (dsi !== 0) return dsi;
      return a.i - b.i;
    })
    .map((x) => x.s);

  // Scan in chronological order and record PR events with their true previous best.
  const runningBest = new Map<string, number>();
  const prEvents: RecentPR[] = [];

  for (const set of sorted) {
    const exercise = set.exercise_title;
    const currentWeight = set.weight_kg || 0;
    const previousBest = runningBest.get(exercise) ?? 0;
    if (currentWeight <= previousBest) continue;

    prEvents.push({
      date: set.parsedDate!,
      exercise,
      weight: Number(currentWeight.toFixed(2)),
      reps: set.reps,
      previousBest: Number(previousBest.toFixed(2)),
      improvement: Number((currentWeight - previousBest).toFixed(2)),
    });

    runningBest.set(exercise, currentWeight);
  }

  if (prEvents.length === 0) {
    return {
      daysSinceLastPR: -1,
      lastPRDate: null,
      lastPRExercise: null,
      prDrought: true,
      recentPRs: [],
      prFrequency: 0,
      totalPRs: 0,
    };
  }

  const lastPR = prEvents[prEvents.length - 1];
  const daysSinceLastPR = differenceInDays(now, lastPR.date);

  // Most recent first.
  const recentPRs: RecentPR[] = prEvents.slice(-5).reverse();

  // Calculate PR frequency (last 30 days)
  const thirtyDaysAgo = subDays(now, 30);
  const recentPRCount = prEvents.filter((pr) => pr.date >= thirtyDaysAgo).length;
  const prFrequency = Math.round((recentPRCount / 4) * 10) / 10; // Per week

  return {
    daysSinceLastPR,
    lastPRDate: lastPR.date,
    lastPRExercise: lastPR.exercise,
    prDrought: daysSinceLastPR > 14,
    recentPRs,
    prFrequency,
    totalPRs: prEvents.length,
  };
};

// ============================================================================
// PLATEAU DETECTION - Identify stagnation
// ============================================================================

export interface ExercisePlateauInfo {
  exerciseName: string;
  sessionsSinceProgress: number;
  isPlateaued: boolean;
  suggestion: string;
  lastWeight: number;
  lastReps: number;
  isBodyweightLike: boolean;
}

export interface PlateauAnalysis {
  plateauedExercises: ExercisePlateauInfo[];
  improvingExercises: string[];
  overallTrend: 'improving' | 'maintaining' | 'declining';
}

export const detectPlateaus = (
  data: WorkoutSet[],
  exerciseStats: ExerciseStats[],
  weightUnit: WeightUnit = 'kg',
  trendMode: ExerciseTrendMode = 'reactive'
): PlateauAnalysis => {
  const plateauedExercises: ExercisePlateauInfo[] = [];
  const improvingExercises: string[] = [];

  for (const stat of exerciseStats) {
    const core = analyzeExerciseTrendCore(stat, { trendMode });

    if (core.status === 'overload') {
      improvingExercises.push(stat.name);
      continue;
    }

    if (core.status !== 'stagnant') continue;

    const sessions = summarizeExerciseHistory(stat.history);
    const plateauWeight = core.plateau?.weight ?? 0;
    const currentBestMetric = core.isBodyweightLike ? sessions[0]?.maxReps ?? 0 : sessions[0]?.oneRepMax ?? 0;

    let sessionsSinceProgress = 1;
    const GAINING_PCT_THRESHOLD = 2.0;

    for (let i = 1; i < sessions.length; i++) {
      const sessionBest = core.isBodyweightLike ? sessions[i].maxReps : sessions[i].oneRepMax;
      const diffPct = currentBestMetric > 0 ? ((currentBestMetric - sessionBest) / sessionBest) * 100 : 0;

      if (diffPct > GAINING_PCT_THRESHOLD) {
        break;
      }
      sessionsSinceProgress++;
    }

    const lastHistoryEntry = stat.history[0];
    const lastWeight = lastHistoryEntry?.weight ?? 0;
    const lastReps = lastHistoryEntry?.reps ?? 0;
    const advice = getPlateauAdvice(stat.name, core, stat, weightUnit);
    plateauedExercises.push({
      exerciseName: stat.name,
      sessionsSinceProgress,
      isPlateaued: true,
      suggestion: advice.subtext,
      lastWeight,
      lastReps,
      isBodyweightLike: core.isBodyweightLike,
    });
  }

  // Determine overall trend
  let overallTrend: 'improving' | 'maintaining' | 'declining' = 'maintaining';
  if (improvingExercises.length > plateauedExercises.length) {
    overallTrend = 'improving';
  } else if (plateauedExercises.length > improvingExercises.length + 2) {
    overallTrend = 'declining';
  }

  return {
    plateauedExercises: plateauedExercises.sort((a, b) => b.sessionsSinceProgress - a.sessionsSinceProgress),
    improvingExercises,
    overallTrend,
  };
  };
 
// ============================================================================
// SPARKLINE DATA - Mini trends for KPIs
// ============================================================================

export interface SparklinePoint {
  value: number;
  label: string;
}

export const getVolumeSparkline = (dailyData: DailySummary[], points: number = 7): SparklinePoint[] => {
  const sorted = [...dailyData].sort((a, b) => b.timestamp - a.timestamp);
  const recent = sorted.slice(0, points).reverse();
  
  return recent.map(d => ({
    value: d.totalVolume,
    label: formatDayContraction(new Date(d.timestamp)),
  }));
};

export const getWorkoutSparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).workoutSparkline;
};

export const getPRSparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).prSparkline;
};

export const getSetsSparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).setsSparkline;
};

export const getConsistencySparkline = (data: WorkoutSet[], weeks: number = 8, now: Date = new Date(0)): SparklinePoint[] => {
  return buildWeeklySparklineBundle(data, weeks, now).consistencySparkline;
};

const buildWeeklySparklineBundle = (
  data: WorkoutSet[],
  weeks: number = 8,
  now: Date = new Date(0)
): {
  workoutSparkline: SparklinePoint[];
  prSparkline: SparklinePoint[];
  setsSparkline: SparklinePoint[];
  consistencySparkline: SparklinePoint[];
} => {
  const baseWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekStarts: Date[] = [];
  const weekKeyToIndex = new Map<string, number>();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(baseWeekStart, i);
    const key = format(weekStart, 'yyyy-MM-dd');
    weekKeyToIndex.set(key, weekStarts.length);
    weekStarts.push(weekStart);
  }

  const sessionBuckets: Array<Set<string>> = weekStarts.map(() => new Set());
  const setCounts = new Array<number>(weekStarts.length).fill(0);
  const prCounts = new Array<number>(weekStarts.length).fill(0);

  for (const s of data) {
    const d = s.parsedDate;
    if (!d) continue;

    const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const idx = weekKeyToIndex.get(weekKey);
    if (idx == null) continue;

    if (isWarmupSet(s)) continue;

    setCounts[idx] += 1;
    if (s.isPr) prCounts[idx] += 1;

    const sessionKey = getSessionKey(s);
    if (sessionKey) sessionBuckets[idx].add(sessionKey);
  }

  const workoutSparkline = weekStarts.map((weekStart, idx) => ({
    value: sessionBuckets[idx].size,
    label: formatWeekContraction(weekStart),
  }));

  const prSparkline = weekStarts.map((weekStart, idx) => ({
    value: prCounts[idx],
    label: formatWeekContraction(weekStart),
  }));

  const setsSparkline = weekStarts.map((weekStart, idx) => ({
    value: setCounts[idx],
    label: formatWeekContraction(weekStart),
  }));

  return {
    workoutSparkline,
    prSparkline,
    setsSparkline,
    consistencySparkline: workoutSparkline,
  };
};

// ============================================================================
// SUMMARY INSIGHTS - High-level actionable info
// ============================================================================

export interface DashboardInsights {
  rolling7d: RollingWindowComparison;
  rolling30d: RollingWindowComparison;
  rolling365d: RollingWindowComparison;
  streakInfo: StreakInfo;
  prInsights: PRInsights;
  volumeSparkline: SparklinePoint[];
  workoutSparkline: SparklinePoint[];
  prSparkline: SparklinePoint[];
  setsSparkline: SparklinePoint[];
  consistencySparkline: SparklinePoint[];
}

export const calculateDashboardInsights = (
  data: WorkoutSet[], 
  dailyData: DailySummary[],
  now: Date = new Date(0)
): DashboardInsights => {
  const { workoutSparkline, prSparkline, setsSparkline, consistencySparkline } = buildWeeklySparklineBundle(data, 8, now);
  return {
    rolling7d: getRollingWindowComparison(data, 7, now, 2),
    rolling30d: getRollingWindowComparison(data, 30, now, 2),
    rolling365d: getRollingWindowComparison(data, 365, now, 2),
    streakInfo: calculateStreakInfo(data, now),
    prInsights: calculatePRInsights(data, now),
    volumeSparkline: getVolumeSparkline(dailyData),
    workoutSparkline,
    prSparkline,
    setsSparkline,
    consistencySparkline,
  };
};
