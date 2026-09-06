import { WorkoutSet } from '../../types';
import {
  saveLastLoginMethod,
  addCombinedDataSource,
  saveSetupComplete,
} from '../../utils/storage/dataSourceStorage';
import {
  getLyftaApiKey,
  saveLyftaApiKey,
} from '../../utils/storage/hevyCredentialsStorage';
import { lyfatBackendGetSets } from '../../utils/api/lyfataBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { hydrateBackendWorkoutSetsWithSource } from '../../app/auth/hydrateBackendWorkoutSets';
import { reportHistoryTruncation } from '../../app/state/historyTruncation';
import { getLyfatErrorMessage } from '../../app/ui';
import { trackEvent, identifyUser } from '../../utils/integrations/analytics';
import type { AppAuthHandlersDeps } from './appAuthTypes';


export const runLyfatSyncSaved = (deps: AppAuthHandlersDeps): void => {
  const apiKey = getLyftaApiKey();
  if (!apiKey) return;

  trackEvent('lyfta_sync_start', { method: 'saved_api_key' });

  deps.setLyfatLoginError(null);
  deps.setLoadingKind('lyfta');
  deps.setIsAnalyzing(true);
  const startedAt = deps.startProgress();

  lyfatBackendGetSets<WorkoutSet>(apiKey)
    .then((resp) => {
      reportHistoryTruncation(resp.meta);
      const sets = resp.sets ?? [];
      const hydrated = hydrateBackendWorkoutSetsWithSource(sets, 'lyfta');
      const enriched = identifyPersonalRecords(hydrated);

      deps.setParsedData(enriched);
      deps.setDataSource('lyfta');
      addCombinedDataSource('lyfta');
      saveSetupComplete(true);
      deps.setOnboarding(null);

      if (resp.username) {
        identifyUser(resp.username, { login_method: 'apiKey', platform: 'lyfta', username: resp.username });
      }
    })
    .catch((err) => {
      trackEvent('lyfta_sync_error', { method: 'saved_api_key' });
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
  const startedAt = deps.startProgress();

  lyfatBackendGetSets<WorkoutSet>(apiKey)
    .then((resp) => {
      trackEvent('lyfta_sync_success', { method: 'api_key', workouts: resp.meta?.workouts });
      reportHistoryTruncation(resp.meta);
      saveLyftaApiKey(apiKey);
      saveLastLoginMethod('lyfta', 'apiKey');
      const sets = resp.sets ?? [];
      const hydrated = hydrateBackendWorkoutSetsWithSource(sets, 'lyfta');
      const enriched = identifyPersonalRecords(hydrated);

      deps.setParsedData(enriched);
      deps.setDataSource('lyfta');
      addCombinedDataSource('lyfta');
      saveSetupComplete(true);
      deps.setOnboarding(null);

      if (resp.username) {
        identifyUser(resp.username, { login_method: 'apiKey', platform: 'lyfta', username: resp.username });
      }
    })
    .catch((err) => {
      trackEvent('lyfta_sync_error', { method: 'api_key' });
      deps.setLyfatLoginError(getLyfatErrorMessage(err));
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
