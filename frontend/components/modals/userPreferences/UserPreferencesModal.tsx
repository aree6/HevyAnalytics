import React from 'react';
import { Settings, X } from 'lucide-react';
import { WeightUnit, DateMode, ThemeMode, ExerciseTrendMode, HeatmapTheme } from '../../../utils/storage/localStorage';
import { BodyMapGender } from '../../bodyMap/BodyMap';
import type { DataAgeInfo } from '../../../hooks/app';
import {
  BodyMapGenderSection,
  DateModeSection,
  HeatmapThemeSection,
  ThemeSection,
  TrendModeSection,
  WeightUnitSection,
} from './UserPreferencesSections';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  weightUnit: WeightUnit;
  onWeightUnitChange: (unit: WeightUnit) => void;
  bodyMapGender: BodyMapGender;
  onBodyMapGenderChange: (gender: BodyMapGender) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  heatmapTheme: HeatmapTheme;
  onHeatmapThemeChange: (theme: HeatmapTheme) => void;
  dateMode: DateMode;
  onDateModeChange: (mode: DateMode) => void;
  exerciseTrendMode: ExerciseTrendMode;
  onExerciseTrendModeChange: (mode: ExerciseTrendMode) => void;
  dataAgeInfo?: DataAgeInfo;
}

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
            {!isLightTheme ? (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-28 w-72 h-72 rounded-full blur-3xl bg-emerald-500/10" />
                <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full blur-3xl bg-violet-500/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
              </div>
            ) : null}

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

            <div className="relative space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WeightUnitSection weightUnit={weightUnit} onWeightUnitChange={onWeightUnitChange} />
                <BodyMapGenderSection bodyMapGender={bodyMapGender} onBodyMapGenderChange={onBodyMapGenderChange} />
              </div>
              <HeatmapThemeSection heatmapTheme={heatmapTheme} onHeatmapThemeChange={onHeatmapThemeChange} />
              <DateModeSection dateMode={dateMode} onDateModeChange={onDateModeChange} dataAgeInfo={dataAgeInfo} />
              <TrendModeSection
                exerciseTrendMode={exerciseTrendMode}
                onExerciseTrendModeChange={onExerciseTrendModeChange}
              />
              <ThemeSection themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
            </div>

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
