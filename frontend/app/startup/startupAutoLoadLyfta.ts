import { WorkoutSet } from '../../types';
import { lyfatBackendGetSets } from '../../utils/api/lyfataBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { saveSetupComplete } from '../../utils/storage/dataSourceStorage';
import { hydrateBackendWorkoutSetsWithSource } from '../auth/hydrateBackendWorkoutSets';
import { reportHistoryTruncation } from '../state/historyTruncation';
import { getLyfatErrorMessage } from '../ui/appErrorMessages';
import type { StartupAutoLoadParams } from './startupAutoLoadTypes';

interface StartupLoadBehavior {
  resetOnError?: boolean;
}

export const loadLyftaFromApiKey = (
  deps: StartupAutoLoadParams,
  apiKey: string,
  behavior: StartupLoadBehavior = {}
): void => {
  const shouldResetOnError = behavior.resetOnError !== false;
  deps.setLoadingKind('lyfta');
  deps.setIsAnalyzing(true);
  const startedAt = deps.startProgress();

  lyfatBackendGetSets<WorkoutSet>(apiKey)
    .then((resp) => {
      reportHistoryTruncation(resp.meta);
      const sets = resp.sets ?? [];

      // Instant processing
      const hydrated = hydrateBackendWorkoutSetsWithSource(sets, 'lyfta');

      if (hydrated.length === 0 || hydrated.every((s) => !s.parsedDate)) {
        if (shouldResetOnError) {
          saveSetupComplete(false);
          deps.setLyfatLoginError('Lyfta data could not be parsed. Please try syncing again.');
          deps.setOnboarding({ intent: 'initial', step: 'platform' });
        }
        return;
      }

      const enriched = identifyPersonalRecords(hydrated);
      deps.setParsedData(enriched);
      deps.setLyfatLoginError(null);
      deps.setCsvImportError(null);
    })
    .catch((err) => {
      if (shouldResetOnError) {
        saveSetupComplete(false);
        deps.setLyfatLoginError(getLyfatErrorMessage(err));
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
      }
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
