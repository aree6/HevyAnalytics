import type { ExerciseMuscleData } from '../../utils/muscle/mapping';

export interface ExerciseMuscleTargets {
  exData?: ExerciseMuscleData;
  volumes: Map<string, number>;
  maxVolume: number;
  primaryTargets: Array<{ label: string; sets: number }>;
  secondaryTargets: Array<{ label: string; sets: number }>;
}

export interface InactiveReason {
  parts: string[];
  tooOld: boolean;
  notEnoughData: boolean;
}
