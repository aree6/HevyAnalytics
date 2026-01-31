import React, { useMemo, useState } from 'react';
import { Repeat2, Target } from 'lucide-react';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { FANCY_FONT } from '../../utils/ui/uiConstants';
import { type NormalizedMuscleGroup } from '../../utils/muscle/muscleNormalization';
import { BodyMap, type BodyMapGender } from '../bodyMap/BodyMap';
import { HEADLESS_MUSCLE_NAMES } from '../../utils/muscle/muscleMappingConstants';

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

  const topMuscles = useMemo(() => {
    const pairs = Array.from(headlessHeatmap.volumes.entries());
    pairs.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    return pairs
      .slice(0, 3)
      .map(([id]) => (HEADLESS_MUSCLE_NAMES as any)[id] ?? id);
  }, [headlessHeatmap.volumes]);

  const groups: NormalizedMuscleGroup[] = ['Back', 'Chest', 'Core', 'Legs', 'Shoulders', 'Arms'];
  const maxSets = Math.max(...muscleData.map((m) => m.sets), 1);

  const centerX = 120;
  const centerY = 100;
  const maxRadius = 70;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / groups.length - Math.PI / 2;
    const radius = (value / maxSets) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const dataPoints = groups.map((group, idx) => {
    const data = muscleData.find((m) => m.group === group);
    return getPoint(idx, data?.sets || 0);
  });

  const pathData = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const getHexPath = (scale: number) => {
    const points = groups.map((_, idx) => {
      const angle = (Math.PI * 2 * idx) / groups.length - Math.PI / 2;
      const radius = maxRadius * scale;
      return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
    });
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

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
          <div className="relative mb-8">
            <svg width="240" height="220" viewBox="0 0 240 220" className="drop-shadow-lg">
              {gridLevels.map((level, idx) => (
                <path
                  key={idx}
                  d={getHexPath(level)}
                  fill="none"
                  stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.3)'}
                  strokeWidth="1"
                />
              ))}

              <path
                d={pathData}
                fill={isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.18)'}
                stroke={isDark ? 'rgba(59,130,246,0.8)' : 'rgba(37,99,235,0.75)'}
                strokeWidth="2"
              />

              {dataPoints.map((point, idx) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={isDark ? '#60a5fa' : '#2563eb'}
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  strokeWidth="2"
                />
              ))}

              {groups.map((group, idx) => {
                const angle = (Math.PI * 2 * idx) / groups.length - Math.PI / 2;
                const labelRadius = maxRadius + 25;
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                return (
                  <text
                    key={group}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[10px] font-semibold ${isDark ? 'fill-slate-300' : 'fill-slate-700'}`}
                  >
                    {group}
                  </text>
                );
              })}
            </svg>
          </div>
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
