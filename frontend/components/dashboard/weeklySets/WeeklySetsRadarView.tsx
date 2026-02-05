import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RADAR_TICK_FILL } from '../../../utils/ui/uiConstants';
import { LazyRender } from '../../ui/LazyRender';
import { ChartSkeleton } from '../../ui/ChartSkeleton';

interface RadarDatum {
  subject?: string;
  value?: number;
}

interface WeeklySetsRadarViewProps {
  radarData: RadarDatum[];
  tooltipStyle: Record<string, unknown>;
}

export const WeeklySetsRadarView: React.FC<WeeklySetsRadarViewProps> = ({ radarData, tooltipStyle }) => {
  const hasData = radarData.some((d) => (d.value ?? 0) > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
        No muscle composition for this period yet.
      </div>
    );
  }

  return (
    <LazyRender className="w-full" placeholder={<ChartSkeleton style={{ height: 300 }} />}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            tick={({ payload, x, y, index, cx, cy }: { payload?: { subject?: string }; x?: number; y?: number; index?: number; cx?: number; cy?: number }) => {
              const label = radarData[index ?? 0]?.subject ?? payload?.subject ?? '';
              const px = x ?? 0;
              const py = y ?? 0;
              const outward = 1.18;
              const tx = cx != null && cy != null ? cx + (px - cx) * outward : px;
              const ty = cx != null && cy != null ? cy + (py - cy) * outward : py;
              return (
                <g transform={`translate(${tx},${ty})`}>
                  <text fill={RADAR_TICK_FILL} fontSize={11} textAnchor="middle" dominantBaseline="middle">
                    {label}
                  </text>
                </g>
              );
            }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="Weekly Sets"
            dataKey="value"
            stroke="#06b6d4"
            strokeWidth={3}
            fill="#06b6d4"
            fillOpacity={0.35}
            animationDuration={1500}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${Number(value).toFixed(1)} sets/wk`]} />
        </RadarChart>
      </ResponsiveContainer>
    </LazyRender>
  );
};
