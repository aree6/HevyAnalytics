import React from 'react';
import { X, Settings, Moon, Sun, Sparkles, Palette, Scale, Users } from 'lucide-react';
import { WeightUnit } from '../../utils/storage/localStorage';
import { BodyMapGender } from '../bodyMap/BodyMap';
import { ThemeMode } from '../../utils/storage/localStorage';

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
}

const ThemeOption: React.FC<{
  mode: ThemeMode;
  currentMode: ThemeMode;
  onClick: () => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = ({ mode, currentMode, onClick, label, description, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      currentMode === mode
        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
        : 'bg-black/30 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-black/50'
    }`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
      currentMode === mode ? 'bg-emerald-500/20' : 'bg-slate-800'
    }`}>
      {icon}
    </div>
    <div className="text-left">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-slate-500">{description}</div>
    </div>
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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-3 sm:px-6 py-8 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto">
          <div className="relative bg-black/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 overflow-hidden backdrop-blur-md">
            {/* Background gradients */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-28 w-72 h-72 rounded-full blur-3xl bg-emerald-500/10" />
              <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full blur-3xl bg-violet-500/10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Preferences</h2>
                  <p className="text-sm text-slate-400">Customize your experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-black/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="relative space-y-6">
              {/* Weight Unit Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-200">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Weight Unit</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onWeightUnitChange('kg')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      weightUnit === 'kg'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-black/30 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-black/50'
                    }`}
                  >
                    <span className="text-lg font-bold">kg</span>
                    <span className="text-xs text-slate-500">Kilograms</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onWeightUnitChange('lbs')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      weightUnit === 'lbs'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-black/30 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-black/50'
                    }`}
                  >
                    <span className="text-lg font-bold">lbs</span>
                    <span className="text-xs text-slate-500">Pounds</span>
                  </button>
                </div>
              </div>

              {/* Body Map Gender Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-200">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Body Map Style</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onBodyMapGenderChange('male')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      bodyMapGender === 'male'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-black/30 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-black/50'
                    }`}
                  >
                    <span className="text-sm font-medium">Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onBodyMapGenderChange('female')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      bodyMapGender === 'female'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-black/30 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-black/50'
                    }`}
                  >
                    <span className="text-sm font-medium">Female</span>
                  </button>
                </div>
              </div>

              {/* Theme Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-200">
                  <Palette className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ThemeOption
                    mode="pure-black"
                    currentMode={themeMode}
                    onClick={() => onThemeModeChange('pure-black')}
                    label="Pure Black"
                    description="OLED-friendly, deepest blacks"
                    icon={<Moon className="w-4 h-4" />}
                  />
                  <ThemeOption
                    mode="midnight-dark"
                    currentMode={themeMode}
                    onClick={() => onThemeModeChange('midnight-dark')}
                    label="Midnight"
                    description="Deep dark with subtle contrast"
                    icon={<Sparkles className="w-4 h-4" />}
                  />
                  <ThemeOption
                    mode="medium-dark"
                    currentMode={themeMode}
                    onClick={() => onThemeModeChange('medium-dark')}
                    label="Medium Dark"
                    description="Balanced dark theme"
                    icon={<Moon className="w-4 h-4" />}
                  />
                  <ThemeOption
                    mode="light"
                    currentMode={themeMode}
                    onClick={() => onThemeModeChange('light')}
                    label="Light"
                    description="Bright and clean"
                    icon={<Sun className="w-4 h-4" />}
                  />
                  <ThemeOption
                    mode="svg"
                    currentMode={themeMode}
                    onClick={() => onThemeModeChange('svg')}
                    label="Texture"
                    description="Unique textured background"
                    icon={<Palette className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative mt-6 pt-4 border-t border-slate-700/50">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-all"
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
