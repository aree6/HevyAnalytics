export type TimeframeMonths = 1 | 3 | 6 | 'all';

export type AnalysisCategory = 'all' | 'program' | 'progress' | 'balance' | 'recovery' | 'health';

export type AnalysisModuleId =
  | 'general_deep_audit'
  | 'redundancy_check'
  | 'junk_volume_audit'
  | 'intensity_drift'
  | 'structural_balance'
  | 'fatigue_correlation'
  | 'joint_health_audit'
  | 'unilateral_balance';

export type AnalysisModule = {
  id: AnalysisModuleId;
  label: string;
  category: Exclude<AnalysisCategory, 'all'>;
  tooltip: string;
  prompt: string;
};

export const ANALYSIS_MODULES: AnalysisModule[] = [
  {
    id: 'general_deep_audit',
    label: 'General Deep Audit',
    category: 'program',
    tooltip: 'Get a comprehensive overview of your training patterns and identify the highest-impact changes you can make for better results.',
    prompt:
      'Do a deep audit beyond surface stats. Identify patterns, blind spots, and the highest-leverage next changes. Keep it practical and specific to my data.',
  },
  {
    id: 'redundancy_check',
    label: 'Redundancy Check',
    category: 'program',
    tooltip: 'Discover overlapping exercises that work the same muscles, allowing you to replace redundant movements with more effective variations.',
    prompt:
      'Am I performing multiple movements that hit the exact same resistance profile (e.g., 3 mid-range rows) while missing key stimuli like the stretched position? Flag redundancies and suggest swaps.',
  },
  {
    id: 'junk_volume_audit',
    label: 'Junk Volume Audit',
    category: 'progress',
    tooltip: 'Identify exercises where you\'re adding sets but not making progress, helping you eliminate wasted effort and focus on productive training.',
    prompt:
      'Identify exercises where I am adding sets, but my working weights/reps are stagnant or regressing. Highlight likely junk volume and propose a tighter progression plan.',
  },
  {
    id: 'intensity_drift',
    label: 'Intensity Drift',
    category: 'progress',
    tooltip: 'Detect if you\'re maintaining volume but reducing actual intensity over time, ensuring you\'re building strength not just endurance.',
    prompt:
      "Am I actually increasing mechanical tension over time, or just padding volume with 'fluff' reps? Look for signs of intensity drifting downward and propose guardrails (RIR targets, rep ranges, top sets/back-offs).",
  },
  {
    id: 'structural_balance',
    label: 'Structural Balance',
    category: 'balance',
    tooltip: 'Analyze your push-to-pull ratios and muscle group balance to prevent imbalances that could lead to injury or plateaus.',
    prompt:
      'Estimate my push:pull balance and highlight any likely imbalance risks. If the data is insufficient, explain what is missing and provide best-effort inference from exercise selection.',
  },
  {
    id: 'fatigue_correlation',
    label: 'Fatigue Correlation',
    category: 'recovery',
    tooltip: 'Find out if heavy workouts are impacting your performance in subsequent sessions, helping you optimize your training schedule.',
    prompt:
      'Check whether a specific heavy lift (e.g., deadlifts) consistently correlates with a performance drop in unrelated workouts ~48 hours later. If correlation is weak, propose what to track next to verify.',
  },
  {
    id: 'joint_health_audit',
    label: 'Joint Health Audit',
    category: 'health',
    tooltip: 'Scan your training patterns for potential joint irritation risks and get suggestions to keep your joints healthy long-term.',
    prompt:
      'Scan my exercise selection and weekly patterns for common joint irritation risks (elbows/shoulders/knees/lower back). Suggest small changes (exercise swaps, sequencing, volume distribution).',
  },
  {
    id: 'unilateral_balance',
    label: 'Unilateral Balance Check',
    category: 'balance',
    tooltip: 'Analyze left/right strength imbalances in unilateral exercises to identify and correct asymmetries that could lead to injury or performance issues.',
    prompt:
      'Compare left vs right performance in unilateral exercises (lunges, single-arm rows, etc.). Identify significant strength differences (>10% imbalance) and suggest corrective exercises or volume adjustments to address asymmetries.',
  },
];

export const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  all: 'All',
  program: 'Program',
  progress: 'Progress',
  balance: 'Balance',
  recovery: 'Recovery',
  health: 'Health',
};

export const buildPromptTemplate = (args: {
  months: TimeframeMonths;
  selectedModules: AnalysisModule[];
}) => {
  const scopeLabel = args.months === 'all' ? 'all available history' : `the last ${args.months} month${args.months === 1 ? '' : 's'}`;

  const focusLines = args.selectedModules
    .map((m) => `- ${m.label}: ${m.prompt}`)
    .join('\n');

  return [
    `I am a {} in gym. Here are my workout logs covering ${scopeLabel}.`,
    '',
    'I want a high-signal training analysis with minimal fluff.',
    '',
    'Focus areas (treat these as add-ons; cover each clearly):',
    focusLines || '- General analysis: Summarize the biggest patterns and highest-leverage fixes.',
    '',
    'Output requirements:',
    '- Use clear headings and bullet points.',
    '- When you make a claim, point to specific evidence from the logs (dates, exercises, patterns).',
    '- If a requested check is not possible with the data, say what is missing and provide best-effort inference.',
    '- End with a prioritized action list for the next 2-4 weeks.',
  ].join('\n');
};
