import React, { useRef, useState, useEffect, useMemo } from 'react';

import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

import CountUp from '../ui/CountUp';
import { Reveal } from '../ui/Reveal';
import type { DeltaResult, SparklinePoint } from '../../utils/analysis/insights';
import { Sparkline } from './Sparkline';

function trendColor(
  delta: DeltaResult | undefined,
  sparkline: SparklinePoint[] | undefined,
): string {
  let direction: 'up' | 'down' | 'same' = 'same';

  if (sparkline && sparkline.length >= 2) {
    const first = sparkline[0].value;
    const last = sparkline[sparkline.length - 1].value;
    const threshold = Math.max(Math.abs(first), Math.abs(last), 1) * 0.05;
    if (last > first + threshold) direction = 'up';
    else if (last < first - threshold) direction = 'down';
  } else if (delta) {
    const d = delta.direction;
    direction = (d === 'up' || d === 'down' || d === 'same') ? d : 'same';
  }

  if (direction === 'up') return '#22c55e';
  if (direction === 'down') return '#ef4444';
  return '#3b82f6';
}

// Delta Badge Component with context
const DeltaBadge: React.FC<{ delta: DeltaResult; suffix?: string; showPercent?: boolean; context?: string }> = ({
  delta,
  suffix = '',
  showPercent = true,
  context = '',
}) => {
  const { direction, formattedPercent } = delta;

  // Guard against malformed delta objects that would render an empty-looking badge
  const validDirections: Array<'up' | 'down' | 'same'> = ['up', 'down', 'same'];
  const safeDirection = validDirections.includes(direction) ? direction : 'same';
  const safeFormattedPercent = typeof formattedPercent === 'string' && formattedPercent.length > 0
    ? formattedPercent
    : `${delta.deltaPercent ?? 0}%`;

  if (safeDirection === 'same') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
        <Activity className="w-3 h-3" />
        <span className="text-[11px] sm:text-xs font-semibold">
          Stable
          {showPercent && delta.deltaPercent !== 0 ? ` (${delta.deltaPercent}%)` : ''}
        </span>
        {context && <span className="text-[10px] opacity-75">{context}</span>}
      </span>
    );
  }

  const isUp = safeDirection === 'up';
  const colorClass = isUp ? 'text-emerald-400' : 'text-rose-400';
  const bgClass = isUp ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20';
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${bgClass} ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[11px] sm:text-xs font-semibold">
        {safeFormattedPercent}
        {suffix}
      </span>
      {context && <span className="text-[10px] opacity-75">{context}</span>}
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
  sparklineTitle?: string;
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
  sparklineColor,
  sparklineTitle,
  badge,
  compact = false,
}) => {
  const sparklineRef = useRef<HTMLDivElement>(null);
  const [sparklineWidth, setSparklineWidth] = useState(60);

  useEffect(() => {
    const el = sparklineRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSparklineWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effectiveSparklineColor = useMemo(
    () => trendColor(delta, sparkline),
    [delta, sparkline],
  );

  const valueClass = 'text-2xl font-bold text-white tracking-tight leading-none';

  const getCompact = (num: number): { value: number; suffix: string } | null => {
    if (num >= 1_000_000_000) return { value: Math.round((num / 1_000_000_000) * 10) / 10, suffix: 'B' };
    if (num >= 1_000_000) return { value: Math.round((num / 1_000_000) * 10) / 10, suffix: 'M' };
    if (num >= 1_000) return { value: Math.round((num / 1_000) * 10) / 10, suffix: 'K' };
    return null;
  };

  const renderValue = () => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const compact = getCompact(value);
      if (compact) {
        return (
          <span className={valueClass}>
            <CountUp from={0} to={compact.value} direction="up" duration={2} />
            {compact.suffix}
          </span>
        );
      }
      return (
        <CountUp
          from={0}
          to={value}
          separator="," 
          direction="up"
          duration={2}
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
            <CountUp from={0} to={parsed} separator="," direction="up" duration={2} />
            {isPercent ? '%' : ''}
          </span>
        );
      }
    }

    return <span className={valueClass}>{value}</span>;
  };

  return (
    <Reveal
      className={`bg-black/20 border border-slate-700/50 rounded-xl ${compact ? 'p-3' : 'p-4'} hover:border-slate-600/50 transition-colors group overflow-hidden`}
      style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.7)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1.5 rounded-lg bg-black/20 ${iconColor} flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{title}</span>
        </div>
        {(delta || badge) && (
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            {delta && <span className="hidden sm:contents"><DeltaBadge delta={delta} context={deltaContext} /></span>}
            {badge}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        {renderValue()}
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div ref={sparklineRef} className="mt-2 px-2 md:px-20 lg:px-24 mb-[-16px]">
          <Sparkline
            data={sparkline}
            color={effectiveSparklineColor}
            height={60}
            width={sparklineWidth}
            title={sparklineTitle}
          />
        </div>
      )}
    </Reveal>
  );
};
