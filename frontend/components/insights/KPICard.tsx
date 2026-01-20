import React from 'react';

import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

import CountUp from '../ui/CountUp';
import type { DeltaResult, SparklinePoint } from '../../utils/analysis/insights';
import { Sparkline } from './Sparkline';

// Delta Badge Component with context
const DeltaBadge: React.FC<{ delta: DeltaResult; suffix?: string; showPercent?: boolean; context?: string }> = ({
  delta,
  suffix = '',
  showPercent = true,
  context = '',
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

export const KPICard: React.FC<KPICardProps> = ({
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
            <CountUp from={0} to={parsed} separator="," direction="up" duration={1} />
            {isPercent ? '%' : ''}
          </span>
        );
      }
    }

    return <span className={valueClass}>{value}</span>;
  };

  return (
    <div
      className={`bg-black/70 border border-slate-700/50 rounded-xl ${compact ? 'p-3' : 'p-4'} hover:border-slate-600/50 transition-all group overflow-hidden`}
    >
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

      <div className="flex items-baseline gap-2 flex-wrap">
        {renderValue()}
        {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
      </div>

      {(delta || badge) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {delta && <DeltaBadge delta={delta} context={deltaContext} />}
          {badge}
        </div>
      )}
    </div>
  );
};
