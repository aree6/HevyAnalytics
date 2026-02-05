import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { LazyRender } from '../../ui/LazyRender';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { CHART_TOOLTIP_STYLE } from '../../../utils/ui/uiConstants';
import { formatNumber } from '../../../utils/format/formatters';
import { getRechartsXAxisInterval, RECHARTS_XAXIS_PADDING } from '../../../utils/chart/chartEnhancements';
import { QUICK_FILTER_LABELS, HEADLESS_MUSCLE_NAMES } from '../../../utils/muscle/mapping';
import { SVG_MUSCLE_NAMES } from '../../../utils/muscle/mapping';
import type { WeeklySetsWindow } from '../../../utils/muscle/analytics';
import type { QuickFilterCategory } from '../hooks/useMuscleSelection';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import type { ExerciseMuscleData } from '../../../utils/muscle/mapping';
import { MuscleAnalysisExerciseList } from './MuscleAnalysisExerciseList';

interface MuscleAnalysisDetailPanelProps {
  activeQuickFilter: QuickFilterCategory | null;
  selectedMuscle: string | null;
  viewMode: 'muscle' | 'group' | 'headless';
  weeklySetsWindow: WeeklySetsWindow;
  weeklySetsSummary: number | null;
  volumeDelta: { direction: 'up' | 'down' | 'same'; formattedPercent: string } | null;
  trendData: Array<{ period: string; sets: number }>;
  windowedSelectionBreakdown: { totalSetsInWindow: number } | null;
  contributingExercises: Array<{ name: string; sets: number; primarySets: number; secondarySets: number }>;
  assetsMap: Map<string, ExerciseAsset> | null;
  exerciseMuscleData: Map<string, ExerciseMuscleData>;
  onExerciseClick?: (exerciseName: string) => void;
  clearSelection: () => void;
}

export const MuscleAnalysisDetailPanel: React.FC<MuscleAnalysisDetailPanelProps> = ({
  activeQuickFilter,
  selectedMuscle,
  viewMode,
  weeklySetsWindow,
  weeklySetsSummary,
  volumeDelta,
  trendData,
  windowedSelectionBreakdown,
  contributingExercises,
  assetsMap,
  exerciseMuscleData,
  onExerciseClick,
  clearSelection,
}) => {
  const title = activeQuickFilter
    ? QUICK_FILTER_LABELS[activeQuickFilter]
    : selectedMuscle
      ? (viewMode === 'group'
        ? selectedMuscle
        : viewMode === 'headless'
          ? ((HEADLESS_MUSCLE_NAMES as any)[selectedMuscle] ?? selectedMuscle)
          : SVG_MUSCLE_NAMES[selectedMuscle])
      : (viewMode === 'group' ? 'All Groups' : viewMode === 'headless' ? 'All Muscles' : 'All Muscles');

  const totalSetsInWindow = windowedSelectionBreakdown?.totalSetsInWindow ?? 0;

  return (
    <div className="bg-black/70 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col h-[70vh] lg:h-0 lg:min-h-full">
      <div className="bg-black/70 border-b border-slate-800/50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h2 className="text-lg font-bold text-white truncate">{title}</h2>
          <span
            className="text-red-400 text-sm font-semibold whitespace-nowrap"
            title={activeQuickFilter || selectedMuscle ? 'sets in current filter' : ''}
          >
            {activeQuickFilter || selectedMuscle
              ? `${Math.round(totalSetsInWindow * 10) / 10} sets`
              : null}
          </span>
          <span
            className="text-cyan-400 text-sm font-semibold whitespace-nowrap"
            title="avg weekly sets in selected window"
          >
            {weeklySetsSummary !== null && `${weeklySetsSummary.toFixed(1)} sets/wk`}
          </span>
          {volumeDelta && volumeDelta.direction !== 'same' && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${volumeDelta.direction === 'up'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
              }`}>
              {volumeDelta.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {volumeDelta.formattedPercent} vs prev {weeklySetsWindow === '7d' ? 'wk' : weeklySetsWindow === '30d' ? 'mo' : 'yr'}
            </span>
          )}
        </div>
        {(selectedMuscle || activeQuickFilter) && (
          <button
            onClick={clearSelection}
            className="p-1.5 hover:bg-black/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">Weekly sets</h3>
            </div>
          </div>
          <div className="h-32 bg-black/50 rounded-lg p-2">
            {trendData.length > 0 ? (
              <LazyRender className="w-full h-full" placeholder={<ChartSkeleton className="h-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="muscleColorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={volumeDelta?.direction === 'down' ? '#f43f5e' : '#10b981'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={volumeDelta?.direction === 'down' ? '#f43f5e' : '#10b981'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="period"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      padding={RECHARTS_XAXIS_PADDING as any}
                      interval={getRechartsXAxisInterval(trendData.length, 7)}
                    />
                    <YAxis hide />
                    <RechartsTooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      labelStyle={{ color: 'var(--text-primary)' }}
                      formatter={(value: number) => {
                        const v = formatNumber(Number(value), { maxDecimals: 1 });
                        return [`${v} sets/wk`];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sets"
                      stroke={volumeDelta?.direction === 'down' ? '#f43f5e' : '#10b981'}
                      strokeWidth={2}
                      fill="url(#muscleColorGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </LazyRender>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No muscle data for this period yet
              </div>
            )}
          </div>
        </div>
      </div>

      {windowedSelectionBreakdown && (
        <div className="border-t border-slate-800/30 flex-1 flex flex-col min-h-0">
          <MuscleAnalysisExerciseList
            contributingExercises={contributingExercises}
            assetsMap={assetsMap}
            exerciseMuscleData={exerciseMuscleData}
            totalSetsInWindow={totalSetsInWindow}
            onExerciseClick={onExerciseClick}
          />
        </div>
      )}
    </div>
  );
};
