import React from 'react';

import { Brain, Check, Copy } from 'lucide-react';

// Simple monochrome SVG for Gemini (Google) that inherits color via currentColor
const GeminiIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 32 32"
    className={className}
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M31,14h-1h-6h-8v5h7c-1.3,2.7-3.8,5.1-7,5.1c-4.5,0-8.1-3.6-8.1-8.1s3.6-8.1,8.1-8.1c2,0,3.6,0.8,5,2.1l6.7-3.3 C25,3.2,20.8,1,16,1C7.7,1,1,7.7,1,16s6.7,15,15,15s15-6.7,15-15C31,15.2,31.1,14.8,31,14z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// AI Analysis KPI Card
interface AIAnalysisCardProps {
  onExportAction: () => void;
  exportCopied: boolean;
  showTimelineChips: boolean;
  setShowTimelineChips: (show: boolean) => void;
  exportWindow: string;
  performCopyForTimeline: (k: string) => void;
  timelineSelected: string | null;
  onGeminiAnalyze: () => void;
  onReCopy: () => void;
  reCopyCopied: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  onExportAction,
  exportCopied,
  showTimelineChips,
  setShowTimelineChips,
  exportWindow,
  performCopyForTimeline,
  timelineSelected,
  onGeminiAnalyze,
  onReCopy,
  reCopyCopied,
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
        {!exportCopied ? (
          <button
            onClick={onExportAction}
            className="inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-white dark:text-white hover:border-purple-400 hover:bg-purple-500/20 transition-all duration-200"
            title="AI Analyze"
          >
            <Brain className="w-3 h-3" />
            <span>Analyze</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onGeminiAnalyze}
              className="inline-flex items-center gap-1 justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-8 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-white dark:text-white hover:border-emerald-400 hover:bg-emerald-500/20 transition-all duration-200"
              title="Analyse with Gemini"
            >
              <GeminiIcon className="w-3 h-3" />
              <span>Open in Gemini</span>
            </button>

            <button
              onClick={onReCopy}
              className="inline-flex items-center gap-1 justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-8 px-2 py-1.5 bg-blue-500/10 border border-blue-500/30 text-white dark:text-white hover:border-blue-400 hover:bg-blue-500/20 transition-all duration-200"
              title="Copy export to clipboard"
            >
              {reCopyCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {showTimelineChips && (
        <div className="mt-2 flex flex-wrap gap-1">
          {['1', '3', '6', 'all'].map((k) => {
            const label = k === 'all' ? 'All' : `${k}m`;
            return (
              <button
                key={k}
                onClick={() => {
                  performCopyForTimeline(k);
                  setShowTimelineChips(false);
                }}
                className="text-xs px-2 py-1 bg-black/50 border border-slate-600/50 text-white dark:text-white hover:bg-white/5 rounded-md transition-colors"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {exportCopied && timelineSelected && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
            <Check className="w-3 h-3" />
            <span className="text-[10px] font-bold">Ready</span>
          </span>
        )}
        {!exportCopied && <span className="text-[10px] text-slate-500">Click to analyze</span>}
      </div>
    </div>
  );
};
