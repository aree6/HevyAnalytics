import { ExerciseTrendStatus } from '../../utils/analysis/exerciseTrend';

export interface SelectedHighlightClasses {
  button: string;
  thumbBorder: string;
}

export const getSelectedHighlightClasses = (
  status: ExerciseTrendStatus,
  intensity: 'strong' | 'soft' = 'strong'
): SelectedHighlightClasses => {
  switch (status) {
    case 'overload':
      return {
        button:
          intensity === 'soft'
            ? 'bg-emerald-500/5 border-emerald-400/40'
            : 'bg-emerald-500/10 border-emerald-400/70 shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_0_18px_rgba(16,185,129,0.12)]',
        thumbBorder: intensity === 'soft' ? 'border-emerald-400/40' : 'border-emerald-400/70',
      };
    case 'regression':
      return {
        button:
          intensity === 'soft'
            ? 'bg-rose-500/5 border-rose-400/40'
            : 'bg-rose-500/10 border-rose-400/70 shadow-[0_0_0_1px_rgba(251,113,133,0.25),0_0_18px_rgba(244,63,94,0.12)]',
        thumbBorder: intensity === 'soft' ? 'border-rose-400/40' : 'border-rose-400/70',
      };
    case 'stagnant':
      return {
        button:
          intensity === 'soft'
            ? 'bg-amber-500/5 border-amber-400/40'
            : 'bg-amber-500/10 border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_0_18px_rgba(245,158,11,0.10)]',
        thumbBorder: intensity === 'soft' ? 'border-amber-400/40' : 'border-amber-400/70',
      };
    case 'new':
    default:
      return {
        button:
          intensity === 'soft'
            ? 'bg-blue-600/10 border-blue-400/40'
            : 'bg-blue-600/15 border-blue-400/70 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_0_18px_rgba(59,130,246,0.12)]',
        thumbBorder: intensity === 'soft' ? 'border-blue-400/40' : 'border-blue-400/70',
      };
  }
};
