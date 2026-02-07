import { WorkoutSet } from '../../types';
import {
  hevyBackendGetAccount,
  hevyBackendGetSets,
  hevyBackendGetSetsWithProApiKey,
} from '../../utils/api/hevyBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { clearHevyAuthToken, clearHevyProApiKey, saveSetupComplete } from '../../utils/storage/dataSourceStorage';
import { hydrateBackendWorkoutSets } from '../auth/hydrateBackendWorkoutSets';
import { getHevyErrorMessage } from '../ui/appErrorMessages';
import { trackEvent } from '../../utils/integrations/analytics';
import type { StartupAutoLoadParams } from './startupAutoLoadTypes';
import { APP_LOADING_STEPS } from '../loadingSteps';

// Simple 3-step timeline
const STEP = APP_LOADING_STEPS;

interface TokenTrackConfig {
  successMethod: string;
  errorMethod: string;
}

export const loadHevyFromProKey = (deps: StartupAutoLoadParams, apiKey: string): void => {
  deps.setLoadingKind('hevy');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(STEP.INIT);
  const startedAt = deps.startProgress();

  deps.setLoadingStep(STEP.PROCESS);
  hevyBackendGetSetsWithProApiKey<WorkoutSet>(apiKey)
    .then((resp) => {
      const sets = resp.sets ?? [];

      // Instant processing
      const hydrated = hydrateBackendWorkoutSets(sets);
      if (hydrated.length === 0 || hydrated.every((s) => !s.parsedDate)) {
        clearHevyProApiKey();
        saveSetupComplete(false);
        deps.setHevyLoginError('Hevy data could not be parsed. Please try syncing again.');
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }

      const enriched = identifyPersonalRecords(hydrated);
      deps.setLoadingStep(STEP.BUILD);
      deps.setParsedData(enriched);
      deps.setHevyLoginError(null);
      deps.setCsvImportError(null);
    })
    .catch((err) => {
      clearHevyProApiKey();
      saveSetupComplete(false);
      deps.setHevyLoginError(getHevyErrorMessage(err));
      deps.setOnboarding({ intent: 'initial', step: 'platform' });
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};

export const loadHevyFromToken = (
  deps: StartupAutoLoadParams,
  token: string,
  trackConfig?: TokenTrackConfig
): void => {
  deps.setLoadingKind('hevy');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(STEP.INIT);
  const startedAt = deps.startProgress();

  hevyBackendGetAccount(token)
    .then(({ username }) => {
      deps.setLoadingStep(STEP.PROCESS);
      return hevyBackendGetSets<WorkoutSet>(token, username);
    })
    .then((resp) => {
      if (trackConfig) {
        trackEvent('hevy_sync_success', { method: trackConfig.successMethod, workouts: resp.meta?.workouts });
      }
      const sets = resp.sets ?? [];

      // Instant processing
      const hydrated = hydrateBackendWorkoutSets(sets);
      if (hydrated.length === 0 || hydrated.every((s) => !s.parsedDate)) {
        clearHevyAuthToken();
        saveSetupComplete(false);
        deps.setHevyLoginError('Hevy data could not be parsed. Please try syncing again.');
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }

      const enriched = identifyPersonalRecords(hydrated);
      deps.setLoadingStep(STEP.BUILD);
      deps.setParsedData(enriched);
      deps.setHevyLoginError(null);
      deps.setCsvImportError(null);
    })
    .catch((err) => {
      if (trackConfig) {
        trackEvent('hevy_sync_error', { method: trackConfig.errorMethod });
      }
      clearHevyAuthToken();
      saveSetupComplete(false);
      deps.setHevyLoginError(getHevyErrorMessage(err));
      deps.setOnboarding({ intent: 'initial', step: 'platform' });
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
