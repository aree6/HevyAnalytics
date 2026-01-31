import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

import { Brain, Check, Copy, X } from 'lucide-react';

import type { DailySummary, ExerciseStats, WorkoutSet } from '../../types';
import { exportPackageAndCopyText } from '../../utils/export/clipboardExport';

type TimeframeMonths = 1 | 3 | 6 | 'all';

type AnalysisCategory = 'all' | 'program' | 'progress' | 'balance' | 'recovery' | 'health';

type AnalysisModuleId =
  | 'general_deep_audit'
  | 'redundancy_check'
  | 'junk_volume_audit'
  | 'intensity_drift'
  | 'structural_balance'
  | 'fatigue_correlation'
  | 'joint_health_audit';

type AnalysisModule = {
  id: AnalysisModuleId;
  label: string;
  category: Exclude<AnalysisCategory, 'all'>;
  short: string;
  prompt: string;
};

const ANALYSIS_MODULES: AnalysisModule[] = [
  {
    id: 'general_deep_audit',
    label: 'General Deep Audit',
    category: 'program',
    short: 'High-signal overview',
    prompt:
      'Do a deep audit beyond surface stats. Identify patterns, blind spots, and the highest-leverage next changes. Keep it practical and specific to my data.',
  },
  {
    id: 'redundancy_check',
    label: 'Redundancy Check',
    category: 'program',
    short: 'Overlapping movements',
    prompt:
      'Am I performing multiple movements that hit the exact same resistance profile (e.g., 3 mid-range rows) while missing key stimuli like the stretched position? Flag redundancies and suggest swaps.',
  },
  {
    id: 'junk_volume_audit',
    label: 'Junk Volume Audit',
    category: 'progress',
    short: 'Stagnant sets',
    prompt:
      'Identify exercises where I am adding sets, but my working weights/reps are stagnant or regressing. Highlight likely junk volume and propose a tighter progression plan.',
  },
  {
    id: 'intensity_drift',
    label: 'Intensity Drift',
    category: 'progress',
    short: 'Fluff reps',
    prompt:
      "Am I actually increasing mechanical tension over time, or just padding volume with 'fluff' reps? Look for signs of intensity drifting downward and propose guardrails (RIR targets, rep ranges, top sets/back-offs).",
  },
  {
    id: 'structural_balance',
    label: 'Structural Balance',
    category: 'balance',
    short: 'Push vs Pull',
    prompt:
      'Estimate my push:pull balance and highlight any likely imbalance risks. If the data is insufficient, explain what is missing and provide best-effort inference from exercise selection.',
  },
  {
    id: 'fatigue_correlation',
    label: 'Fatigue Correlation',
    category: 'recovery',
    short: '48h performance dip',
    prompt:
      'Check whether a specific heavy lift (e.g., deadlifts) consistently correlates with a performance drop in unrelated workouts ~48 hours later. If correlation is weak, propose what to track next to verify.',
  },
  {
    id: 'joint_health_audit',
    label: 'Joint Health Audit',
    category: 'health',
    short: 'Irritation risk',
    prompt:
      'Scan my exercise selection and weekly patterns for common joint irritation risks (elbows/shoulders/knees/lower back). Suggest small changes (exercise swaps, sequencing, volume distribution).',
  },
];

const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  all: 'All',
  program: 'Program',
  progress: 'Progress',
  balance: 'Balance',
  recovery: 'Recovery',
  health: 'Health',
};

