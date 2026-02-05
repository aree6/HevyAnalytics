import React from 'react';
import { ThemeMode } from '../../../utils/storage/localStorage';

interface CompactThemeOptionProps {
  mode: ThemeMode;
  currentMode: ThemeMode;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

export const CompactThemeOption: React.FC<CompactThemeOptionProps> = ({
  mode,
  currentMode,
  onClick,
  label,
  icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
      currentMode === mode
        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
        : 'bg-slate-900/20 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900/40'
    }`}
    title={label}
  >
    <div
      className={`w-6 h-6 rounded flex items-center justify-center ${
        currentMode === mode ? 'bg-emerald-500/20' : 'bg-slate-800'
      }`}
    >
      {icon}
    </div>
    <div className="text-xs font-medium">{label}</div>
  </button>
);
