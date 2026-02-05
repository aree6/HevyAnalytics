import React, { useMemo, useState } from 'react';
import { Repeat2, Target } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { FANCY_FONT, RADAR_TICK_FILL } from '../../../utils/ui/uiConstants';
import { type NormalizedMuscleGroup } from '../../../utils/muscle/analytics';
import { BodyMap, type BodyMapGender } from '../../bodyMap/BodyMap';
import { getHeadlessRadarSeries } from '../../../utils/muscle/mapping';

// ============================================================================
// CARD 6: Muscle Focus Card - Radar chart style
// ============================================================================
export const MuscleFocusCard: React.FC<{
  muscleData: { group: NormalizedMuscleGroup; sets: number }[];
  headlessHeatmap: { volumes: Map<string, number>; maxVolume: number };
  theme: CardTheme;
  gender?: BodyMapGender;
}> = ({ muscleData, headlessHeatmap, theme, gender = 'male' }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';

  const [showHeatmap, setShowHeatmap] = useState(true);

  const radarData = useMemo(() => getHeadlessRadarSeries(headlessHeatmap.volumes), [headlessHeatmap.volumes]);

  const topMuscles = useMemo(() => {
    const sorted = [...radarData].filter((d) => (d.value ?? 0) > 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return sorted.slice(0, 3).map((d) => d.subject);
  }, [radarData]);

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
      border: `1px solid ${isDark ? 'rgba(71,85,105,0.5)' : 'rgba(226,232,240,0.8)'}`,
      borderRadius: '8px',
      padding: '8px 12px',
    }),
    [isDark]
  );

  return (
    <FlexCard theme={theme} className="min-h-[500px] flex flex-col">
      <div className="relative z-[1] pt-6 px-6 pb-14 flex flex-col items-center text-center flex-1">
        <div className="w-full flex items-center justify-between mb-5">
          <div className={`${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-2`}>
            <Target className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Muscle Focus</span>
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowHeatmap((v) => !v);
            }}
            className={`p-2 rounded-full border transition-all ${isDark
                ? 'bg-black/30 border-slate-700/50 text-slate-200 hover:border-slate-600'
                : 'bg-white/70 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            title="Flip view"
          >
            <Repeat2 className="w-4 h-4" />
          </button>
        </div>

        <h2 className={`text-2xl sm:text-3xl font-bold ${textPrimary} mb-6 text-center`} style={FANCY_FONT}>
          You worked mainly on
        </h2>

        {!showHeatmap ? (
          radarData.some((d) => (d.value ?? 0) > 0) ? (
            <div className="w-full max-w-[280px] h-[220px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke={isDark ? '#334155' : '#cbd5e1'} />
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
                          <text
                            fill={RADAR_TICK_FILL}
                            fontSize={10}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {label}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="Sets"
                    dataKey="value"
                    stroke={isDark ? '#06b6d4' : '#0891b2'}
                    strokeWidth={2}
                    fill={isDark ? '#06b6d4' : '#0891b2'}
                    fillOpacity={0.35}
                    animationDuration={1500}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [Number(value).toFixed(1), 'Sets/wk']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={`flex items-center justify-center min-h-[220px] text-xs rounded-lg border border-dashed ${isDark ? 'text-slate-500 border-slate-800' : 'text-slate-500 border-slate-300'}`}>
              No muscle data yet.
            </div>
          )
        ) : (
          <div className="w-full flex justify-center mb-8">
            <div className="h-44 sm:h-56 flex items-center justify-center">
              <BodyMap
                onPartClick={() => { }}
                selectedPart={null}
                muscleVolumes={headlessHeatmap.volumes}
                maxVolume={headlessHeatmap.maxVolume}
                compact
                compactFill
                viewMode="headless"
                gender={gender}
              />
            </div>
          </div>
        )}

        <div className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} style={FANCY_FONT}>
          {topMuscles.length > 0 ? topMuscles.join(', ') : 'All muscles'}
        </div>
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
