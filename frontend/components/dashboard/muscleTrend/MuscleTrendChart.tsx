import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { normalizeMuscleGroup } from '../../../utils/muscle/analytics';
import { MUSCLE_COLORS, INDIVIDUAL_MUSCLE_COLORS } from '../../../utils/domain/categories';
import { LazyRender } from '../../ui/LazyRender';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { getRechartsCategoricalTicks, RECHARTS_XAXIS_PADDING } from '../../../utils/chart/chartEnhancements';

type MuscleGrouping = 'groups' | 'muscles';
type MusclePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
type MuscleTrendView = 'area' | 'stackedBar';

interface MuscleTrendChartProps {
  trendData: any[];
  trendKeys: string[];
  muscleGrouping: MuscleGrouping;
  musclePeriod: MusclePeriod;
  muscleTrendView: MuscleTrendView;
  tooltipStyle: Record<string, unknown>;
}

const getTrendColor = (key: string, muscleGrouping: MuscleGrouping) => {
  if (muscleGrouping === 'groups') {
    return (MUSCLE_COLORS as any)[key] || '#94a3b8';
  }
  const muscleKey = key.toLowerCase();
  return INDIVIDUAL_MUSCLE_COLORS[muscleKey] || (MUSCLE_COLORS as any)[normalizeMuscleGroup(key)] || '#94a3b8';
};

export const MuscleTrendChart: React.FC<MuscleTrendChartProps> = ({
  trendData,
  trendKeys,
  muscleGrouping,
  musclePeriod,
  muscleTrendView,
  tooltipStyle,
}) => {
  const xTicks = useMemo(() => {
    return getRechartsCategoricalTicks(trendData, (row: any) => row?.dateFormatted);
  }, [trendData]);

  if (trendData.length === 0 || trendKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
        Not enough data to render Muscle Analysis trend.
      </div>
    );
  }

  return (
    <LazyRender className="w-full" placeholder={<ChartSkeleton style={{ height: 280 }} />}>
      <ResponsiveContainer width="100%" height={280}>
        {muscleTrendView === 'area' ? (
          <AreaChart key={`area-${musclePeriod}-${muscleGrouping}`} data={trendData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="dateFormatted"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              padding={RECHARTS_XAXIS_PADDING as any}
              interval={0}
              ticks={xTicks as any}
            />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle as any} />
            <Legend wrapperStyle={{ fontSize: '11px', left: '52%', transform: 'translateX(-50%)', position: 'absolute' }} />
            {trendKeys.map((k) => {
              const color = getTrendColor(k, muscleGrouping);
              return (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={k}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.25}
                  animationDuration={1200}
                />
              );
            })}
          </AreaChart>
        ) : (
          <BarChart key={`bar-${musclePeriod}-${muscleGrouping}`} data={trendData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="dateFormatted"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              padding={RECHARTS_XAXIS_PADDING as any}
              interval={0}
              ticks={xTicks as any}
            />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle as any} cursor={{ fill: 'rgb(var(--overlay-rgb) / 0.12)' }} />
            <Legend wrapperStyle={{ fontSize: '11px', left: '52%', transform: 'translateX(-50%)', position: 'absolute' }} />
            {trendKeys.map((k, idx) => {
              const color = getTrendColor(k, muscleGrouping);
              return (
                <Bar
                  key={k}
                  dataKey={k}
                  name={k}
                  stackId="1"
                  fill={color}
                  radius={idx === trendKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  animationDuration={1200}
                />
              );
            })}
          </BarChart>
        )}
      </ResponsiveContainer>
    </LazyRender>
  );
};
