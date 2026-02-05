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

interface TokenTrackConfig {
  successMethod: string;
  errorMethod: string;
}

export const loadHevyFromProKey = (deps: StartupAutoLoadParams, apiKey: string): void => {
  deps.setLoadingKind('hevy');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  Promise.resolve()
    .then(() => {
      deps.setLoadingStep(1);
      return hevyBackendGetSetsWithProApiKey<WorkoutSet>(apiKey);
    })
    .then((resp) => {
      deps.setLoadingStep(2);
      const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
      if (hydrated.length === 0 || hydrated.every((s) => !s.parsedDate)) {
        clearHevyProApiKey();
        saveSetupComplete(false);
        deps.setHevyLoginError('Hevy data could not be parsed. Please try syncing again.');
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }
      const enriched = identifyPersonalRecords(hydrated);
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
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  Promise.resolve()
    .then(() => hevyBackendGetAccount(token))
    .then(({ username }) => {
      deps.setLoadingStep(1);
      return hevyBackendGetSets<WorkoutSet>(token, username);
    })
    .then((resp) => {
      deps.setLoadingStep(2);
      if (trackConfig) {
        trackEvent('hevy_sync_success', { method: trackConfig.successMethod, workouts: resp.meta?.workouts });
      }
      const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
      if (hydrated.length === 0 || hydrated.every((s) => !s.parsedDate)) {
        clearHevyAuthToken();
        saveSetupComplete(false);
        deps.setHevyLoginError('Hevy data could not be parsed. Please try syncing again.');
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }
      const enriched = identifyPersonalRecords(hydrated);
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
