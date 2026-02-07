import { WorkoutSet } from '../../types';
import { lyfatBackendGetSets } from '../../utils/api/lyfataBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { clearLyfataApiKey, saveSetupComplete } from '../../utils/storage/dataSourceStorage';
import { hydrateBackendWorkoutSets } from '../auth/hydrateBackendWorkoutSets';
import { getLyfatErrorMessage } from '../ui/appErrorMessages';
import type { StartupAutoLoadParams } from './startupAutoLoadTypes';
import { APP_LOADING_STEPS } from '../loadingSteps';

// Simple 3-step timeline
const STEP = APP_LOADING_STEPS;

export const loadLyftaFromApiKey = (deps: StartupAutoLoadParams, apiKey: string): void => {
  deps.setLoadingKind('lyfta');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(STEP.INIT);
  const startedAt = deps.startProgress();

  deps.setLoadingStep(STEP.PROCESS);
  lyfatBackendGetSets<WorkoutSet>(apiKey)
    .then((resp) => {
      const sets = resp.sets ?? [];

      // Instant processing
      const hydrated = hydrateBackendWorkoutSets(sets);

      if (hydrated.length === 0 || hydrated.every((s) => !s.parsedDate)) {
        saveSetupComplete(false);
        deps.setLyfatLoginError('Lyfta data could not be parsed. Please try syncing again.');
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }

      const enriched = identifyPersonalRecords(hydrated);
      deps.setLoadingStep(STEP.BUILD);
      deps.setParsedData(enriched);
      deps.setLyfatLoginError(null);
      deps.setCsvImportError(null);
    })
    .catch((err) => {
      clearLyfataApiKey();
      saveSetupComplete(false);
      deps.setLyfatLoginError(getLyfatErrorMessage(err));
      deps.setOnboarding({ intent: 'initial', step: 'platform' });
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
