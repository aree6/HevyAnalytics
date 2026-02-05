import React from 'react';
import type { AnalysisCategory } from './aiAnalyzeConfig';
import { CATEGORY_LABELS } from './aiAnalyzeConfig';

interface AiAnalyzeCategoryChipsProps {
  activeCategory: AnalysisCategory;
  setActiveCategory: (category: AnalysisCategory) => void;
  isLightTheme: boolean;
}

export const AiAnalyzeCategoryChips: React.FC<AiAnalyzeCategoryChipsProps> = ({
  activeCategory,
  setActiveCategory,
  isLightTheme,
}) => (
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
  </div>
);
