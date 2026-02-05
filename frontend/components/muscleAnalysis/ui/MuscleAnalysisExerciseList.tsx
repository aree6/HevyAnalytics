import React from 'react';
import { BodyMap } from '../../bodyMap/BodyMap';
import { ExerciseThumbnail } from '../../common/ExerciseThumbnail';
import { getExerciseMuscleVolumes, lookupExerciseMuscleData, toHeadlessVolumeMap, type ExerciseMuscleData } from '../../../utils/muscle/mapping';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';

interface MuscleAnalysisExerciseListProps {
  contributingExercises: Array<{ name: string; sets: number; primarySets: number; secondarySets: number }>;
  assetsMap: Map<string, ExerciseAsset> | null;
  exerciseMuscleData: Map<string, ExerciseMuscleData>;
  totalSetsInWindow: number;
  onExerciseClick?: (exerciseName: string) => void;
}

export const MuscleAnalysisExerciseList: React.FC<MuscleAnalysisExerciseListProps> = ({
  contributingExercises,
  assetsMap,
  exerciseMuscleData,
  totalSetsInWindow,
  onExerciseClick,
}) => {
  return (
    <div className="overflow-y-auto flex-1 px-4 mt-2 scroll-smooth">
      <div className="space-y-2 pb-4">
        {contributingExercises.map((ex) => {
          const asset = assetsMap?.get(ex.name);
          const exData = lookupExerciseMuscleData(ex.name, exerciseMuscleData);
          const { volumes: exVolumes, maxVolume: exMaxVol } = getExerciseMuscleVolumes(exData);
          const exHeadlessVolumes = toHeadlessVolumeMap(exVolumes);
          const exHeadlessMaxVol = Math.max(1, ...(Array.from(exHeadlessVolumes.values()) as number[]));
          const totalSetsForCalc = totalSetsInWindow || 1;
          const pct = totalSetsForCalc > 0 ? Math.round((ex.sets / totalSetsForCalc) * 100) : 0;

          const isPrimary = ex.primarySets > 0;
          const isSecondary = ex.secondarySets > 0;
          const primaryRounded = Math.round(ex.primarySets * 10) / 10;
          const secondaryRounded = Math.round(ex.secondarySets * 10) / 10;

          return (
            <button
              key={ex.name}
              onClick={() => onExerciseClick?.(ex.name)}
              type="button"
              className="group relative w-full text-left rounded-lg bg-black/50 p-2 shadow-sm transition-all focus:outline-none border border-transparent hover:border-slate-600/40"
              title={ex.name}
            >
              <div className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr_5.25rem] items-stretch gap-2">
                <div className="flex items-center justify-center">
                  <div className="w-full aspect-square">
                    <ExerciseThumbnail
                      asset={asset}
                      className="h-full w-full rounded-md"
                      imageClassName="h-full w-full rounded-md object-cover bg-white"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 min-w-0 pt-1">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{ex.name}</div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] pb-1">
                    <div className="text-slate-400">
                      {pct}% of sets
                    </div>
                    {isPrimary && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-200"
                        title={`${primaryRounded} direct set${primaryRounded === 1 ? '' : 's'}`}
                      >
                        {primaryRounded} direct set{primaryRounded === 1 ? '' : 's'}
                      </span>
                    )}
                    {isSecondary && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-200"
                        title={`${secondaryRounded} indirect set${secondaryRounded === 1 ? '' : 's'}`}
                      >
                        {secondaryRounded} indirect set{secondaryRounded === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex w-[5.25rem] justify-end">
                  <div className="h-full w-[5.25rem] rounded-md p-1">
                    <div className="h-full w-full flex items-center justify-center">
                      <BodyMap
                        onPartClick={() => { }}
                        selectedPart={null}
                        muscleVolumes={exHeadlessVolumes}
                        maxVolume={exHeadlessMaxVol}
                        compact
                        compactFill
                        viewMode="headless"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {contributingExercises.length === 0 && (
          <div className="text-center text-slate-500 py-4">
            No exercises found
          </div>
        )}
      </div>
    </div>
  );
};
