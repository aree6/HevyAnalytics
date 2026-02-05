import type { HowItWorksSection } from '../utils/howItWorksTypes';

export const KEY_METRICS_SECTION: HowItWorksSection = {
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
};
