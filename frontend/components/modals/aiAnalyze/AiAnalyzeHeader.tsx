import React from 'react';
import { Brain, X } from 'lucide-react';

interface AiAnalyzeHeaderProps {
  onClose: () => void;
}

export const AiAnalyzeHeader: React.FC<AiAnalyzeHeaderProps> = ({ onClose }) => (
  <div className="relative flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/50">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <Brain className="w-4 h-4 text-purple-300" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-200">AI Analysis</h2>
        <p className="text-xs text-slate-500">Build a custom prompt for your workout data</p>
      </div>
    </div>

    <button
      type="button"
      onClick={onClose}
      className="w-8 h-8 rounded-lg bg-slate-900/20 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
      aria-label="Close"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);
