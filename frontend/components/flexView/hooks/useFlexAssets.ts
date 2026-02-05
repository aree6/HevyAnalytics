import { useEffect, useMemo, useState } from 'react';

import { getExerciseAssets, type ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { createExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import {
  loadExerciseMuscleData,
  type ExerciseMuscleData,
} from '../../../utils/muscle/mapping';

export const useFlexAssets = () => {
  const [assetsMap, setAssetsMap] = useState<Map<string, ExerciseAsset>>(() => new Map());
  const [exerciseMuscleData, setExerciseMuscleData] = useState<Map<string, ExerciseMuscleData>>(new Map());

  useEffect(() => {
    let cancelled = false;
    getExerciseAssets()
      .then((m) => {
        if (!cancelled) setAssetsMap(m);
      })
      .catch(() => {
        if (!cancelled) setAssetsMap(new Map());
      });
    loadExerciseMuscleData()
      .then((m) => {
        if (!cancelled) setExerciseMuscleData(m);
      })
      .catch(() => {
        if (!cancelled) setExerciseMuscleData(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const assetLookup = useMemo(() => createExerciseAssetLookup(assetsMap), [assetsMap]);

  return { assetsMap, exerciseMuscleData, assetLookup };
};
