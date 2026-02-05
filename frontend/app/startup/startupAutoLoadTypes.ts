import type { Dispatch, SetStateAction } from 'react';
import type { WorkoutSet } from '../../types';
import type { DataSourceChoice } from '../../utils/storage/dataSourceStorage';
import type { OnboardingFlow } from './onboarding/types';

export interface StartupAutoLoadParams {
  setOnboarding: Dispatch<SetStateAction<OnboardingFlow | null>>;
  setDataSource: Dispatch<SetStateAction<DataSourceChoice | null>>;
  setParsedData: Dispatch<SetStateAction<WorkoutSet[]>>;
  setHevyLoginError: Dispatch<SetStateAction<string | null>>;
  setLyfatLoginError: Dispatch<SetStateAction<string | null>>;
  setCsvImportError: Dispatch<SetStateAction<string | null>>;
  setIsAnalyzing: Dispatch<SetStateAction<boolean>>;
  setLoadingStep: Dispatch<SetStateAction<number>>;
  setLoadingKind: Dispatch<SetStateAction<'hevy' | 'lyfta' | 'csv' | null>>;
  startProgress: () => number;
  finishProgress: (startedAt: number) => void;
}
