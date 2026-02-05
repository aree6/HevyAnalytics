import { WorkoutSet } from '../types';
import { WeightUnit } from '../../utils/storage/localStorage';
import type { DataSourceChoice } from '../../utils/storage/dataSourceStorage';
import type { OnboardingFlow } from '../../app/onboarding/types';

export interface AppAuthHandlersDeps {
  weightUnit: WeightUnit;
  setParsedData: (data: WorkoutSet[]) => void;
  setDataSource: (source: DataSourceChoice | null) => void;
  setOnboarding: (flow: OnboardingFlow | null) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedDay: (day: Date | null) => void;
  setHevyLoginError: (value: string | null) => void;
  setLyfatLoginError: (value: string | null) => void;
  setCsvImportError: (value: string | null) => void;
  setLoadingKind: (value: 'hevy' | 'lyfta' | 'csv' | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  setLoadingStep: (value: number) => void;
  startProgress: () => number;
  finishProgress: (startedAt: number) => void;
}
