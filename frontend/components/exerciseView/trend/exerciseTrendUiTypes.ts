import type { ElementType } from 'react';
import type { ExerciseTrendStatus } from '../../utils/analysis/exerciseTrend';
import type { ExerciseTrendCoreResult } from '../../utils/analysis/exerciseTrend';

export interface StatusResult {
  status: ExerciseTrendStatus;
  diffPct?: number;
  core: ExerciseTrendCoreResult;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: ElementType;
  title: string;
  description: string;
  subtext?: string;
  confidence?: 'low' | 'medium' | 'high';
  evidence?: string[];
  label: string;
  isBodyweightLike: boolean;
  prematurePr?: boolean;
}
