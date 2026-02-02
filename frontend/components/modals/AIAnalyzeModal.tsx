import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

import { Brain, Check, Copy, X, Info } from 'lucide-react';

import type { DailySummary, ExerciseStats, WorkoutSet } from '../../types';
import { ThemeMode } from '../../utils/storage/localStorage';
import { exportPackageAndCopyText } from '../../utils/export/clipboardExport';
import { Tooltip, useTooltip } from '../ui/Tooltip';

type TimeframeMonths = 1 | 3 | 6 | 'all';

type AnalysisCategory = 'all' | 'program' | 'progress' | 'balance' | 'recovery' | 'health';

type AnalysisModuleId =
  | 'general_deep_audit'
  | 'redundancy_check'
  | 'junk_volume_audit'
  | 'intensity_drift'
  | 'structural_balance'
  | 'fatigue_correlation'
  | 'joint_health_audit'
  | 'unilateral_balance';

type AnalysisModule = {
  id: AnalysisModuleId;
  label: string;
  category: Exclude<AnalysisCategory, 'all'>;
  tooltip: string;
  prompt: string;
};

const ANALYSIS_MODULES: AnalysisModule[] = [
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
  themeMode: ThemeMode;
}

export const AIAnalyzeModal: React.FC<AIAnalyzeModalProps> = ({
  isOpen,
  onClose,
  fullData,
  dailyData,
  exerciseStats,
  effectiveNow,
  themeMode,
}) => {
  const isLightTheme = themeMode === 'light';
  
  const [months, setMonths] = useState<TimeframeMonths>(1);
  const [activeCategory, setActiveCategory] = useState<AnalysisCategory>('all');
  const [selectedIds, setSelectedIds] = useState<AnalysisModuleId[]>(['general_deep_audit']);

  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reCopyCopied, setReCopyCopied] = useState(false);

  const lastGeneratedRef = useRef<{ months: TimeframeMonths; promptTemplate: string } | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Tooltip state
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

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

  const handleReset = useCallback(() => {
    setIsReady(false);
    setIsGenerating(false);
    setReCopyCopied(false);
    lastGeneratedRef.current = null;
    
    // Clear any existing reset timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  // Auto-reset after 4 seconds when ready
  useEffect(() => {
    if (isReady) {
      resetTimeoutRef.current = setTimeout(() => {
        handleReset();
      }, 4000);
    } else {
      // Clear timeout if not ready
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [isReady, handleReset]);

  // Reset ready state when timeframe or category changes (but not when isReady changes from generation)
  const prevMonthsRef = useRef(months);
  const prevActiveCategoryRef = useRef(activeCategory);
  
  useEffect(() => {
    const monthsChanged = prevMonthsRef.current !== months;
    const categoryChanged = prevActiveCategoryRef.current !== activeCategory;
    
    if ((monthsChanged || categoryChanged) && isReady) {
      handleReset();
    }
    
    prevMonthsRef.current = months;
    prevActiveCategoryRef.current = activeCategory;
  }, [months, activeCategory, isReady, handleReset]);

  const toggleModule = useCallback((id: AnalysisModuleId) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    // Reset ready state when modules change
    if (isReady) handleReset();
  }, [isReady, handleReset]);

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
    
    // Clear reset timeout when user takes action
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
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
      console.error('Re-copy failed', e);
    }
    
    // Clear reset timeout when user takes action
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, [dailyData, effectiveNow, exerciseStats, fullData, isGenerating]);

  const handleOpenGemini = useCallback(() => {
    const instruction = 'Paste the clipboard contents.';
    const url = `https://aistudio.google.com/prompts/new_chat?model=gemini-3-pro-preview&prompt=${encodeURIComponent(instruction)}`;
    window.open(url, '_blank');
    
    // Clear reset timeout when user takes action
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-3 sm:px-4 py-4 sm:py-6 flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative bg-slate-950 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-md shadow-lg" style={{ height: '85vh', maxHeight: '700px' }}>
            {/* Background gradients - only in dark mode */}
            {!isLightTheme && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-28 w-72 h-72 rounded-full blur-3xl bg-emerald-500/10" />
                <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full blur-3xl bg-violet-500/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
              </div>
            )}

            <div className="relative flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-200">AI Analysis</h2>
                  <p className="text-xs text-slate-500">Build a custom prompt for your workout data</p>
                </div>
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

            <div className="flex flex-col h-full" style={{ height: 'calc(100% - 80px)' }}>
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" style={{ maxHeight: 'calc(100% - 100px)' }}>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-200">Timeframe</div>
                    <div className="text-[10px] text-slate-500">How much workout history to analyze</div>
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
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-200">Analysis Add-ons</div>
                    <div className="text-[10px] text-slate-500">Select specific checks to include</div>
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
                              ? 'bg-purple-500/10 border-purple-500/40 text-purple-700'
                              : isLightTheme 
                                ? 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                          }`}
                        >
                          {CATEGORY_LABELS[k]}
                        </button>
                      );
                    })}
                  </div>

                  <div className={`border rounded-lg ${isLightTheme ? 'border-gray-300 bg-white' : 'border-slate-800/30 bg-slate-900/20'}`} style={{ height: '256px' }}>
                  <div className="overflow-y-auto h-full p-2">
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
                                : isLightTheme
                                  ? 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                  : 'bg-slate-900/10 border-slate-700/50 hover:border-slate-600 hover:bg-slate-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center justify-center flex-shrink-0">
                                  <div
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                      selected 
                                        ? `bg-emerald-500/20 border-emerald-500/40 ${isLightTheme ? 'text-emerald-600' : 'text-emerald-300'}`
                                        : `border text-transparent ${isLightTheme ? 'bg-white border-gray-300' : 'bg-transparent border-slate-600'}`
                                    }`}
                                    aria-hidden
                                  >
                                    <Check className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div className={`text-sm font-semibold truncate ${selected ? (isLightTheme ? 'text-emerald-700' : 'text-emerald-200') : (isLightTheme ? 'text-gray-700' : 'text-slate-200')}`}>{m.label}</div>
                                </div>
                              </div>
                              <Info 
                                className="w-3 h-3 text-slate-400 hover:text-slate-300 flex-shrink-0 cursor-help" 
                                onMouseEnter={(e) => showTooltip(e, {
                                  title: m.label,
                                  body: m.tooltip,
                                  status: 'default'
                                })}
                                onMouseLeave={hideTooltip}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Fixed button area at bottom */}
              <div className="flex-shrink-0 flex items-center justify-center px-4 sm:px-5" style={{ height: '80px' }}>
                <div className="flex items-center justify-center gap-2 w-full">
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
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && <Tooltip data={tooltip} />}
    </div>
  );
};
