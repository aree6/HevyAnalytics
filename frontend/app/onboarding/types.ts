import type { DataSourceChoice } from '../../utils/dataSources/types';

export type OnboardingIntent = 'initial' | 'update';

export type OnboardingStep =
  | 'platform'
  | 'demo_prefs'
  | 'demo_csv'
  | 'strong_prefs'
  | 'strong_csv'
  | 'lyfta_prefs'
  | 'lyfta_csv'
  | 'other_prefs'
  | 'other_csv'
  | 'lyfta_login'
  | 'hevy_prefs'
  | 'hevy_login'
  | 'hevy_csv';

export type OnboardingFlow = {
  intent: OnboardingIntent;
  step: OnboardingStep;
  platform?: DataSourceChoice;
  backStep?: OnboardingStep;
};
