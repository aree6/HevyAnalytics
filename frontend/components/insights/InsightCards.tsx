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

// Compact Alert Card for Plateaus
interface PlateauAlertProps {
  exerciseName: string;
  suggestion: string;
  weeksAtSameWeight: number;
  currentMaxWeight: number;
  lastProgressDate: Date | null;
  lastWeight: number;
  lastReps: number;
  isBodyweightLike: boolean;
  asset?: ExerciseAsset;
  weightUnit?: WeightUnit;
  now?: Date;
  onClick?: () => void;
}

const PlateauAlert: React.FC<PlateauAlertProps> = ({ 
  exerciseName, 
  suggestion, 
  weeksAtSameWeight, 
  currentMaxWeight, 
  lastProgressDate, 
  lastWeight,
  lastReps,
  isBodyweightLike,
  asset, 
  weightUnit = 'kg', 
  now,
  onClick 
}) => {
  const imgSrc = asset?.sourceType === 'video' ? asset.thumbnail : (asset?.thumbnail || asset?.source);
  const clickable = typeof onClick === 'function';

  const formatProgressMessage = (date: Date, now: Date): string => {
    const timeAgo = formatRelativeDuration(date, now);
    if (timeAgo === 'today') return 'No progress today';
    if (timeAgo === 'yesterday') return 'No progress since yesterday';
    return `No progress since ${timeAgo}`;
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left bg-amber-500/10 border border-amber-500/20 ${clickable ? 'cursor-pointer hover:bg-amber-500/15 transition-colors' : 'cursor-default'}`}
    >
      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="w-full h-full object-cover bg-white" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{exerciseName}</div>
        <div className="text-[10px] text-slate-500">
          {lastProgressDate ? formatProgressMessage(lastProgressDate, now ?? lastProgressDate) : 'No recent progress'}
        </div>
        { suggestion && (
          <div className="text-[10px] text-amber-400 mt-1 line-clamp-2 flex items-start gap-1">
            <svg width="12" height="12" viewBox="0 0 48 48" version="1" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
              <path fill="#FBC02D" d="M37,22c0-7.7-6.6-13.8-14.5-12.9c-6,0.7-10.8,5.5-11.4,11.5c-0.5,4.6,1.4,8.7,4.6,11.3 c1.4,1.2,2.3,2.9,2.3,4.8V37h12v-0.1c0-1.8,0.8-3.6,2.2-4.8C35.1,29.7,37,26.1,37,22z"/>
              <path fill="#FFF59D" d="M30.6,20.2l-3-2c-0.3-0.2-0.8-0.2-1.1,0L24,19.8l-2.4-1.6c-0.3-0.2-0.8-0.2-1.1,0l-3,2 c-0.2,0.2-0.4,0.4-0.4,0.7s0,0.6,0.2,0.8l3.8,4.7V37h2V26c0-0.2-0.1-0.4-0.2-0.6l-3.3-4.1l1.5-1l2.4,1.6c0.3,0.2,0.8,0.2,1.1,0 l2.4-1.6l1.5,1l-3.3,4.1C25.1,25.6,25,25.8,25,26v11h2V26.4l3.8-4.7c0.2-0.2,0.3-0.5,0.2-0.8S30.8,20.3,30.6,20.2z"/>
              <circle fill="#5C6BC0" cx="24" cy="44" r="3"/>
              <path fill="#9FA8DA" d="M26,45h-4c-2.2,0-4-1.8-4-4v-5h12v5C30,43.2,28.2,45,26,45z"/>
              <g fill="#5C6BC0">
                <path d="M30,41l-11.6,1.6c0.3,0.7,0.9,1.4,1.6,1.8l9.4-1.3C29.8,42.5,30,41.8,30,41z"/>
                <polygon points="18,38.7 18,40.7 30,39 30,37"/>
              </g>
            </svg>
            <span>{suggestion}</span>
          </div>
        )}
      </div>
      <div className="text-right">
        {isBodyweightLike ? (
          <>
            <div className="text-sm font-bold text-white">{lastReps} reps</div>
            <div className="text-[10px] text-slate-500">Bodyweight</div>
          </>
        ) : (
          <>
            <div className="text-sm font-bold text-white">{convertWeight(lastWeight, weightUnit)}{weightUnit}</div>
            <div className="text-[10px] text-slate-500">×{lastReps} reps</div>
          </>
        )}
      </div>
    </button>
  );
};

// Recent PR Card with image and improvement
interface RecentPRCardProps {
  pr: RecentPR;
  isLatest?: boolean;
  asset?: ExerciseAsset;
  weightUnit?: WeightUnit;
  now?: Date;
  onExerciseClick?: (exerciseName: string) => void;
}

const RecentPRCard: React.FC<RecentPRCardProps> = ({ pr, isLatest, asset, weightUnit = 'kg', now, onExerciseClick }) => {
  const { exercise, weight, reps, date, improvement } = pr;
  const imgSrc = asset?.sourceType === 'video' ? asset.thumbnail : (asset?.thumbnail || asset?.source);
  const clickable = typeof onExerciseClick === 'function';
  
  return (
    <button
      type="button"
      onClick={() => onExerciseClick?.(exercise)}
      disabled={!clickable}
      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${isLatest ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-black/50'} ${clickable ? 'cursor-pointer hover:bg-black/60 transition-colors' : 'cursor-default'}`}
    >
      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="w-full h-full object-cover bg-white" loading="lazy" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isLatest ? 'bg-emerald-500/20' : 'bg-black/50'}`}>
            <Dumbbell className={`w-5 h-5 ${isLatest ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[color:var(--text-primary)] truncate">{exercise}</div>
        <div className="text-[10px] text-slate-500">{formatHumanReadableDate(date, { now })}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-[color:var(--text-primary)]">{convertWeight(weight, weightUnit)}{weightUnit}</div>
        {improvement > 0 ? (
          <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-0.5">
            <TrendingUp className="w-3 h-3" />+{convertWeight(improvement, weightUnit)}{weightUnit}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500">×{reps}</div>
        )}
      </div>
    </button>
  );
};

// Recent PRs Timeline Panel
interface RecentPRsPanelProps {
  prInsights: PRInsights;
  weightUnit?: WeightUnit;
  now?: Date;
  onExerciseClick?: (exerciseName: string) => void;
}

const RecentPRsPanel: React.FC<RecentPRsPanelProps> = memo(function RecentPRsPanel({ prInsights, weightUnit = 'kg', now, onExerciseClick }) {
  const { recentPRs, daysSinceLastPR, prDrought, prFrequency } = prInsights;
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset> | null>(null);

  useEffect(() => {
    getExerciseAssets().then(setAssetsMap).catch(() => setAssetsMap(new Map()));
  }, []);

  if (recentPRs.length === 0) return null;

  // Show up to 5 PRs
  const displayPRs = recentPRs.slice(0, 5);

  return (
    <div className="bg-black/70 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-sm font-semibold text-white">Recent PRs</span>
        </div>
        <div className="flex items-center gap-3">
          {prFrequency > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
              ~{prFrequency}/week
            </span>
          )}
          {prDrought && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
              {daysSinceLastPR}d drought
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="flex gap-2" style={{ minWidth: 'min-content' }}>
          {displayPRs.map((pr, idx) => (
            <div key={`${pr.exercise}-${pr.date.getTime()}`} className="min-w-[220px] flex-shrink-0">
              <RecentPRCard
                pr={pr}
                isLatest={idx === 0}
                asset={assetsMap?.get(pr.exercise)}
                weightUnit={weightUnit}
                now={now}
                onExerciseClick={onExerciseClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
