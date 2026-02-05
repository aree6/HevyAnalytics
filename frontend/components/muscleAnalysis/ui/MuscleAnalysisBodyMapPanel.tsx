import React from 'react';
import { BodyMap, BodyMapGender } from '../../bodyMap/BodyMap';
import { Grid3X3, Infinity, Scan } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Tooltip as HoverTooltip, type TooltipData } from '../../ui/Tooltip';
import { CHART_TOOLTIP_STYLE, RADAR_TICK_FILL } from '../../../utils/ui/uiConstants';
import { QUICK_FILTER_LABELS } from '../../../utils/muscle/mapping';
import type { WeeklySetsWindow } from '../../../utils/muscle/analytics';
import type { QuickFilterCategory } from '../hooks/useMuscleSelection';

interface MuscleAnalysisBodyMapPanelProps {
  viewMode: 'muscle' | 'group' | 'headless';
  bodyMapGender: BodyMapGender;
  activeQuickFilter: QuickFilterCategory | null;
  onQuickFilterClick: (value: QuickFilterCategory) => void;
  weeklySetsChartView: 'heatmap' | 'radar';
  setWeeklySetsChartView: (value: 'heatmap' | 'radar') => void;
  weeklySetsWindow: WeeklySetsWindow;
  setWeeklySetsWindow: (value: WeeklySetsWindow) => void;
  selectedSvgIdForUrlRef: React.MutableRefObject<string | null>;
  updateSelectionUrl: (payload: { svgId: string; mode: 'muscle' | 'group' | 'headless'; window: WeeklySetsWindow }) => void;
  muscleVolumes: Map<string, number>;
  maxVolume: number;
  groupedBodyMapVolumes: Map<string, number>;
  maxGroupVolume: number;
  selectedMuscle: string | null;
  selectedBodyMapIds?: string[];
  hoveredBodyMapIds?: string[];
  handleMuscleClick: (muscleId: string) => void;
  handleMuscleHover: (muscleId: string | null, e?: MouseEvent) => void;
  radarData: Array<{ subject: string; value: number }>;
  hoverTooltip: TooltipData | null;
}

export const MuscleAnalysisBodyMapPanel: React.FC<MuscleAnalysisBodyMapPanelProps> = ({
  viewMode,
  bodyMapGender,
  activeQuickFilter,
  weeklySetsChartView,
  setWeeklySetsChartView,
  weeklySetsWindow,
  setWeeklySetsWindow,
  selectedSvgIdForUrlRef,
  updateSelectionUrl,
  muscleVolumes,
  maxVolume,
  groupedBodyMapVolumes,
  maxGroupVolume,
  selectedMuscle,
  selectedBodyMapIds,
  hoveredBodyMapIds,
  onQuickFilterClick,
  handleMuscleClick,
  handleMuscleHover,
  radarData,
  hoverTooltip,
}) => {
  return (
    <div className="bg-black/70 rounded-xl border border-slate-700/50 p-4 relative flex flex-col min-h-0">
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-black/70 rounded-lg p-1 shadow-lg">
          {(['PUS', 'PUL', 'LEG'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onQuickFilterClick(filter)}
              title={QUICK_FILTER_LABELS[filter]}
              className={`px-1 py-0.5 rounded text-[9px] font-bold transition-all ${activeQuickFilter === filter
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-700/50 shrink-0">
          <button
            onClick={() => setWeeklySetsChartView('heatmap')}
            title="Heatmap"
            aria-label="Heatmap"
            className={`w-6 h-5 flex items-center justify-center rounded ${weeklySetsChartView === 'heatmap' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            <Grid3X3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setWeeklySetsChartView('radar')}
            title="Radar"
            aria-label="Radar"
            className={`w-6 h-5 flex items-center justify-center rounded ${weeklySetsChartView === 'radar' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            <Scan className="w-3 h-3" />
          </button>
        </div>

        <div className="inline-flex bg-black/70 rounded-lg p-0.5 border border-slate-700/50">
          {(['all', '7d', '30d', '365d'] as const).map((w) => (
            <button
              key={w}
              onClick={() => {
                setWeeklySetsWindow(w);
                const svgId = selectedSvgIdForUrlRef.current;
                if (!svgId) return;
                updateSelectionUrl({ svgId, mode: viewMode, window: w });
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${weeklySetsWindow === w
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
                }`}
              title={w === 'all' ? 'All time' : w === '7d' ? 'Last week' : w === '30d' ? 'Last month' : 'Last year'}
            >
              {w === 'all' ? <Infinity className="w-2.5 h-2.5" /> : w === '7d' ? 'lst wk' : w === '30d' ? 'lst mo' : 'lst yr'}
            </button>
          ))}
        </div>
      </div>

      {weeklySetsChartView === 'radar' ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 pt-10">
          {radarData.some((d) => (d.value ?? 0) > 0) ? (
            <div className="w-full min-h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
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
                  <RechartsTooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value: number) => [`${Number(value).toFixed(1)} sets/wk`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[280px] text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg mx-2 w-full">
              No muscle composition for this period yet.
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 pt-10">
          <div className="sm:transform sm:scale-[0.8] sm:origin-middle">
            <BodyMap
              onPartClick={handleMuscleClick}
              selectedPart={selectedMuscle}
              selectedMuscleIdsOverride={selectedBodyMapIds}
              hoveredMuscleIdsOverride={hoveredBodyMapIds}
              muscleVolumes={viewMode === 'group' ? groupedBodyMapVolumes : muscleVolumes}
              maxVolume={viewMode === 'group' ? maxGroupVolume : maxVolume}
              onPartHover={handleMuscleHover}
              gender={bodyMapGender}
              viewMode={viewMode}
            />
          </div>

          <div className="sm:hidden mb-10 text-center text-[11px] font-semibold text-slate-600">
            Tap to see more details
          </div>

          <div className="hidden sm:block text-center text-[11px] text-slate-500 mt-2 mb-8">
            Hover over muscles to preview, click to view exercises
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/75 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                <span>None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--heatmap-hue), 75%, 75%)' }}></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--heatmap-hue), 75%, 50%)' }}></div>
                <span>Med</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--heatmap-hue), 75%, 25%)' }}></div>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {hoverTooltip && <HoverTooltip data={hoverTooltip} />}
    </div>
  );
};
