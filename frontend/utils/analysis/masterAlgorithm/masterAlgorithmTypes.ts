export interface ExpectedRepsRange {
  min: number;
  max: number;
  center: number;
  label: string;
}

export interface SetMetrics {
  weight: number;
  reps: number;
  volume: number;
  oneRM: number;
  rpe: number | null;
}
