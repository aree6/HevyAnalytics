import React from 'react';
import { Trophy } from 'lucide-react';
import { ExerciseStats } from '../../types';
import { ExerciseSessionEntry } from '../../utils/analysis/exerciseTrend';
import { convertWeight } from '../../utils/format/units';
import { formatNumber } from '../../utils/format/formatters';
import { WeightUnit } from '../../utils/storage/localStorage';

export const StrengthProgressionValueDot = (props: any) => {
  const {
    cx,
    cy,
    payload,
    index,
    data,
    valueKey,
    unit,
    showAtIndexMap,
    showEveryOther = true,
    everyNth,
    showDotWhenHidden = true,
    color = 'var(--text-muted)',
    isBodyweightLike,
    selectedSessions,
    selectedStats,
    weightUnit,
  }: {
    cx?: number;
    cy?: number;
    payload?: any;
    index?: number;
    data?: any[];
    valueKey: string;
    unit?: string;
    showAtIndexMap?: Record<number, boolean>;
    showEveryOther?: boolean;
    everyNth?: number;
    showDotWhenHidden?: boolean;
    color?: string;
    isBodyweightLike: boolean;
    selectedSessions: ExerciseSessionEntry[];
    selectedStats?: ExerciseStats;
    weightUnit: WeightUnit;
  } = props;

  if (!payload) return null;

  const value = payload[valueKey];
  if (typeof value !== 'number') return null;

  // Use a darker amber so PR ticks/trophies remain visible in both light and dark themes
  const prGold = '#d97706';
  let bestRepsLocal = 0;
  if (isBodyweightLike) {
    for (const s of selectedSessions) bestRepsLocal = Math.max(bestRepsLocal, s.maxReps);
  }
  const globalPrValue = isBodyweightLike
    ? bestRepsLocal
    : convertWeight(selectedStats?.maxWeight ?? Number.NaN, weightUnit);
  const isPr =
    Number.isFinite(globalPrValue) &&
    (isBodyweightLike ? value >= globalPrValue - 1e-6 : Math.abs(value - globalPrValue) <= 0.05);
  const dotColor = isPr ? prGold : color;

  let firstPrIndex: number | null = null;
  if (isPr && Number.isFinite(globalPrValue) && Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const v = row?.[valueKey];
      if (typeof v !== 'number') continue;
      const isPrAtI = isBodyweightLike ? v >= globalPrValue - 1e-6 : Math.abs(v - globalPrValue) <= 0.05;
      if (isPrAtI) {
        firstPrIndex = i;
        break;
      }
    }
  }

  const n = Array.isArray(data) ? data.length : 0;
  const step = Number.isFinite(everyNth) && everyNth > 0 ? everyNth : showEveryOther ? 2 : 1;
  const shouldShowByIndexMap = showAtIndexMap && typeof showAtIndexMap === 'object' ? !!showAtIndexMap[index] : null;

  // Label rules:
  // - Always show the first occurrence of the current (global) PR value.
  // - For repeated hits of the same PR value, only show the label when this point is also an X-axis tick.
  const shouldShowRepeatedPrLabel =
    shouldShowByIndexMap !== null
      ? shouldShowByIndexMap
      : step <= 1 || index % step === 0 || index === n - 1 || index === 0;

  const shouldShowPrLabel =
    isPr &&
    (firstPrIndex === null
      ? true
      : index === firstPrIndex
        ? true
        : shouldShowRepeatedPrLabel);

  const shouldShowLabel = isPr
    ? shouldShowPrLabel
    : (shouldShowByIndexMap !== null
      ? shouldShowByIndexMap || index === n - 1 || index === 0
      : step <= 1 || index % step === 0 || index === n - 1 || index === 0);

  if (!shouldShowLabel) {
    if (!showDotWhenHidden) return null;
    return <circle cx={cx} cy={cy} r={3} fill={dotColor} stroke={dotColor} strokeWidth={1} />;
  }

  const displayValue = unit
    ? `${formatNumber(value, { maxDecimals: 1 })}${unit}`
    : Number.isInteger(value)
      ? value.toString()
      : formatNumber(value, { maxDecimals: 1 });

  const labelY = cy - 10;
  const approxHalfWidth = displayValue.length * 2.7;
  const trophyOnLeft = index === n - 1 || index === n - 2;
  const trophyX = trophyOnLeft ? cx - approxHalfWidth - 14 : cx + approxHalfWidth + 4;

  const showTrophy = isPr && firstPrIndex !== null && index === firstPrIndex;

  return (
    <g>
      <circle cx={cx} cy={cy} r={3} fill={dotColor} stroke={dotColor} strokeWidth={1} />
      <text x={cx} y={labelY} fill={dotColor} fontSize={9} fontWeight="bold" textAnchor="middle">
        {displayValue}
      </text>
      {showTrophy ? (
        <g transform={`translate(${trophyX}, ${labelY - 8})`}>
          <Trophy width={10} height={10} stroke={dotColor} fill={dotColor} />
        </g>
      ) : null}
    </g>
  );
};
