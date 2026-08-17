import React from 'react';
import { Reveal } from '../../ui/Reveal';
import { ExerciseStats } from '../../../types';
import { ExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import { BodyMap, BodyMapGender } from '../../bodyMap/BodyMap';
import { ExerciseThumbnail } from '../../common/ExerciseThumbnail';
import { getExerciseMuscleColor } from '../../../utils/muscle/mapping';
import { getTargetTextColor } from '../utils/exerciseViewUtils';
import type { ExerciseMuscleTargets } from '../utils/exerciseViewTypes';
import type { MuscleVolumeThresholds } from '../../../utils/muscle/hypertrophy/muscleParams';

interface ExerciseOverviewCardProps {
  selectedStats: ExerciseStats;
  assetLookup: ExerciseAssetLookup | null;
  bodyMapGender: BodyMapGender;
  selectedExerciseMuscleInfo: ExerciseMuscleTargets;
  selectedExerciseMuscleVolumes: Map<string, number>;
  selectedExerciseMuscleMaxVolume: number;
  volumeThresholds: MuscleVolumeThresholds;
}

export const ExerciseOverviewCard: React.FC<ExerciseOverviewCardProps> = ({
  selectedStats,
  assetLookup,
  bodyMapGender,
  selectedExerciseMuscleInfo,
  selectedExerciseMuscleVolumes,
  selectedExerciseMuscleMaxVolume,
  volumeThresholds,
}) => {
  return (
    <Reveal className="flex items-center gap-3 shrink-0 rounded-xl p-3 w-full lg:w-fit lg:self-start max-w-full">
      {/* BodyMap - Left side, fixed size */}
      <div className="w-24 h-20 flex items-center justify-center rounded-lg relative flex-none">
        <BodyMap
          onPartClick={() => { }}
          selectedPart={null}
          muscleVolumes={selectedExerciseMuscleVolumes}
          maxVolume={selectedExerciseMuscleMaxVolume}
          volumeThresholds={volumeThresholds}
          useExerciseColors
          compact
          gender={bodyMapGender}
          stroke={{ width: 5, color: '#484a68', opacity: 0.8 }}
        />


      </div>

      {/* Middle content - Flexible width */}
      {(selectedExerciseMuscleInfo.primaryTargets.length > 0 || selectedExerciseMuscleInfo.secondaryTargets.length > 0) && (
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 text-center">
          {selectedExerciseMuscleInfo.primaryTargets.length > 0 && (
            <div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-700 font-semibold">Primary</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedExerciseMuscleInfo.primaryTargets.map((t) => (
                  <span
                    key={`primary-${t.label}`}
                    className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border border-slate-900/10"
                    style={{
                      backgroundColor: getExerciseMuscleColor(t.sets),
                      color: getTargetTextColor(t.sets, 1),
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
              <div className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-700 font-semibold">Secondary</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedExerciseMuscleInfo.secondaryTargets.map((t) => (
                  <span
                    key={`secondary-${t.label}`}
                    className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border border-slate-900/10"
                    style={{
                      backgroundColor: getExerciseMuscleColor(t.sets),
                      color: '#1e293b',
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

      {/* Video - Right side, fixed size */}
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
    </Reveal>
  );
};
