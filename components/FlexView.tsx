import React, { useMemo, useState } from 'react';
import { WorkoutSet } from '../types';
import { 
  ChevronLeft, ChevronRight, Sun, Moon, Dumbbell,
  Sparkles, Weight, Shuffle, RotateCcw
} from 'lucide-react';
import { ViewHeader } from './ViewHeader';
import { findBestComparison, formatLargeNumber, getRandomComparison } from '../utils/comparisonData';
import { WeightUnit } from '../utils/localStorage';
import { convertVolume } from '../utils/units';
import { FANCY_FONT } from '../utils/uiConstants';

interface FlexViewProps {
  data: WorkoutSet[];
  filtersSlot?: React.ReactNode;
  weightUnit?: WeightUnit;
}

type CardTheme = 'dark' | 'light';
type ComparisonMode = 'best' | 'random';

const ZERO_LIFT_MESSAGES = [
  "No weights lifted yet? The bar is waiting for you! 🏋️",
  "Zero volume? Even gravity is confused right now.",
  "Your muscles are on vacation. Time to call them back!",
  "The iron misses you. Go say hello.",
];

// Card component for volume comparison - designed to be screenshot-friendly
const VolumeComparisonCard: React.FC<{
  totalVolume: number;
  weightUnit: WeightUnit;
  theme: CardTheme;
  comparisonMode: ComparisonMode;
  randomKey: number;
  onThemeToggle: () => void;
}> = ({ totalVolume, weightUnit, theme, comparisonMode, randomKey, onThemeToggle }) => {
  const volumeInKg = weightUnit === 'lbs' ? totalVolume / 2.20462 : totalVolume;
  
  const comparison = useMemo(() => {
    if (volumeInKg <= 0) return null;

    if (comparisonMode === 'random') {
      const { filename, item } = getRandomComparison();
      const rawCount = item.weight > 0 ? volumeInKg / item.weight : 0;
      const count = Math.max(0.1, Math.round(rawCount * 10) / 10);
      return { filename, item, count };
    }

    return findBestComparison(volumeInKg);
  }, [volumeInKg, comparisonMode, randomKey]);

  const zeroMessage = useMemo(() => {
    return ZERO_LIFT_MESSAGES[Math.floor(Math.random() * ZERO_LIFT_MESSAGES.length)];
  }, []);

  const isDark = theme === 'dark';

  const formattedCount = useMemo(() => {
    if (!comparison) return null;
    const count = comparison.count;

    if (count > 10) {
      const rounded = Math.round(count);
      return rounded >= 1000 ? formatLargeNumber(rounded) : rounded.toLocaleString();
    }

    const roundedToTenth = Math.round(count * 10) / 10;
    return roundedToTenth.toFixed(1).replace(/\.0$/, '');
  }, [comparison]);
  
  // Theme-based styling
  const cardBg = isDark 
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
    : 'bg-gradient-to-br from-white via-slate-50 to-white';
  const cardBorder = isDark ? 'border-slate-700/50' : 'border-slate-300';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';
  const accentBg = isDark ? 'bg-blue-500/10' : 'bg-blue-100';
  const accentText = isDark ? 'text-blue-400' : 'text-blue-600';
  const glowClass = isDark ? 'shadow-2xl shadow-blue-500/10' : 'shadow-xl shadow-slate-300/50';

  return (
    <div 
      className={`relative rounded-2xl border ${cardBorder} ${cardBg} ${glowClass} overflow-hidden transition-all duration-500 min-h-[460px] sm:min-h-[520px]`}
    >
      {/* Background decorative elements */}
      <div className={`absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-blue-500/5' : 'bg-blue-200/30'}`} />
      <div className={`absolute bottom-0 left-0 w-44 h-44 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-purple-500/5' : 'bg-purple-200/20'}`} />
      
      {/* Theme toggle button - positioned inside card for screenshot */}
      <button
        onClick={onThemeToggle}
        className={`absolute top-3 right-3 z-10 p-2 rounded-xl border transition-all duration-300 ${
          isDark 
            ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-yellow-400' 
            : 'bg-white/80 border-slate-300 hover:bg-slate-100 text-slate-700'
        }`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Card content */}
      <div className="relative z-[1] pt-5 px-5 pb-12 sm:pt-6 sm:px-6 sm:pb-14 flex flex-col items-center text-center h-full">
        <div className="w-full flex flex-col items-center">
          {/* Header */}
          <div className={`flex items-center gap-2 mb-1.5 ${textMuted}`}>
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Total Volume Lifted</span>
            <Sparkles className="w-4 h-4" />
          </div>

          {/* Main volume number */}
          <div className={`text-4xl sm:text-5xl font-black ${textPrimary} mb-0.5`} style={FANCY_FONT}>
            {formatLargeNumber(totalVolume)}
            <span className={`text-xl sm:text-2xl ml-2 ${textSecondary}`}>{weightUnit}</span>
          </div>

          {volumeInKg <= 0 ? (
            // Zero volume state
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`w-20 h-20 rounded-full ${accentBg} flex items-center justify-center mb-5`}>
                <Dumbbell className={`w-10 h-10 ${accentText}`} />
              </div>
              <p className={`text-base sm:text-lg ${textSecondary} max-w-xs`}>
                {zeroMessage}
              </p>
            </div>
          ) : comparison ? (
            // Comparison content
            <div className="flex flex-col items-center justify-center py-3">
              {/* "That's like lifting..." */}
              <p className={`text-xs ${textMuted} mb-3 font-medium`}>That's like lifting...</p>
              
              {/* Comparison image */}
              <div className="relative mb-3">
                <div className={`absolute inset-0 rounded-full blur-2xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-300/30'}`} />
                <img
                  src={`/comparisonImages/${comparison.filename}`}
                  alt={comparison.item.label}
                  className="relative w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-lg"
                  loading="eager"
                />
              </div>

              {/* Count and label */}
              <div className="mb-2">
                <span className={`text-3xl sm:text-4xl font-black ${accentText}`} style={FANCY_FONT}>
                  {formattedCount}x
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-bold ${textPrimary} mb-2`} style={FANCY_FONT}>
                {comparison.item.label}
              </h3>

              {/* Fun description */}
              <p className={`text-xs sm:text-sm ${textSecondary} max-w-sm leading-relaxed whitespace-pre-line`}>
                {comparison.item.description}
              </p>
            </div>
          ) : null}
        </div>

        {/* Branding footer */}
        <div className="mt-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm shadow-sm ${
              isDark
                ? 'bg-slate-900/40 border-slate-700/50'
                : 'bg-white/60 border-slate-200'
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${
                isDark ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white border-slate-200'
              }`}
            >
              <img src="/HevyAnalytics.png" alt="" className="w-4 h-4 opacity-80" />
            </span>
            <span className={`text-[11px] sm:text-xs font-semibold tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              hevyanalytics.netlify.app
            </span>
          </div>
        </div>

        {/* Spacer pushes any remaining space below the footer (keeps description->footer gap consistent) */}
        <div className="flex-1" />
      </div>
    </div>
  );
};

export const FlexView: React.FC<FlexViewProps> = ({ data, filtersSlot, weightUnit = 'kg' }) => {
  const [cardTheme, setCardTheme] = useState<CardTheme>('dark');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const isDev = !!import.meta.env.DEV;
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('best');
  const [randomKey, setRandomKey] = useState(0);

  // Calculate total volume from all sets
  const totalVolume = useMemo(() => {
    let sum = 0;
    for (const set of data) {
      sum += (set.weight_kg || 0) * (set.reps || 0);
    }
    return Math.round(convertVolume(sum, weightUnit));
  }, [data, weightUnit]);

  const totalSets = data.length;

  // Available cards (for future expansion)
  const CARDS = [
    { id: 'volume-comparison', label: 'Volume Comparison' },
    // Future cards can be added here
  ];

  const toggleTheme = () => setCardTheme(t => t === 'dark' ? 'light' : 'dark');
  const toggleComparisonMode = () => {
    setComparisonMode((m) => {
      const next = m === 'best' ? 'random' : 'best';
      return next;
    });
    setRandomKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-3 w-full text-slate-200 pb-10">
      {/* Header */}
      <div className="hidden sm:block">
        <ViewHeader
          leftStats={[{ icon: Dumbbell, value: totalSets, label: 'Total Sets' }]}
          rightStats={[{ icon: Weight, value: `${formatLargeNumber(totalVolume)} ${weightUnit}`, label: 'Volume' }]}
          filtersSlot={filtersSlot}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-col items-center gap-4 px-2 sm:px-4">
        {/* Card container with max width for better appearance */}
        <div className="w-full max-w-lg mx-auto">
          <VolumeComparisonCard
            totalVolume={totalVolume}
            weightUnit={weightUnit}
            theme={cardTheme}
            comparisonMode={comparisonMode}
            randomKey={randomKey}
            onThemeToggle={toggleTheme}
          />
        </div>

        {isDev && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={toggleComparisonMode}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                comparisonMode === 'random'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-black/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
              }`}
              title="Dev: toggle randomized comparison"
            >
              <Shuffle className="w-4 h-4" />
              <span>Randomize: {comparisonMode === 'random' ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRandomKey((k) => k + 1)}
              disabled={comparisonMode !== 'random'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 border border-slate-700/50 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all"
              title="Dev: reroll random item"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reroll</span>
            </button>
          </div>
        )}

        {/* Card navigation (for future multiple cards) */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setCurrentCardIndex(i => Math.max(0, i - 1))}
            disabled={currentCardIndex === 0}
            className="p-2 rounded-lg bg-black/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {CARDS.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => setCurrentCardIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentCardIndex 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
                title={card.label}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentCardIndex(i => Math.min(CARDS.length - 1, i + 1))}
            disabled={currentCardIndex === CARDS.length - 1}
            className="p-2 rounded-lg bg-black/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlexView;
