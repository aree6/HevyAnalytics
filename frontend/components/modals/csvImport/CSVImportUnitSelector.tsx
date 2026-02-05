import React from 'react';
import { Check, Weight } from 'lucide-react';

import type { WeightUnit } from '../../../utils/storage/localStorage';

interface CSVImportUnitSelectorProps {
  selectedUnit: WeightUnit | null;
  onSelectUnit: (unit: WeightUnit) => void;
}

export const CSVImportUnitSelector: React.FC<CSVImportUnitSelectorProps> = ({
  selectedUnit,
  onSelectUnit,
}) => (
  <div className="w-full mb-6">
    <p className="text-sm font-semibold text-slate-300 mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
      <Weight className="w-4 h-4 text-slate-300" />
      <span>Choose your weight unit</span>
    </p>
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onSelectUnit('kg')}
        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center ${
          selectedUnit === 'kg'
            ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
            : 'border-slate-700/50 hover:border-slate-500/70 hover:bg-black/60'
        }`}
      >
        {selectedUnit === 'kg' && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        <span
          className={`text-2xl font-bold ${
            selectedUnit === 'kg' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          KG
        </span>
        <span
          className={`mt-1 text-xs ${
            selectedUnit === 'kg' ? 'text-emerald-400/70' : 'text-slate-500'
          }`}
        >
          Kilograms
        </span>
      </button>

      <button
        onClick={() => onSelectUnit('lbs')}
        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center ${
          selectedUnit === 'lbs'
            ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
            : 'border-slate-700/50 hover:border-slate-500/70 hover:bg-black/60'
        }`}
      >
        {selectedUnit === 'lbs' && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        <span
          className={`text-2xl font-bold ${
            selectedUnit === 'lbs' ? 'text-orange-400' : 'text-slate-400'
          }`}
        >
          LBS
        </span>
        <span
          className={`mt-1 text-xs ${
            selectedUnit === 'lbs' ? 'text-orange-400/70' : 'text-slate-500'
          }`}
        >
          Pounds
        </span>
      </button>
    </div>
  </div>
);
