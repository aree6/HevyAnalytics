import type { HowItWorksSection } from '../utils/howItWorksTypes';

export const TROUBLESHOOTING_SECTION: HowItWorksSection = {
  id: 'troubleshooting',
  title: 'Troubleshooting & accuracy notes',
  nodes: [
    {
      type: 'ul',
      items: [
        'If a chart looks wrong, check date parsing and make sure your source app export is in English.',
        'If an exercise doesn’t show muscle emphasis, it may not match an exercise asset name (LiftShift uses fuzzy matching, but not every variation is perfect).',
        'PRs are based on the PR definition (best logged weight per exercise). Different apps define PRs differently.',
      ],
    },
  ],
};
