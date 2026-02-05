import type { StructuredTooltip, TooltipLine } from '../../../types';

export const line = (text: string, color?: TooltipLine['color'], bold?: boolean): TooltipLine => ({ text, color, bold });

export const buildStructured = (
  trendValue: string,
  direction: 'up' | 'down' | 'same',
  why: TooltipLine[],
  improve?: TooltipLine[]
): StructuredTooltip => ({ trend: { value: trendValue, direction }, why, improve });
