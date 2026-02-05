import type { HowItWorksSection } from '../utils/howItWorksTypes';

export const AI_PRIVACY_SECTIONS: HowItWorksSection[] = [
  {
    id: 'ai-and-sharing',
    title: 'AI export, sharing, and “copy for analysis”',
    nodes: [
      {
        type: 'p',
        text:
          'LiftShift can export a structured summary of your training (sets, exercise stats, trends) so you can paste it into an AI tool or share it with a coach.',
      },
      {
        type: 'callout',
        tone: 'note',
        title: 'What this export is for',
        text:
          'Use it when you want a second opinion: training plan ideas, weak points, or patterns you may not notice. It is a convenience feature — your charts still work without it.',
      },
    ],
  },
  {
    id: 'privacy-and-storage',
    title: 'Privacy, storage, and “Update data”',
    nodes: [
      {
        type: 'p',
        text:
          'LiftShift is privacy-first. Your imported data is typically cached in your browser so the dashboard is fast and you don’t have to re-import every time.',
      },
      {
        type: 'ul',
        items: [
          'Workout data is stored locally (compressed) so reloads are instant.',
          'You can clear cache from the import flow if you want to reset everything.',
          '“Update data” lets you re-sync and refresh your charts when you’ve logged new workouts.',
        ],
      },
    ],
  },
];
