import { DailySummary, WorkoutSet } from '../../../types';
import type { RollingWindowComparison } from './insightsDelta';
import type { StreakInfo } from './insightsStreaks';
import type { PRInsights } from './insightsPRs';
import type { SparklinePoint } from './insightsSparklines';
import { getRollingWindowComparison } from './insightsDelta';
import { calculateStreakInfo } from './insightsStreaks';
import { calculatePRInsights } from './insightsPRs';
import { buildWeeklySparklineBundle, getVolumeSparkline } from './insightsSparklines';

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
  const { workoutSparkline, prSparkline, setsSparkline, consistencySparkline } =
    buildWeeklySparklineBundle(data, 8, now);
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
