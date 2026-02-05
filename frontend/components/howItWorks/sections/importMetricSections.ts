import type { HowItWorksSection } from '../utils/howItWorksTypes';

export const IMPORT_METRIC_SECTIONS: HowItWorksSection[] = [
  {
    id: 'metric-intensity-split',
    title: 'Training focus: strength vs muscle vs endurance',
    sidebarTitle: 'Training focus',
    nodes: [
      {
        type: 'p',
        text:
          'LiftShift groups your sets by rep ranges to show what your training has emphasized lately: lower-rep sets look more strength-focused, mid-range sets look more muscle-focused, and high-rep sets look more endurance-focused.',
      },
    ],
  },
  {
    id: 'metric-activity-heatmap',
    title: 'Activity heatmap (consistency over the year)',
    sidebarTitle: 'Heatmap',
    nodes: [
      {
        type: 'p',
        text:
          'The heatmap shows how often you trained over the last year. Darker days usually mean more working sets (and often more total volume). It is best used for consistency, not perfection.',
      },
    ],
  },
];
