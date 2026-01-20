import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatSignedNumber } from '../../utils/format/formatters';

export const DeltaBadge: React.FC<{ delta: number; suffix?: string; invert?: boolean; size?: 'default' | 'compact' }> = ({
  delta,
  suffix = '',
  invert = false,
  size = 'default',
}) => {
  if (delta === 0) return null;

  const isPositive = invert ? delta < 0 : delta > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10';
  const text = formatSignedNumber(delta, { maxDecimals: 2 });

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold ${colorClass} ${
        size === 'compact' ? 'scale-90 origin-left' : ''
      }`}
    >
      <Icon className="w-2.5 h-2.5" />
      {text}
      {suffix}
    </span>
  );
};

export const ConfidenceBadge: React.FC<{ confidence?: 'low' | 'medium' | 'high' }> = ({ confidence }) => {
  if (!confidence) return null;

  const meta = (() => {
    switch (confidence) {
      case 'high':
        return {
          label: 'High confidence',
          cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'medium':
        return {
          label: 'Medium confidence',
          cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
      case 'low':
      default:
        return {
          label: 'Low confidence',
          cls: 'bg-slate-700/20 text-slate-400 border-slate-700/30',
        };
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold whitespace-nowrap ${meta.cls}`}
      title="Confidence reflects how consistent/recent your logged sessions are for this exercise."
      aria-label={meta.label}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
};
