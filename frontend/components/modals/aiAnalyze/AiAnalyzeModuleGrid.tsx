import React from 'react';
import { Check, Info } from 'lucide-react';

import type { TooltipData } from '../../ui/Tooltip';
import type { AnalysisModule, AnalysisModuleId } from './aiAnalyzeConfig';

interface AiAnalyzeModuleGridProps {
  visibleModules: AnalysisModule[];
  selectedIds: AnalysisModuleId[];
  onToggleModule: (id: AnalysisModuleId) => void;
  showTooltip: (e: React.MouseEvent, data: Omit<TooltipData, 'rect'>) => void;
  hideTooltip: () => void;
  isLightTheme: boolean;
}

export const AiAnalyzeModuleGrid: React.FC<AiAnalyzeModuleGridProps> = ({
  visibleModules,
  selectedIds,
  onToggleModule,
  showTooltip,
  hideTooltip,
  isLightTheme,
}) => (
  <div
    className={`border rounded-lg ${isLightTheme ? 'border-gray-300 bg-white' : 'border-slate-800/30 bg-slate-900/20'}`}
    style={{ height: '256px' }}
  >
    <div className="overflow-y-auto h-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visibleModules.map((m) => {
          const selected = selectedIds.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggleModule(m.id)}
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
                    <div
                      className={`text-sm font-semibold truncate ${
                        selected
                          ? isLightTheme
                            ? 'text-emerald-700'
                            : 'text-emerald-200'
                          : isLightTheme
                            ? 'text-gray-700'
                            : 'text-slate-200'
                      }`}
                    >
                      {m.label}
                    </div>
                  </div>
                </div>
                <Info
                  className="w-3 h-3 text-slate-400 hover:text-slate-300 flex-shrink-0 cursor-help"
                  onMouseEnter={(e) =>
                    showTooltip(e, {
                      title: m.label,
                      body: m.tooltip,
                      status: 'default',
                    })
                  }
                  onMouseLeave={hideTooltip}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
