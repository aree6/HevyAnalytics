import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LazyRender } from '../../ui/LazyRender';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { getRechartsXAxisInterval, RECHARTS_XAXIS_PADDING } from '../../../utils/chart/chartEnhancements';

interface TopExercisesAreaViewProps {
  topExercisesOverTimeData: any[];
  topExerciseNames: string[];
  pieColors: string[];
  tooltipStyle: Record<string, unknown>;
}

export const TopExercisesAreaView: React.FC<TopExercisesAreaViewProps> = ({
  topExercisesOverTimeData,
  topExerciseNames,
  pieColors,
  tooltipStyle,
}) => {
  if (topExercisesOverTimeData.length === 0 || topExerciseNames.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
        Not enough data to render Most Frequent Exercises area view.
      </div>
    );
  }

  return (
    <LazyRender className="w-full" placeholder={<ChartSkeleton style={{ height: 320 }} />}>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={topExercisesOverTimeData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            padding={RECHARTS_XAXIS_PADDING as any}
            interval={getRechartsXAxisInterval(topExercisesOverTimeData.length)}
          />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle as any} />
          <Legend wrapperStyle={{ fontSize: '11px', left: '52%', transform: 'translateX(-50%)', position: 'absolute' }} />
          {topExerciseNames.map((exerciseName, idx) => (
            <Area
              key={exerciseName}
              type="monotone"
              dataKey={exerciseName}
              name={exerciseName}
              stackId="1"
              stroke={pieColors[idx % pieColors.length]}
              fill={pieColors[idx % pieColors.length]}
              fillOpacity={0.25}
              animationDuration={1200}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </LazyRender>
  );
};
