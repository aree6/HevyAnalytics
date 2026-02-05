export interface ExerciseBestEvent {
  date: Date;
  weight: number;
  sessionKey: string;
  previousBest: number;
}

export interface ExerciseVolumePrEvent {
  date: Date;
  volume: number;
  sessionKey: string;
  previousBest: number;
  weight: number;
  reps: number;
  setIndex: number;
}
