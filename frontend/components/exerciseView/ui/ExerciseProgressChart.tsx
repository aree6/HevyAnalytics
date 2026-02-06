import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Infinity } from 'lucide-react';
import { ExerciseStats } from '../../../types';
import { LazyRender } from '../../ui/LazyRender';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { formatNumber } from '../../../utils/format/formatters';
import { RECHARTS_XAXIS_PADDING } from '../../../utils/chart/chartEnhancements';
import type { ExerciseSessionEntry } from '../../../utils/analysis/exerciseTrend';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import { CustomTooltip } from './ExerciseChartTooltip';
import { StrengthProgressionValueDot } from './StrengthProgressionValueDot';

interface ExerciseProgressChartProps {
  selectedStats: ExerciseStats;
  selectedSessions: ExerciseSessionEntry[];
  chartData: any[];
  viewMode: 'all' | 'weekly' | 'monthly' | 'yearly';
  setViewMode: (mode: 'all' | 'weekly' | 'monthly' | 'yearly') => void;
  allAggregationMode: 'daily' | 'weekly' | 'monthly';
  weightUnit: WeightUnit;
  isBodyweightLike: boolean;
  showUnilateral: boolean;
  setShowUnilateral: (show: boolean) => void;
  hasUnilateralChartData: boolean;
  sessionsCount: number;
  xTicks: any;
  tickIndexMap: Record<number, boolean>;
}

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({
  selectedStats,
  selectedSessions,
  chartData,
  viewMode,
  setViewMode,
  allAggregationMode,
  weightUnit,
  isBodyweightLike,
  showUnilateral,
  setShowUnilateral,
  hasUnilateralChartData,
  sessionsCount,
  xTicks,
  tickIndexMap,
}) => {
  if (!selectedStats) return null;

  return (
    <div className="w-full bg-black/70 border border-slate-700/50 rounded-2xl p-4 sm:p-6 relative flex flex-col h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 sm:mb-6 gap-2 shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">{isBodyweightLike ? 'Reps Progression' : 'Strength Progression'}</h3>
          <p className="text-[11px] sm:text-xs text-slate-500">{isBodyweightLike ? 'Top reps vs sets' : 'Estimated 1RM vs Actual Lift Weight'}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1.5 min-h-8 bg-black/70 border border-slate-700/50 rounded-lg">
              <Activity className="w-3 h-3 text-slate-400" />
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-white font-bold">{sessionsCount}</span>
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">Sessions</span>
              </div>
            </div>
          </div>
          {isBodyweightLike ? (
            <>
              <div className="flex items-center gap-2 text-blue-400">
                <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500"></span> Top reps
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-500"></span> Sets
              </div>
            </>
          ) : showUnilateral && hasUnilateralChartData ? (
            <>
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-500"></span> Left
              </div>
              <div className="flex items-center gap-2 text-violet-400">
                <span className="w-2.5 h-2.5 rounded bg-violet-500/20 border border-violet-500"></span> Right
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-blue-400">
                <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500"></span> Est. 1RM
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-500"></span> Lift Weight
              </div>
            </>
          )}

          {hasUnilateralChartData && !isBodyweightLike && (
            <button
              onClick={() => setShowUnilateral(!showUnilateral)}
              title={showUnilateral ? 'Hide L/R split' : 'Show L/R split'}
              aria-label={showUnilateral ? 'Hide L/R split' : 'Show L/R split'}
              className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 ${showUnilateral
                ? 'bg-blue-600 text-white border-transparent'
                : 'text-slate-500 hover:text-slate-300 hover:bg-black/60 border border-slate-700/50'
                }`}
            >
              L / R
            </button>
          )}

          <div className="bg-black/70 p-1 rounded-lg flex gap-1 border border-slate-700/50">
            <button
              onClick={() => setViewMode('all')}
              title="All"
              aria-label="All"
              className={`px-2 py-1 rounded text-[10px] font-bold ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
            >
              <Infinity className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              title="Last Week"
              aria-label="Last Week"
              className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap ${viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
            >
              lst wk
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              title="Last Month"
              aria-label="Last Month"
              className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap ${viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
            >
              lst mo
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              title="Last Year"
              aria-label="Last Year"
              className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap ${viewMode === 'yearly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
            >
              lst yr
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 min-h-0">
        {chartData.length === 0 ? (
          <div className="w-full h-full min-h-[260px] flex items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg px-4 sm:px-0 text-center">
            Building history — log a few more sessions to see Strength Progression.
          </div>
        ) : (
          <LazyRender className="w-full h-full" placeholder={<ChartSkeleton className="h-full min-h-[260px]" />}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                key={`${selectedStats.name}:${viewMode}:${allAggregationMode}:${weightUnit}:${showUnilateral}`}
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeftRM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRightRM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-rgb) / 0.35)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  animationDuration={1000}
                  padding={RECHARTS_XAXIS_PADDING as any}
                  interval={0}
                  ticks={xTicks as any}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    isBodyweightLike
                      ? `${formatNumber(Number(val), { maxDecimals: 0 })}`
                      : `${formatNumber(Number(val), { maxDecimals: 1 })}${weightUnit}`
                  }
                />
                <Tooltip
                  content={<CustomTooltip weightUnit={weightUnit} hasUnilateralData={hasUnilateralChartData} showUnilateral={showUnilateral} />}
                  cursor={{ stroke: 'rgb(var(--border-rgb) / 0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                {(!showUnilateral || !hasUnilateralChartData) ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey={isBodyweightLike ? 'reps' : 'oneRepMax'}
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#color1RM)"
                      dot={<StrengthProgressionValueDot
                        valueKey={isBodyweightLike ? 'reps' : 'oneRepMax'}
                        unit={isBodyweightLike ? undefined : weightUnit}
                        data={chartData}
                        color="#3b82f6"
                        showAtIndexMap={tickIndexMap}
                        showDotWhenHidden={true}
                        isBodyweightLike={isBodyweightLike}
                        selectedSessions={selectedSessions}
                        selectedStats={selectedStats}
                        weightUnit={weightUnit}
                        prTypesToShow={['oneRm']}
                      />}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    <Line
                      type="monotone"
                      dataKey={isBodyweightLike ? 'reps' : 'weight'}
                      stroke="transparent"
                      strokeWidth={0}
                      dot={<StrengthProgressionValueDot
                        valueKey={isBodyweightLike ? 'reps' : 'weight'}
                        unit={isBodyweightLike ? undefined : weightUnit}
                        data={chartData}
                        color="var(--text-muted)"
                        showAtIndexMap={tickIndexMap}
                        showDotWhenHidden={false}
                        isBodyweightLike={isBodyweightLike}
                        selectedSessions={selectedSessions}
                        selectedStats={selectedStats}
                        weightUnit={weightUnit}
                        prTypesToShow={['weight', 'volume']}
                      />}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                  </>
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey={isBodyweightLike ? 'leftReps' : 'leftOneRepMax'}
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fill="url(#colorLeftRM)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#06b6d4' }}
                      isAnimationActive={true}
                      animationDuration={1000}
                      name="Left"
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey={isBodyweightLike ? 'rightReps' : 'rightOneRepMax'}
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#colorRightRM)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }}
                      isAnimationActive={true}
                      animationDuration={1000}
                      name="Right"
                      connectNulls
                    />
                  </>
                )}

                <Line
                  type="stepAfter"
                  dataKey={isBodyweightLike ? 'sets' : 'weight'}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </LazyRender>
        )}
      </div>
    </div>
  );
};
