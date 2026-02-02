import React, { useState, useEffect, memo } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Trophy,
  Calendar, AlertTriangle, Dumbbell
} from 'lucide-react';
import CountUp from '../ui/CountUp';
import {
  DashboardInsights,
  SparklinePoint,
  PRInsights,
  DeltaResult,
  RecentPR
} from '../../utils/analysis/insights';
import { getExerciseAssets, ExerciseAsset } from '../../utils/data/exerciseAssets';
import { WeightUnit } from '../../utils/storage/localStorage';
import { convertWeight } from '../../utils/format/units';
import { formatHumanReadableDate, formatRelativeDuration } from '../../utils/date/dateUtils';
import { Sparkline } from './Sparkline';
import { StreakBadge } from './StreakBadge';

export { Sparkline, StreakBadge };

export { KPICard } from './KPICard';
export { AIAnalysisCard } from './AIAnalysisCard';
export { InsightsPanel } from './InsightsPanel';
export { PlateauAlert } from './PlateauAlert';
export { RecentPRCard } from './RecentPRCard';
export { RecentPRsPanel } from './RecentPRsPanel';

// Delta Badge Component with context
const DeltaBadge: React.FC<{ delta: DeltaResult; suffix?: string; showPercent?: boolean; context?: string }> = ({
  delta,
  suffix = '',
  showPercent = true,
  context = ''
}) => {
  const { direction, formattedPercent } = delta;

  if (direction === 'same') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
        <Activity className="w-3 h-3" />
        <span className="text-[10px] font-bold">
          Stable
          {showPercent && delta.deltaPercent !== 0 ? ` (${delta.deltaPercent}%)` : ''}
        </span>
        {context && <span className="text-[9px] opacity-75">{context}</span>}
      </span>
    );
  }

  const isUp = direction === 'up';
  const colorClass = isUp ? 'text-emerald-400' : 'text-rose-400';
  const bgClass = isUp ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${bgClass} ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-bold">
        {formattedPercent}
        {suffix}
      </span>
      {context && <span className="text-[9px] opacity-75">{context}</span>}
    </span>
  );
};

// PR Status Badge
const PRStatusBadge: React.FC<{ prInsights: PRInsights }> = ({ prInsights }) => {
  const { daysSinceLastPR, prDrought } = prInsights;

  if (daysSinceLastPR < 0) {
    return (
      <span className="text-[10px] text-slate-500">Chase your first PR</span>
    );
  }

  if (prDrought) {
    return (
      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10">
        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
        <span className="text-[10px] font-bold text-amber-400 whitespace-nowrap">{daysSinceLastPR}d drought</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10">
      <Trophy className="w-3 h-3 text-emerald-400 flex-shrink-0" />
      <span className="text-[10px] font-bold text-emerald-400 whitespace-nowrap">
        {daysSinceLastPR === 0 ? 'PR today!' : `${daysSinceLastPR}d ago`}
      </span>
    </div>
  );
};

// Main KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  delta?: DeltaResult;
  deltaContext?: string;
  sparkline?: SparklinePoint[];
  sparklineColor?: string;
  badge?: React.ReactNode;
  compact?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  delta,
  deltaContext,
  sparkline,
  sparklineColor = '#3b82f6',
  badge,
  compact = false,
}) => {
  const valueClass = 'text-2xl font-bold text-white tracking-tight leading-none';

  const renderValue = () => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return (
        <CountUp
          from={0}
          to={value}
          separator=","
          direction="up"
          duration={1}
          className={valueClass}
        />
      );
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      const isPercent = trimmed.endsWith('%');
      const numericPart = isPercent ? trimmed.slice(0, -1) : trimmed;
      const parsed = Number(numericPart.replace(/,/g, ''));

      if (Number.isFinite(parsed) && numericPart.length > 0) {
        return (
          <span className={valueClass}>
            <CountUp
              from={0}
              to={parsed}
              separator=","
              direction="up"
              duration={1}
            />
            {isPercent ? '%' : ''}
          </span>
        );
      }
    }

    return <span className={valueClass}>{value}</span>;
  };

  return (
    <div className={`bg-black/70 border border-slate-700/50 rounded-xl ${compact ? 'p-3' : 'p-4'} hover:border-slate-600/50 transition-all group overflow-hidden`}>
      {/* Header row: icon + title + sparkline */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1.5 rounded-lg bg-black/50 ${iconColor} flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{title}</span>
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="flex-shrink-0">
            <Sparkline data={sparkline} color={sparklineColor} height={24} />
          </div>
        )}
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {renderValue()}
        {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
      </div>

      {/* Delta/Badge row */}
      {(delta || badge) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {delta && <DeltaBadge delta={delta} context={deltaContext} />}
          {badge}
        </div>
      )}
    </div>
  );
};

// Consistency Score Ring
const ConsistencyRing: React.FC<{ score: number; size?: number }> = ({ score, size = 40 }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--border-rgb) / 0.5)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold text-slate-200 leading-none">{score}%</span>
      </div>
    </div>
  );
};

// Local definitions of sub-components removed to favor separate file imports (PlateauAlert, RecentPRCard, RecentPRsPanel).
