import React from 'react';
import { AlertTriangle, Calendar, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import { DateMode, ExerciseTrendMode, ThemeMode } from '../../../utils/storage/localStorage';
import type { DataAgeInfo } from '../../../hooks/app';
import { CompactThemeOption } from './UserPreferencesThemeOption';

interface DateModeSectionProps {
  dateMode: DateMode;
  onDateModeChange: (mode: DateMode) => void;
  dataAgeInfo?: DataAgeInfo;
}

export const DateModeSection: React.FC<DateModeSectionProps> = ({ dateMode, onDateModeChange, dataAgeInfo }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-slate-200">
      <Calendar className="w-3.5 h-3.5 text-slate-500" />
      <span className="text-xs font-medium">Date Reference</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onDateModeChange('effective')}
        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
          dateMode === 'effective'
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
        }`}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            dateMode === 'effective' ? 'bg-emerald-500/20' : 'bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">Last Workout Date</div>
          <div className="text-[10px] text-slate-500 truncate">Use recent workout as "today"</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onDateModeChange('actual')}
        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
          dateMode === 'actual'
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
        }`}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            dateMode === 'actual' ? 'bg-emerald-500/20' : 'bg-slate-800'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">Actual Date</div>
          <div className="text-[10px] text-slate-500 truncate">Use real calendar date</div>
        </div>
      </button>
    </div>
    {dateMode === 'actual' && dataAgeInfo && dataAgeInfo.isStale ? (
      <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-200 opacity-90">
          <span className="font-medium">{dataAgeInfo.ageDescription}.</span> Recent charts may appear empty.
        </div>
      </div>
    ) : null}
  </div>
);

interface TrendModeSectionProps {
  exerciseTrendMode: ExerciseTrendMode;
  onExerciseTrendModeChange: (mode: ExerciseTrendMode) => void;
}

export const TrendModeSection: React.FC<TrendModeSectionProps> = ({
  exerciseTrendMode,
  onExerciseTrendModeChange,
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-slate-200">
      <Sparkles className="w-3.5 h-3.5 text-slate-500" />
      <span className="text-xs font-medium">Trend Reactiveness</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onExerciseTrendModeChange('stable')}
        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
          exerciseTrendMode === 'stable'
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
        }`}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            exerciseTrendMode === 'stable' ? 'bg-emerald-500/20' : 'bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">Stable</div>
          <div className="text-[10px] text-slate-500 truncate">More stable, slower to react</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onExerciseTrendModeChange('reactive')}
        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
          exerciseTrendMode === 'reactive'
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
        }`}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            exerciseTrendMode === 'reactive' ? 'bg-emerald-500/20' : 'bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">Reactive</div>
          <div className="text-[10px] text-slate-500 truncate">Responds faster to recent sessions (recommended)</div>
        </div>
      </button>
    </div>
  </div>
);

interface ThemeSectionProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export const ThemeSection: React.FC<ThemeSectionProps> = ({ themeMode, onThemeModeChange }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-slate-200">
      <Palette className="w-3.5 h-3.5 text-slate-500" />
      <span className="text-xs font-medium">Theme</span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      <CompactThemeOption
        mode="pure-black"
        currentMode={themeMode}
        onClick={() => onThemeModeChange('pure-black')}
        label="Pure Black"
        icon={<Moon className="w-3.5 h-3.5" />}
      />
      <CompactThemeOption
        mode="midnight-dark"
        currentMode={themeMode}
        onClick={() => onThemeModeChange('midnight-dark')}
        label="Midnight"
        icon={<Sparkles className="w-3.5 h-3.5" />}
      />
      <CompactThemeOption
        mode="medium-dark"
        currentMode={themeMode}
        onClick={() => onThemeModeChange('medium-dark')}
        label="Medium"
        icon={<Moon className="w-3.5 h-3.5" />}
      />
      <CompactThemeOption
        mode="light"
        currentMode={themeMode}
        onClick={() => onThemeModeChange('light')}
        label="Light"
        icon={<Sun className="w-3.5 h-3.5" />}
      />
    </div>
  </div>
);
