import React from 'react';
import { ExerciseStats } from '../../../types';
import { ExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import { BodyMap, BodyMapGender } from '../../bodyMap/BodyMap';
import { ExerciseThumbnail } from '../../common/ExerciseThumbnail';
import { getVolumeColor } from '../../../utils/muscle/mapping';
import { getTargetTextColor } from '../utils/exerciseViewUtils';
import type { ExerciseMuscleTargets } from '../utils/exerciseViewTypes';

interface ExerciseOverviewCardProps {
  selectedStats: ExerciseStats;
  assetLookup: ExerciseAssetLookup | null;
  bodyMapGender: BodyMapGender;
  selectedExerciseMuscleInfo: ExerciseMuscleTargets;
  selectedExerciseHeadlessVolumes: Map<string, number>;
  selectedExerciseHeadlessMaxVolume: number;
  exerciseBodyMapHoverMeta: { name: string; role: string } | null;
  onBodyMapHover: (muscleId: string | null) => void;
}

export const ExerciseOverviewCard: React.FC<ExerciseOverviewCardProps> = ({
  selectedStats,
  assetLookup,
  bodyMapGender,
  selectedExerciseMuscleInfo,
  selectedExerciseHeadlessVolumes,
  selectedExerciseHeadlessMaxVolume,
  exerciseBodyMapHoverMeta,
  onBodyMapHover,
}) => {
  return (
    <div className="inline-flex items-start gap-4 shrink-0 bg-white rounded-xl p-3 self-start w-fit max-w-full">
      <div className="flex items-start gap-3">
        <div className="w-24 h-20 flex items-center justify-center rounded-lg relative">
          <BodyMap
            onPartClick={() => { }}
            selectedPart={null}
            muscleVolumes={selectedExerciseHeadlessVolumes}
            maxVolume={selectedExerciseHeadlessMaxVolume}
            compact
            interactive
            gender={bodyMapGender}
            viewMode="headless"
            onPartHover={(muscleId) => onBodyMapHover(muscleId)}
          />

          {exerciseBodyMapHoverMeta && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-slate-700/50 rounded-md px-2 py-1 shadow-xl pointer-events-none z-20">
              <div className="font-semibold text-[10px] text-center whitespace-nowrap text-white">
                {exerciseBodyMapHoverMeta.name}
              </div>
              {exerciseBodyMapHoverMeta.role ? (
                <div className="text-[9px] text-center font-semibold whitespace-nowrap text-slate-200">
                  {exerciseBodyMapHoverMeta.role}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {(selectedExerciseMuscleInfo.primaryTargets.length > 0 || selectedExerciseMuscleInfo.secondaryTargets.length > 0) && (
          <div className="space-y-2 min-w-0 max-w-[220px]">
            {selectedExerciseMuscleInfo.primaryTargets.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-700">Primary</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedExerciseMuscleInfo.primaryTargets.map((t) => (
                    <span
                      key={`primary-${t.label}`}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-900/10"
                      style={{
                        backgroundColor: getVolumeColor(t.sets, selectedExerciseMuscleInfo.maxVolume),
                        color: getTargetTextColor(t.sets, selectedExerciseMuscleInfo.maxVolume),
                      }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedExerciseMuscleInfo.secondaryTargets.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-700">Secondary</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedExerciseMuscleInfo.secondaryTargets.map((t) => (
                    <span
                      key={`secondary-${t.label}`}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-900/10"
                      style={{
                        backgroundColor: getVolumeColor(t.sets, selectedExerciseMuscleInfo.maxVolume),
                        color: '#ffffff',
                      }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {assetLookup && (() => {
        const a = assetLookup.getAsset(selectedStats.name);
        if (!a) return null;

        return (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-none">
            <ExerciseThumbnail
              asset={a}
              className="w-full h-full"
              imageClassName="w-full h-full object-cover"
            />
          </div>
        );
      })()}
    </div>
  );
};
