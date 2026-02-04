import React from 'react';
import { X, Settings, Moon, Sun, Sparkles, Palette, Scale, Users, Calendar, AlertTriangle } from 'lucide-react';
import { WeightUnit, DateMode, ThemeMode, ExerciseTrendMode, HeatmapTheme } from '../../utils/storage/localStorage';
import { BodyMapGender } from '../bodyMap/BodyMap';
import type { DataAgeInfo } from '../../hooks/usePreferences';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Weight unit preference
  weightUnit: WeightUnit;
  onWeightUnitChange: (unit: WeightUnit) => void;
  
  // Gender preference (for body map)
  bodyMapGender: BodyMapGender;
  onBodyMapGenderChange: (gender: BodyMapGender) => void;
  
  // Theme preference
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;

  // Heatmap theme preference
  heatmapTheme: HeatmapTheme;
  onHeatmapThemeChange: (theme: HeatmapTheme) => void;

  // Date mode preference
  dateMode: DateMode;
  onDateModeChange: (mode: DateMode) => void;

  // Exercise trend reactiveness
  exerciseTrendMode: ExerciseTrendMode;
  onExerciseTrendModeChange: (mode: ExerciseTrendMode) => void;
  
  // Data age info (for showing warning when using actual date with old data)
  dataAgeInfo?: DataAgeInfo;
}

const CompactThemeOption: React.FC<{
  mode: ThemeMode;
  currentMode: ThemeMode;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}> = ({ mode, currentMode, onClick, label, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
      currentMode === mode
        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
        : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
    }`}
    title={label}
  >
    <div className={`w-6 h-6 rounded flex items-center justify-center ${
      currentMode === mode ? 'bg-emerald-500/20' : 'bg-slate-800'
    }`}>
      {icon}
    </div>
    <div className="text-xs font-medium">{label}</div>
  </button>
);

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({
  isOpen,
  onClose,
  weightUnit,
  onWeightUnitChange,
  bodyMapGender,
  onBodyMapGenderChange,
  themeMode,
  onThemeModeChange,
  heatmapTheme,
  onHeatmapThemeChange,
  dateMode,
  onDateModeChange,
  exerciseTrendMode,
  onExerciseTrendModeChange,
  dataAgeInfo,
}) => {
  if (!isOpen) return null;

  const isLightTheme = themeMode === 'light';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-3 sm:px-4 py-4 sm:py-6 flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative bg-slate-950 border border-slate-700/50 rounded-xl p-4 sm:p-5 overflow-hidden backdrop-blur-md shadow-lg">
            {/* Background gradients - only in dark mode */}
            {!isLightTheme && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-28 w-72 h-72 rounded-full blur-3xl bg-emerald-500/10" />
                <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full blur-3xl bg-violet-500/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
              </div>
            )}

            {/* Header - More compact */}
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-emerald-400" />
                </div>

                <h2 className="text-lg font-bold text-slate-200">Preferences</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-900/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content - Compact grid layout */}
            <div className="relative space-y-4">
              {/* Row 1: Weight Unit & Body Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight Unit Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Scale className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-medium">Weight Unit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onWeightUnitChange('kg')}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                        weightUnit === 'kg'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-sm font-bold">kg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onWeightUnitChange('lbs')}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                        weightUnit === 'lbs'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-sm font-bold">lbs</span>
                    </button>
                  </div>
                </div>

                {/* Body Map Gender Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-medium">Body Map Style</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onBodyMapGenderChange('male')}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                        bodyMapGender === 'male'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-sm font-medium">Male</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onBodyMapGenderChange('female')}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                        bodyMapGender === 'female'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-sm font-medium">Female</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Heatmap Theme Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-200">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium">Heatmap Palette</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    { key: 'red', label: 'Red', swatch: 'hsl(5, 75%, 50%)' },
                    { key: 'brown', label: 'Brown', swatch: 'hsl(25, 70%, 45%)' },
                    { key: 'blue', label: 'Blue', swatch: 'hsl(215, 90%, 65%)' },
                  ] as const).map(({ key, label, swatch }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onHeatmapThemeChange(key as HeatmapTheme)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        heatmapTheme === key
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
                      }`}
                      title={label}
                    >
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center ${
                          heatmapTheme === key ? 'bg-emerald-500/20' : 'bg-slate-800'
                        }`}
                      >
                        <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: swatch }} />
                      </div>
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Reference Section */}
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
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      dateMode === 'effective' ? 'bg-emerald-500/20' : 'bg-slate-800'
                    }`}>
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
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      dateMode === 'actual' ? 'bg-emerald-500/20' : 'bg-slate-800'
                    }`}>
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">Actual Date</div>
                      <div className="text-[10px] text-slate-500 truncate">Use real calendar date</div>
                    </div>
                  </button>
                </div>
                {/* Warning when using actual date mode with old data */}
                {dateMode === 'actual' && dataAgeInfo && dataAgeInfo.isStale && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-200 opacity-90">
                      <span className="font-medium">{dataAgeInfo.ageDescription}.</span>
                      {' '}Recent charts may appear empty.
                    </div>
                  </div>
                )}
              </div>

              {/* Trend Reactiveness Section */}
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
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      exerciseTrendMode === 'stable' ? 'bg-emerald-500/20' : 'bg-slate-800'
                    }`}>
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
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      exerciseTrendMode === 'reactive' ? 'bg-emerald-500/20' : 'bg-slate-800'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">Reactive</div>
                      <div className="text-[10px] text-slate-500 truncate">Responds faster to recent sessions (recommended)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Theme Section - Compact 5-column grid */}
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
            </div>

            {/* Footer - More compact */}
            <div className="relative mt-4 pt-3 border-t border-slate-700/50">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
