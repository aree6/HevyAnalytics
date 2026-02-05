import React from 'react';
import type { TimeframeMonths } from './aiAnalyzeConfig';

interface AiAnalyzeTimeframePickerProps {
  months: TimeframeMonths;
  setMonths: (value: TimeframeMonths) => void;
}

export const AiAnalyzeTimeframePicker: React.FC<AiAnalyzeTimeframePickerProps> = ({
  months,
  setMonths,
}) => (
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
);
