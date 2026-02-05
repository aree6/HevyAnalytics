import type { HowItWorksSection } from '../utils/howItWorksTypes';
import { IMPORT_METRIC_SECTIONS } from './importMetricSections';

export const INTRO_SECTIONS: HowItWorksSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    nodes: [
      {
        type: 'p',
        text:
          'LiftShift turns your workout log into clear, useful insights: what changed, what is improving, what is stuck, and what to do next — without you building spreadsheets.',
      },
      {
        type: 'ul',
        items: [
          'Import from Hevy (login), Hevy Pro (API key), Lyfta (API key), or CSV (Strong / Lyfta exports / other apps).',
          'Choose your body map and weight unit (kg/lbs) so charts and muscle visuals match you.',
          'Explore your weekly volume, personal records, exercise progress, and muscle balance.',
        ],
      },
      {
        type: 'callout',
        tone: 'note',
        title: 'Privacy model (simple version)',
        text:
          'Most analytics run locally in your browser. When you use login / API-key syncing, LiftShift uses your credentials only to retrieve your workout data — the analysis is still done on your device.',
      },
    ],
  },
  {
    id: 'import-and-sync',
    title: 'Import & sync options',
    nodes: [
      {
        type: 'p',
        text:
          'You can bring data into LiftShift in a few different ways. Pick the method that matches your app and your comfort level.',
      },
    ],
    children: [
      {
        id: 'import-hevy-login',
        title: 'Hevy: login sync',
        sidebarTitle: 'Hevy login',
        nodes: [
          {
            type: 'p',
            text:
              'If you choose “Login with Hevy”, LiftShift logs in via your own backend to retrieve a short-lived auth token, then pulls your workouts and converts them into a standard set format used across the app.',
          },
          {
            type: 'callout',
            tone: 'warning',
            title: 'Language / date formats',
            text:
              'Some exports can break date parsing if the source app uses a non-English locale. If LiftShift tells you it “couldn’t parse workout dates”, switch the exporting app’s language to English and try again.',
          },
        ],
      },
      {
        id: 'import-hevy-api-key',
        title: 'Hevy Pro: API key sync',
        sidebarTitle: 'Hevy API key',
        nodes: [
          {
            type: 'p',
            text:
              'If you have Hevy Pro, you can use your API key. LiftShift validates the key and fetches workouts through the official API endpoint, then maps them into the same internal set format as CSV imports.',
          },
        ],
      },
      {
        id: 'import-lyfta-api-key',
        title: 'Lyfta: API key sync',
        sidebarTitle: 'Lyfta API key',
        nodes: [
          {
            type: 'p',
            text:
              'Lyfta sync uses your API key to fetch workouts and workout summaries, then normalizes them to LiftShift’s set format for analysis.',
          },
        ],
      },
      {
        id: 'import-csv',
        title: 'CSV import (Strong / other apps)',
        sidebarTitle: 'CSV import',
        nodes: [
          {
            type: 'p',
            text:
              'CSV import is the most universal option. LiftShift detects column meanings (like exercise name, weight, reps, date, and set type), supports different date formats, and converts units when needed.',
          },
          {
            type: 'callout',
            tone: 'note',
            title: 'Why CSV sometimes needs setup',
            text:
              'Different apps export slightly different columns and naming conventions. LiftShift uses “best effort” field matching so you can upload more CSV formats without manual mapping.',
          },
        ],
      },
      ...IMPORT_METRIC_SECTIONS,
    ],
  },
];
