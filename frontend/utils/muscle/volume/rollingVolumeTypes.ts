/** Days in a rolling week window */
export const ROLLING_WINDOW_DAYS = 7;

/** Consecutive days without workouts that constitutes a training break */
export const BREAK_THRESHOLD_DAYS = 7;

/** Represents daily muscle volume for a single workout day */
export interface DailyMuscleVolume {
  readonly date: Date;
  readonly dateKey: string;
  readonly muscles: ReadonlyMap<string, number>;
}

/** Rolling 7-day volume snapshot for a specific day */
export interface RollingWeeklyVolume {
  readonly date: Date;
  readonly dateKey: string;
  readonly muscles: ReadonlyMap<string, number>;
  readonly totalSets: number;
  readonly isInBreak: boolean;
}

/** Aggregated volume for a time period (month/year) */
export interface PeriodAverageVolume {
  readonly periodKey: string;
  readonly periodLabel: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly avgWeeklySets: ReadonlyMap<string, number>;
  readonly totalAvgSets: number;
  readonly trainingDaysCount: number;
  readonly weeksIncluded: number;
}

/** Time series entry for charting */
export interface VolumeTimeSeriesEntry {
  readonly timestamp: number;
  readonly dateFormatted: string;
  readonly [muscle: string]: number | string;
}

/** Result of time series computation */
export interface VolumeTimeSeriesResult {
  readonly data: VolumeTimeSeriesEntry[];
  readonly keys: string[];
}

export interface KeyedContribution {
  readonly key: string;
  readonly sets: number;
}

export type VolumePeriod = 'weekly' | 'monthly' | 'yearly';
