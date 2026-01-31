
import React, { memo } from 'react';

import { AlertTriangle, Calendar, Dumbbell, Trophy } from 'lucide-react';

import type { DashboardInsights, PRInsights } from '../../utils/analysis/insights';
import { AIAnalysisCard } from './AIAnalysisCard';
import { KPICard } from './KPICard';
import { useIsMobile } from './useIsMobile';

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

// Main Insights Panel Component
interface InsightsPanelProps {
  insights: DashboardInsights;
  totalWorkouts: number;
  totalSets: number;
  totalPRs: number;
  // AI Analysis props
  onAIAnalyze?: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = memo(function InsightsPanel(props) {
  const {
    insights,
    totalWorkouts,
    totalSets,
    totalPRs,
    onAIAnalyze,
  } = props;
  const { rolling7d, streakInfo, prInsights, volumeSparkline, workoutSparkline, prSparkline, setsSparkline, consistencySparkline } = insights;

  // Only show AI Analysis card on mobile (hidden on desktop where it's in the header)
  const isMobile = useIsMobile();
  const showAICard = onAIAnalyze && isMobile;

  return (
    <div className={`grid gap-2 sm:gap-3 ${showAICard ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {/* Workouts */}
      <KPICard
        title="Last 7d"
        value={rolling7d.current.totalWorkouts}
        subtitle="workouts"
        icon={Calendar}
        iconColor="text-blue-400"
        delta={rolling7d.workouts ?? undefined}
        deltaContext="vs prev 7d"
        sparkline={workoutSparkline}
        sparklineColor="#3b82f6"
      />

      {/* Sets This Week */}
      <KPICard
        title="Sets"
        value={rolling7d.current.totalSets}
        subtitle="last 7d"
        icon={Dumbbell}
        iconColor="text-purple-400"
        delta={rolling7d.sets ?? undefined}
        deltaContext="vs prev 7d"
        sparkline={setsSparkline}
        sparklineColor="#a855f7"
      />

      {/* PRs */}
      <KPICard
        title="PRs"
        value={totalPRs}
        subtitle="total"
        icon={Trophy}
        iconColor="text-yellow-400"
        sparkline={prSparkline}
        sparklineColor="#eab308"
        badge={<PRStatusBadge prInsights={prInsights} />}
      />

      {/* AI Analysis Card - Mobile Only */}
      {showAICard && onAIAnalyze && (
        <AIAnalysisCard onAIAnalyze={onAIAnalyze} />
      )}
    </div>
  );
});

