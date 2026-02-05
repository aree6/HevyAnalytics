import React, { useMemo } from 'react';
import { BodyMap, type BodyMapGender } from '../../bodyMap/BodyMap';
import { LazyRender } from '../../ui/LazyRender';
import { ChartSkeleton } from '../../ui/ChartSkeleton';
import { HEADLESS_MUSCLE_NAMES, SVG_TO_MUSCLE_GROUP } from '../../../utils/muscle/mapping';

interface HeatmapData {
  volumes: Map<string, number>;
  maxVolume: number;
}

interface WeeklySetsHeatmapViewProps {
  heatmap: HeatmapData;
  headlessVolumes: Map<string, number>;
  heatmapHoveredMuscleIds?: string[];
  heatmapHoveredMuscle: string | null;
  setHeatmapHoveredMuscle: (muscleId: string | null) => void;
  onBodyMapClick: (muscleId: string) => void;
  bodyMapGender?: BodyMapGender;
}

export const WeeklySetsHeatmapView: React.FC<WeeklySetsHeatmapViewProps> = ({
  heatmap,
  headlessVolumes,
  heatmapHoveredMuscleIds,
  heatmapHoveredMuscle,
  setHeatmapHoveredMuscle,
  onBodyMapClick,
  bodyMapGender,
}) => {
  const weeklySetsHoverMeta = useMemo(() => {
    if (!heatmapHoveredMuscle) return null;
    const name = (HEADLESS_MUSCLE_NAMES as any)[heatmapHoveredMuscle]
      ?? (SVG_TO_MUSCLE_GROUP as any)[heatmapHoveredMuscle]
      ?? 'Unknown';
    const raw = headlessVolumes.get(heatmapHoveredMuscle) ?? 0;
    const value = Math.round(raw * 10) / 10;
    return { name, value };
  }, [heatmapHoveredMuscle, headlessVolumes]);

  return (
    <LazyRender className="w-full" placeholder={<ChartSkeleton style={{ height: 300 }} />}>
      <div className="flex flex-col items-center justify-center h-[300px]">
        {heatmap.volumes.size === 0 ? (
          <div className="text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg p-8">
            No heatmap data for this period yet.
          </div>
        ) : (
          <div className="relative flex justify-center w-full mt-4 sm:mt-6">
            <div className="transform scale-[0.5] origin-center">
              <BodyMap
                onPartClick={onBodyMapClick}
                selectedPart={null}
                muscleVolumes={headlessVolumes}
                maxVolume={Math.max(1, ...(Array.from(headlessVolumes.values()) as number[]))}
                hoveredMuscleIdsOverride={heatmapHoveredMuscleIds}
                onPartHover={setHeatmapHoveredMuscle}
                gender={bodyMapGender}
                viewMode="headless"
              />
            </div>

            {weeklySetsHoverMeta ? (
              <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 bg-black/90 border border-slate-700/50 rounded-lg px-3 py-2 shadow-xl pointer-events-none z-20">
                <div className="font-semibold text-[11px] text-center whitespace-nowrap text-white">
                  {weeklySetsHoverMeta.name}
                </div>
                <div className="text-[10px] text-center font-semibold whitespace-nowrap text-white">
                  {`${weeklySetsHoverMeta.value.toFixed(1)} sets/wk`}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </LazyRender>
  );
};
