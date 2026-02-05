import { WorkoutSet } from '../types';
import {
  getLyfataApiKey,
  saveLyfataApiKey,
  clearLyfataApiKey,
  saveLastLoginMethod,
  saveSetupComplete,
} from '../../utils/storage/dataSourceStorage';
import { lyfatBackendGetSets } from '../../utils/api/lyfataBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { hydrateBackendWorkoutSets } from '../../app/auth';
import { getLyfatErrorMessage } from '../../app/ui';
import { trackEvent } from '../../utils/integrations/analytics';
import type { AppAuthHandlersDeps } from './appAuthTypes';

export const runLyfatSyncSaved = (deps: AppAuthHandlersDeps): void => {
  const apiKey = getLyfataApiKey();
  if (!apiKey) return;

  trackEvent('lyfta_sync_start', { method: 'saved_api_key' });

  deps.setLyfatLoginError(null);
  deps.setLoadingKind('lyfta');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  lyfatBackendGetSets<WorkoutSet>(apiKey)
    .then((resp) => {
      deps.setLoadingStep(2);
      const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
      const enriched = identifyPersonalRecords(hydrated);
      deps.setParsedData(enriched);
      deps.setDataSource('lyfta');
      saveSetupComplete(true);
      deps.setOnboarding(null);
    })
    .catch((err) => {
      trackEvent('lyfta_sync_error', { method: 'saved_api_key' });
      clearLyfataApiKey();
      deps.setLyfatLoginError(getLyfatErrorMessage(err));
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};

export const runLyfatLogin = (deps: AppAuthHandlersDeps, apiKey: string): void => {
  trackEvent('lyfta_sync_start', { method: 'api_key' });
  deps.setLyfatLoginError(null);
  deps.setLoadingKind('lyfta');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  lyfatBackendGetSets<WorkoutSet>(apiKey)
    .then((resp) => {
      deps.setLoadingStep(2);
      trackEvent('lyfta_sync_success', { method: 'api_key', workouts: resp.meta?.workouts });
      saveLyfataApiKey(apiKey);
      saveLastLoginMethod('lyfta', 'apiKey');
      const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
      const enriched = identifyPersonalRecords(hydrated);
      deps.setParsedData(enriched);
      deps.setDataSource('lyfta');
      saveSetupComplete(true);
      deps.setOnboarding(null);
    })
    .catch((err) => {
      trackEvent('lyfta_sync_error', { method: 'api_key' });
      deps.setLyfatLoginError(getLyfatErrorMessage(err));
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
