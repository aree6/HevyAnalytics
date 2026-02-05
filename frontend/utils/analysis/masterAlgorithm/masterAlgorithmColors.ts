import type { AnalysisStatus } from '../../../types';

const STATUS_COLORS: Readonly<Record<AnalysisStatus, string>> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
  danger: 'bg-red-500/10 text-red-400 border-red-500/50',
};

const WISDOM_COLORS: Readonly<Record<string, string>> = {
  promote: 'bg-purple-500/10 text-purple-400 border-purple-500/50',
  demote: 'bg-orange-500/10 text-orange-400 border-orange-500/50',
};

const DEFAULT_COLOR = 'bg-slate-800 text-slate-400 border-slate-700';

export const getStatusColor = (status: AnalysisStatus): string => {
  return STATUS_COLORS[status] ?? DEFAULT_COLOR;
};

export const getWisdomColor = (type: string): string => {
  return WISDOM_COLORS[type] ?? DEFAULT_COLOR;
};
