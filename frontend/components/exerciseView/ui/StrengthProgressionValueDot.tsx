import React from 'react';
import { Trophy, Award, BarChart3 } from 'lucide-react';
import { ExerciseStats, PrType } from '../../../types';
import { ExerciseSessionEntry } from '../../../utils/analysis/exerciseTrend';
import { convertWeight } from '../../../utils/format/units';
import { formatNumber } from '../../../utils/format/formatters';
import { WeightUnit } from '../../../utils/storage/localStorage';

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
    prTypesToShow,
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
    prTypesToShow?: PrType[];
  } = props;

  if (!payload || cx === undefined || cy === undefined) return null;

  const value = payload[valueKey];
  if (typeof value !== 'number') return null;

  // Use a darker amber so PR ticks/trophies remain visible in both light and dark themes
  const prGold = '#d97706';

  // Calculate global max value for this metric across all data
  let globalMaxValue = -Infinity;
  if (Array.isArray(data)) {
    for (const row of data) {
      const v = row?.[valueKey];
      if (typeof v === 'number' && Number.isFinite(v)) {
        globalMaxValue = Math.max(globalMaxValue, v);
      }
    }
  }

  // Check if current value is the global max
  const eps = 0.001;
  const isGlobalMax = Number.isFinite(globalMaxValue) && Math.abs(value - globalMaxValue) <= eps;

  // Get PR types from payload - use separate arrays if available for accuracy
  const combinedPrTypes: PrType[] = payload.prTypes || [];
  let allPrTypes: PrType[] = combinedPrTypes;
  
  // If we have separate PR type arrays, use them based on the line type
  if (valueKey === 'weight' && payload.weightPrTypes) {
    allPrTypes = payload.weightPrTypes;
  } else if (valueKey === 'oneRepMax' && payload.oneRmPrTypes) {
    allPrTypes = payload.oneRmPrTypes;
  }

  // Filter PR types based on what this line should show
  let filteredPrTypes = prTypesToShow
    ? allPrTypes.filter((t) => prTypesToShow.includes(t))
    : allPrTypes;

  // If this is the 1RM line and both weight PR and 1RM PR exist on the same day,
  // suppress the 1RM PR (only show weight PR)
  // Use combinedPrTypes (not the filtered allPrTypes) for this check
  if (prTypesToShow?.includes('oneRm') && combinedPrTypes.includes('weight') && combinedPrTypes.includes('oneRm')) {
    filteredPrTypes = filteredPrTypes.filter((t) => t !== 'oneRm');
  }

  // Only show if this is the global max AND has matching PR types
  const shouldShowPr = isGlobalMax && filteredPrTypes.length > 0;
  const dotColor = shouldShowPr ? prGold : color;

  // Find first occurrence of global max
  let firstGlobalMaxIndex: number | null = null;
  if (isGlobalMax && Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const v = row?.[valueKey];
      if (typeof v === 'number' && Math.abs(v - globalMaxValue) <= eps) {
        firstGlobalMaxIndex = i;
        break;
      }
    }
  }

  // Only show label at first occurrence of global max
  const shouldShowLabel = shouldShowPr && index === firstGlobalMaxIndex;

  if (!shouldShowLabel) {
    if (!showDotWhenHidden) return null;
    return <circle cx={cx} cy={cy} r={3} fill={dotColor} stroke={dotColor} strokeWidth={1} />;
  }

  const displayValue = unit
    ? `${formatNumber(value, { maxDecimals: 1 })}${unit}`
    : Number.isInteger(value)
      ? value.toString()
      : formatNumber(value, { maxDecimals: 1 });

  // Calculate chart width to determine if point is on left or right side
  // Assume standard chart width of 100% - we'll use index to estimate position
  const totalPoints = Array.isArray(data) ? data.length : 0;
  const isOnRightSide = totalPoints > 0 && (index ?? 0) >= totalPoints * 0.7;
  const isOnLeftSide = totalPoints > 0 && (index ?? 0) <= totalPoints * 0.3;
  
  // Positioning: place label and trophy as a cohesive unit
  const isNearTop = cy < 30;
  
  // Label goes above or below the point
  const labelY = isNearTop ? cy + 16 : cy - 10;
  
  // Trophy positioned on the opposite side of the screen to prevent clipping
  // If point is on right side of chart, show trophy on left side of label
  // If point is on left side of chart, show trophy on right side of label
  const charWidth = 5.5; // Approximate width per character at fontSize 9
  const textWidth = displayValue.length * charWidth;
  
  let trophyX: number;
  if (isOnRightSide) {
    // Point is on right side - show trophy on left side of text
    trophyX = cx - textWidth / 2 - 12;
  } else if (isOnLeftSide) {
    // Point is on left side - show trophy on right side of text
    trophyX = cx + textWidth / 2 + 3;
  } else {
    // Middle - default to right side
    trophyX = cx + textWidth / 2 + 3;
  }
  
  const trophyY = labelY - 8; // Slightly above text baseline to align with cap height

  // Select appropriate icon based on PR type
  let TrophyIcon = Trophy;
  if (filteredPrTypes.includes('weight')) {
    TrophyIcon = Trophy;
  } else if (filteredPrTypes.includes('oneRm')) {
    TrophyIcon = Award;
  } else if (filteredPrTypes.includes('volume')) {
    TrophyIcon = BarChart3;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={3} fill={dotColor} stroke={dotColor} strokeWidth={1} />
      <text x={cx} y={labelY} fill={dotColor} fontSize={9} fontWeight="bold" textAnchor="middle">
        {displayValue}
      </text>
      <g transform={`translate(${trophyX}, ${trophyY})`}>
        <TrophyIcon width={10} height={10} stroke={dotColor} fill={dotColor} />
      </g>
    </g>
  );
};
