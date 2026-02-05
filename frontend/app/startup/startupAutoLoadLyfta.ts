import { WorkoutSet } from '../../types';
import { lyfatBackendGetSets } from '../../utils/api/lyfataBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { clearLyfataApiKey, saveSetupComplete } from '../../utils/storage/dataSourceStorage';
import { hydrateBackendWorkoutSets } from '../auth/hydrateBackendWorkoutSets';
import { getHevyErrorMessage } from '../ui/appErrorMessages';
import type { StartupAutoLoadParams } from './startupAutoLoadTypes';

export const loadLyftaFromApiKey = (deps: StartupAutoLoadParams, apiKey: string): void => {
  deps.setLoadingKind('lyfta');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  Promise.resolve()
    .then(() => {
      deps.setLoadingStep(1);
      return lyfatBackendGetSets<WorkoutSet>(apiKey);
    })
    .then((resp) => {
      deps.setLoadingStep(2);
      const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
      const enriched = identifyPersonalRecords(hydrated);
      deps.setParsedData(enriched);
      deps.setLyfatLoginError(null);
      deps.setCsvImportError(null);
    })
    .catch((err) => {
      clearLyfataApiKey();
      saveSetupComplete(false);
      deps.setLyfatLoginError(getHevyErrorMessage(err));
      deps.setOnboarding({ intent: 'initial', step: 'platform' });
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
