import React from 'react';
import { Palette, Scale, Users } from 'lucide-react';
import { HeatmapTheme, WeightUnit } from '../../../utils/storage/localStorage';
import { BodyMapGender } from '../../bodyMap/BodyMap';

interface WeightUnitSectionProps {
  weightUnit: WeightUnit;
  onWeightUnitChange: (unit: WeightUnit) => void;
}

export const WeightUnitSection: React.FC<WeightUnitSectionProps> = ({ weightUnit, onWeightUnitChange }) => (
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
);

interface BodyMapGenderSectionProps {
  bodyMapGender: BodyMapGender;
  onBodyMapGenderChange: (gender: BodyMapGender) => void;
}

export const BodyMapGenderSection: React.FC<BodyMapGenderSectionProps> = ({
  bodyMapGender,
  onBodyMapGenderChange,
}) => (
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
);

interface HeatmapThemeSectionProps {
  heatmapTheme: HeatmapTheme;
  onHeatmapThemeChange: (theme: HeatmapTheme) => void;
}

export const HeatmapThemeSection: React.FC<HeatmapThemeSectionProps> = ({ heatmapTheme, onHeatmapThemeChange }) => (
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
);
