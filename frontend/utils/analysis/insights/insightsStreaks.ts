import { differenceInCalendarWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { WorkoutSet } from '../../../types';
import { getSessionKey } from '../../date/dateUtils';
import { isWarmupSet } from '../classification/setClassification';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isOnStreak: boolean;
  streakType: 'hot' | 'warm' | 'cold';
  workoutsThisWeek: number;
  avgWorkoutsPerWeek: number;
  totalWeeksTracked: number;
  weeksWithWorkouts: number;
  consistencyScore: number;
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
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  for (const set of data) {
    if (!set.parsedDate) continue;
    if (isWarmupSet(set)) continue;
    if (set.parsedDate < thisWeekStart || set.parsedDate > now) continue;
    const sessionKey = getSessionKey(set);
    if (sessionKey) sessionsThisWeek.add(sessionKey);
  }

  const workoutsThisWeek = sessionsThisWeek.size;

  const sortedWeeks = Array.from(workoutWeeks).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const thisWeekKey = format(thisWeekStart, 'yyyy-MM-dd');
  const lastWeekKey = format(subWeeks(thisWeekStart, 1), 'yyyy-MM-dd');

  const hasThisWeek = workoutWeeks.has(thisWeekKey);
  const hasLastWeek = workoutWeeks.has(lastWeekKey);

  for (let i = sortedWeeks.length - 1; i >= 0; i--) {
    const weekDate = new Date(sortedWeeks[i]);
    const expectedPrevWeek = i > 0 ? new Date(sortedWeeks[i - 1]) : null;

    tempStreak++;

    if (expectedPrevWeek) {
      const weekDiff = differenceInCalendarWeeks(weekDate, expectedPrevWeek, { weekStartsOn: 1 });
      if (weekDiff > 1) {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  if (hasThisWeek || hasLastWeek) {
    let checkWeek = hasThisWeek ? thisWeekStart : subWeeks(thisWeekStart, 1);
    currentStreak = 0;
    while (workoutWeeks.has(format(checkWeek, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkWeek = subWeeks(checkWeek, 1);
    }
  }

  const totalWeeksTracked = Math.max(1, differenceInCalendarWeeks(now, firstDate, { weekStartsOn: 1 }) + 1);
  const weeksWithWorkouts = workoutWeeks.size;
  const consistencyScore = Math.round((weeksWithWorkouts / totalWeeksTracked) * 100);

  const avgWorkoutsPerWeek = totalWeeksTracked > 0
    ? Math.round((workoutSessions.size / totalWeeksTracked) * 10) / 10
    : 0;

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
