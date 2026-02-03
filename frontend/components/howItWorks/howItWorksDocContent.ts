export type HowItWorksLink = {
  label: string;
  hrefPath: string;
};

export type HowItWorksNode =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; tone: 'note' | 'warning'; title: string; text: string }
  | { type: 'links'; links: HowItWorksLink[] };

export type HowItWorksSection = {
  id: string;
  title: string;
  sidebarTitle?: string;
  nodes: HowItWorksNode[];
  children?: HowItWorksSection[];
};

export const HOW_IT_WORKS_SECTIONS: HowItWorksSection[] = [
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
    ],
  },
  {
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
  },
  {
    id: 'key-metrics',
    title: 'What the numbers mean',
    nodes: [
      {
        type: 'p',
        text:
          'These are the main numbers and labels you will see across the dashboard. Use them together: one metric alone can be misleading.',
      },
    ],
    children: [
      {
        id: 'metric-sets-and-workouts',
        title: 'Sets vs workouts (sessions)',
        sidebarTitle: 'Sets vs workouts',
        nodes: [
          {
            type: 'p',
            text:
              'A “set” is one logged set. A “workout” is a full session (a group of sets done in the same workout). LiftShift uses workouts to talk about consistency, and sets to talk about training volume.',
          },
        ],
      },
      {
        id: 'metric-volume',
        title: 'Training volume (work done)',
        sidebarTitle: 'Training volume',
        nodes: [
          {
            type: 'p',
            text:
              'Volume is a simple “how much work did you do?” signal. LiftShift counts working sets and uses weight × reps (and skips warm-up sets in most summaries).',
          },
          {
            type: 'p',
            text:
              'Use volume trends to compare training blocks and see whether your workload is gradually increasing over time.',
          },
        ],
      },
      {
        id: 'metric-duration-density',
        title: 'Workout duration and density',
        sidebarTitle: 'Duration & density',
        nodes: [
          {
            type: 'p',
            text:
              'Workout duration is how long your session lasted (when the source data has start/end times). Density is how much volume you did per minute. Higher density often means shorter rests or faster pacing.',
          },
        ],
      },
      {
        id: 'metric-prs',
        title: 'Personal records (PRs)',
        sidebarTitle: 'PRs',
        nodes: [
          {
            type: 'p',
            text:
              'A PR in LiftShift means a new all-time best weight for an exercise (based on your logged sets). PRs are tracked per exercise over time and used to show progress “bursts” and droughts.',
          },
          {
            type: 'callout',
            tone: 'note',
            title: 'What a PR does (and doesn’t) mean',
            text:
              'A PR is a good progress signal, but it doesn’t automatically mean your program is perfect — and not hitting PRs every week doesn’t mean you’re failing. Use PRs alongside volume, consistency, and trends.',
          },
        ],
      },
      {
        id: 'metric-pr-drought',
        title: 'PR drought (why you can be improving without PRs)',
        sidebarTitle: 'PR drought',
        nodes: [
          {
            type: 'p',
            text:
              'A PR drought means you have not hit a new best weight recently. This can be normal during phases focused on form, higher reps, rebuilding after a break, or simply repeating weights to get stronger at them.',
          },
        ],
      },
      {
        id: 'metric-premature-pr',
        title: 'Premature PRs (unsustainable jumps)',
        sidebarTitle: 'Premature PRs',
        nodes: [
          {
            type: 'p',
            text:
              'Sometimes you hit a big PR, but the next sessions drop hard. LiftShift flags this as a “premature PR”: the jump happened, but it did not hold up over time.',
          },
          {
            type: 'p',
            text:
              'This is not a “you failed” label. It is a reminder to build strength in a stable way: repeat the weight, improve reps and form, and make smaller jumps.',
          },
        ],
      },
      {
        id: 'metric-1rm',
        title: 'Strength estimate (compare different rep ranges)',
        sidebarTitle: 'Strength estimate',
        nodes: [
          {
            type: 'p',
            text:
              'LiftShift uses your weight and reps to estimate your “strength level” for an exercise, so it can compare sessions even if you change rep ranges. It is an estimate, not a max-out test.',
          },
        ],
      },
      {
        id: 'metric-progress-status',
        title: 'Exercise progress status (what the labels mean)',
        sidebarTitle: 'Progress status',
        nodes: [
          {
            type: 'p',
            text:
              'In the exercise view, LiftShift gives each exercise a simple status based on recent sessions. These labels are meant to be coaching hints, not judgments.',
          },
          {
            type: 'ul',
            items: [
              'Getting stronger: a clear positive change (more than about +2%).',
              'Plateauing: roughly stable (between about -3% and +2%).',
              'Taking a dip: a clear drop (more than about -3%).',
              'New: not enough history yet to read a trend.',
              'Premature PR: a big spike was followed by a drop (unsustainable jump).',
            ],
          },
        ],
      },
      {
        id: 'metric-deltas',
        title: 'Changes vs previous periods',
        sidebarTitle: 'Deltas',
        nodes: [
          {
            type: 'p',
            text:
              'Many cards compare a recent window to the window before it (for example: last 7 days vs the 7 days before). This helps you quickly answer: “Am I doing more work lately?”',
          },
        ],
      },
      {
        id: 'metric-streaks',
        title: 'Streaks and consistency',
        sidebarTitle: 'Streaks',
        nodes: [
          {
            type: 'p',
            text:
              'Consistency is tracked week-by-week. LiftShift counts unique workouts and shows streaks based on consecutive weeks with training.',
          },
        ],
      },
      {
        id: 'metric-plateaus',
        title: 'Plateau detection (getting stuck)',
        sidebarTitle: 'Plateaus',
        nodes: [
          {
            type: 'p',
            text:
              'If an exercise looks “stuck” (same load and similar reps across recent sessions), LiftShift flags it as a plateau and suggests a small next-step: a tiny weight increase for weighted lifts, or +1–2 reps for bodyweight-like lifts.',
          },
        ],
      },
      {
        id: 'metric-set-by-set',
        title: 'Set-to-set feedback (inside a workout)',
        sidebarTitle: 'Set-to-set feedback',
        nodes: [
          {
            type: 'p',
            text:
              'LiftShift also looks inside a single workout to explain what happened from set to set: did you fade from fatigue, did you pace well, or did you jump the weight too fast?',
          },
          {
            type: 'ul',
            items: [
              'Normal fatigue: a small rep drop at the same weight is expected.',
              'Good progress: you increased weight and still hit solid reps.',
              'Premature jump: you increased weight too much and reps fell far below what your recent sets suggest.',
              'Effective backoff: you lowered weight and got the reps you needed for more quality volume.',
            ],
          },
          {
            type: 'callout',
            tone: 'note',
            title: 'Why this helps',
            text:
              'It is meant to help you pick better next-session decisions (repeat, add reps, or make a smaller increase) instead of guessing based on one set.',
          },
        ],
      },
      {
        id: 'metric-ema',
        title: 'Trend smoothing (so one good day doesn’t mislead you)',
        sidebarTitle: 'Trend smoothing',
        nodes: [
          {
            type: 'p',
            text:
              'Training data is noisy. LiftShift can smooth trend lines so you see the bigger picture without overreacting to one great (or bad) day.',
          },
          {
            type: 'p',
            text:
              'You can turn this on or off in preferences if you prefer raw session-to-session lines.',
          },
        ],
      },
      {
        id: 'metric-muscle-sets',
        title: 'Weekly sets per muscle',
        sidebarTitle: 'Muscle sets',
        nodes: [
          {
            type: 'p',
            text:
              'For muscle analysis, LiftShift turns each exercise into “muscle work” based on which muscles the movement trains. It uses rolling 7-day windows so “weekly volume” matches how bodies adapt — not just calendar weeks.',
          },
          {
            type: 'p',
            text:
              'This helps answer questions like: “Am I training back as much as chest?” and “Which muscles are being neglected?”',
          },
          {
            type: 'callout',
            tone: 'note',
            title: 'How sets are counted',
            text:
              'Primary muscles count more than secondary muscles. Warm-up sets are skipped so the numbers reflect your working sets.',
          },
        ],
      },
    ],
  },
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
  {
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
  },
];