const buildPromptTemplate = (args: {
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

export interface AIAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullData: WorkoutSet[];
  dailyData: DailySummary[];
  exerciseStats: ExerciseStats[];
  effectiveNow: Date;
}

export const AIAnalyzeModal: React.FC<AIAnalyzeModalProps> = ({
  isOpen,
  onClose,
  fullData,
  dailyData,
  exerciseStats,
  effectiveNow,
}) => {
  const [months, setMonths] = useState<TimeframeMonths>(1);
  const [activeCategory, setActiveCategory] = useState<AnalysisCategory>('all');
  const [selectedIds, setSelectedIds] = useState<AnalysisModuleId[]>(['general_deep_audit']);

  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reCopyCopied, setReCopyCopied] = useState(false);

  const lastGeneratedRef = useRef<{ months: TimeframeMonths; promptTemplate: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsReady(false);
    setIsGenerating(false);
    setReCopyCopied(false);
    lastGeneratedRef.current = null;
  }, [isOpen]);

  const visibleModules = useMemo(() => {
    if (activeCategory === 'all') return ANALYSIS_MODULES;
    return ANALYSIS_MODULES.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

  const selectedModules = useMemo(() => {
    const set = new Set(selectedIds);
    return ANALYSIS_MODULES.filter((m) => set.has(m.id));
  }, [selectedIds]);

  const toggleModule = useCallback((id: AnalysisModuleId) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    const promptTemplate = buildPromptTemplate({ months, selectedModules });
    setIsGenerating(true);

    try {
      await exportPackageAndCopyText(
        fullData,
        dailyData,
        exerciseStats,
        months === 'all' ? 'all' : months,
        new Date(),
        effectiveNow,
        promptTemplate
      );

      lastGeneratedRef.current = { months, promptTemplate };
      setIsReady(true);
    } catch (e) {
      console.error('AI analysis export failed', e);
    } finally {
      setIsGenerating(false);
    }
  }, [dailyData, effectiveNow, exerciseStats, fullData, isGenerating, months, selectedModules]);

  const handleReCopy = useCallback(async () => {
    if (!lastGeneratedRef.current || isGenerating) return;

    const { months: lastMonths, promptTemplate } = lastGeneratedRef.current;

    try {
      await exportPackageAndCopyText(
        fullData,
        dailyData,
        exerciseStats,
        lastMonths === 'all' ? 'all' : lastMonths,
        new Date(),
        effectiveNow,
        promptTemplate
      );
      setReCopyCopied(true);
      window.setTimeout(() => setReCopyCopied(false), 2000);
    } catch (e) {
      console.error('AI analysis re-copy failed', e);
    }
  }, [dailyData, effectiveNow, exerciseStats, fullData, isGenerating]);

  const handleOpenGemini = useCallback(() => {
    const instruction = 'Paste the clipboard contents.';
    const url = `https://aistudio.google.com/prompts/new_chat?model=gemini-3-pro-preview&prompt=${encodeURIComponent(instruction)}`;
    window.open(url, '_blank');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-3 sm:px-4 py-4 sm:py-6 flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative bg-slate-950 border border-slate-700/50 rounded-xl p-4 sm:p-5 overflow-hidden backdrop-blur-md shadow-lg">
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-300" />
                </div>
                <h2 className="text-lg font-bold text-slate-200">AI Analysis</h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-900/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-200">Timeframe</div>
                  <div className="text-[10px] text-slate-500">Choose how much history to include</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: '1 month', value: 1 as const },
                    { label: '3 months', value: 3 as const },
                    { label: '6 months', value: 6 as const },
                    { label: 'All', value: 'all' as const },
                  ] as const).map((opt) => {
                    const selected = months === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setMonths(opt.value)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-200">Add-ons</div>
                  <div className="text-[10px] text-slate-500">Stack multiple checks</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABELS) as AnalysisCategory[]).map((k) => {
                    const selected = activeCategory === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setActiveCategory(k)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                          selected
                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                            : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                        }`}
                      >
                        {CATEGORY_LABELS[k]}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleModules.map((m) => {
                    const selected = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleModule(m.id)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-slate-900/10 border-slate-700/50 hover:border-slate-600 hover:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`text-sm font-semibold truncate ${selected ? 'text-emerald-200' : 'text-slate-200'}`}>{m.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{m.short}</div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                              selected ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-transparent border-slate-600 text-transparent'
                            }`}
                            aria-hidden
                          >
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {!isReady ? (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-semibold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 h-10 px-4 py-2 bg-transparent border border-purple-500/40 text-slate-200 hover:border-purple-400 hover:text-purple-200 hover:bg-purple-500/10 transition-all duration-200"
                  >
                    <Brain className="w-4 h-4" />
                    <span>{isGenerating ? 'Generating…' : 'Generate Prompt'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenGemini}
                      className="inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-semibold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 h-10 px-4 py-2 bg-transparent border border-emerald-500/40 text-slate-200 hover:border-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/10 transition-all duration-200"
                    >
                      <span>Analyse with Gemini</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReCopy}
                      className="inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-semibold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 h-10 px-4 py-2 bg-transparent border border-slate-700/50 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200"
                      title="Copy export to clipboard"
                    >
                      {reCopyCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{reCopyCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isReady ? (
                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-semibold">Ready (copied to clipboard)</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
