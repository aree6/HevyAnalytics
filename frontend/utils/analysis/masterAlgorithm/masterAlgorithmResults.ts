import type { AnalysisResult, AnalysisStatus, StructuredTooltip } from '../../../types';
import { roundTo } from '../../format/formatters';

export const createAnalysisResult = (
  transition: string,
  status: AnalysisStatus,
  weightChangePct: number,
  volDropPct: number,
  actualReps: number,
  expectedReps: string,
  shortMessage: string,
  tooltip: string,
  structured?: StructuredTooltip
): AnalysisResult => ({
  transition,
  status,
  metrics: {
    weight_change_pct: weightChangePct === 0 ? '0%' : `${weightChangePct > 0 ? '+' : ''}${roundTo(weightChangePct, 1)}%`,
    vol_drop_pct: `${roundTo(volDropPct, 1)}%`,
    actual_reps: actualReps,
    expected_reps: expectedReps,
  },
  shortMessage,
  tooltip,
  structured,
});
