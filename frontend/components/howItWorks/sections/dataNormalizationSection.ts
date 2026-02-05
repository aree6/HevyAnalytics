import type { HowItWorksSection } from '../utils/howItWorksTypes';

export const DATA_NORMALIZATION_SECTION: HowItWorksSection = {
  id: 'data-normalization',
  title: 'Before you read the charts',
  nodes: [
    {
      type: 'p',
      text:
        'After import, LiftShift cleans and standardizes your workouts so every chart is consistent (even if the data came from different apps).',
    },
    {
      type: 'ul',
      items: [
        'Dates are parsed into real timestamps so filtering and time-series charts work reliably.',
        'Weights are converted into a single internal unit (kg) and then displayed back to you as kg or lbs.',
        'Sets are grouped into workouts (sessions) so totals match what you did in the gym.',
        'Warm-up sets are excluded from most analytics so trends reflect your working sets.',
      ],
    },
    {
      type: 'callout',
      tone: 'note',
      title: 'What counts as a warm-up?',
      text:
        'LiftShift treats a set as warm-up when its set type is “w” or contains the word “warmup”. Warm-ups are kept in history, but most totals and charts focus on working sets.',
    },
  ],
};
