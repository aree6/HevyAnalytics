import type { NormalizedMuscleGroup } from '../../../utils/muscle/analytics';

export interface FlexTopExercise {
  name: string;
  count: number;
  thumbnail?: string;
}

export interface FlexMonthlyData {
  month: number;
  workouts: number;
}

export interface FlexMuscleDatum {
  group: NormalizedMuscleGroup;
  sets: number;
}

export interface FlexStats {
  totalVolume: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  totalDuration: number;
  totalWorkouts: number;
  topExercises: FlexTopExercise[];
  monthlyData: FlexMonthlyData[];
  muscleData: FlexMuscleDatum[];
}

export interface FlexHeadlessHeatmap {
  volumes: Map<string, number>;
  maxVolume: number;
}

export interface FlexTopPRExercise {
  name: string;
  weight: number;
  thumbnail?: string;
}
