import React from 'react';

import { Brain } from 'lucide-react';

// AI Analysis KPI Card
interface AIAnalysisCardProps {
  onAIAnalyze: () => void;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  onAIAnalyze,
}) => {
  return (
    <div className="bg-black/70 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all group overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-black/50 text-purple-400 flex-shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">AI Analysis</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onAIAnalyze}
          className="inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-white dark:text-white hover:border-purple-400 hover:bg-purple-500/20 transition-all duration-200"
          title="AI Analyze"
        >
          <Brain className="w-3 h-3" />
          <span>Analyze</span>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-slate-500">Build a custom prompt</span>
      </div>
    </div>
  );
};
