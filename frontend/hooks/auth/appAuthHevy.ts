import { WorkoutSet } from '../../types';
import {
  getHevyAuthToken,
  saveHevyAuthToken,
  clearHevyAuthToken,
  getHevyProApiKey,
  saveHevyProApiKey,
  clearHevyProApiKey,
  saveLastLoginMethod,
  saveSetupComplete,
} from '../../utils/storage/dataSourceStorage';
import { getHevyUsernameOrEmail, saveHevyPassword, saveHevyUsernameOrEmail } from '../../utils/storage/hevyCredentialsStorage';
import {
  hevyBackendGetAccount,
  hevyBackendGetSets,
  hevyBackendGetSetsWithProApiKey,
  hevyBackendLogin,
  hevyBackendValidateProApiKey,
} from '../../utils/api/hevyBackend';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { hydrateBackendWorkoutSets } from '../../app/auth';
import { getHevyErrorMessage } from '../../app/ui';
import { trackEvent } from '../../utils/integrations/analytics';
import type { AppAuthHandlersDeps } from './appAuthTypes';
import { APP_LOADING_STEPS } from '../../app/loadingSteps';

// Simple 3-step timeline
// 0 = Initializing
// 1 = Processing (API fetch - the slow part with rotating messages)
// 2 = Building dashboard (instant)
const STEP = APP_LOADING_STEPS;

export const runHevySyncSaved = (deps: AppAuthHandlersDeps): void => {
  const savedProKey = getHevyProApiKey();
  if (savedProKey) {
    deps.setHevyLoginError(null);
    deps.setLoadingKind('hevy');
    deps.setIsAnalyzing(true);
    deps.setLoadingStep(STEP.INIT);
    const startedAt = deps.startProgress();

    deps.setLoadingStep(STEP.PROCESS);
    hevyBackendGetSetsWithProApiKey<WorkoutSet>(savedProKey)
      .then((resp) => {
        const sets = resp.sets ?? [];
        const hydrated = hydrateBackendWorkoutSets(sets);
        const enriched = identifyPersonalRecords(hydrated);

        deps.setLoadingStep(STEP.BUILD);
        deps.setParsedData(enriched);
        saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);
        deps.setDataSource('hevy');
        saveSetupComplete(true);
        deps.setOnboarding(null);
      })
      .catch((err) => {
        clearHevyProApiKey();
        deps.setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        deps.finishProgress(startedAt);
      });
    return;
  }

  const token = getHevyAuthToken();
  if (!token) return;

  deps.setHevyLoginError(null);
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
      const sets = resp.sets ?? [];
      const hydrated = hydrateBackendWorkoutSets(sets);
      const enriched = identifyPersonalRecords(hydrated);

      deps.setLoadingStep(STEP.BUILD);
      deps.setParsedData(enriched);
      saveLastLoginMethod('hevy', 'credentials', getHevyUsernameOrEmail() ?? undefined);
      deps.setDataSource('hevy');
      saveSetupComplete(true);
      deps.setOnboarding(null);
    })
    .catch((err) => {
      clearHevyAuthToken();
      deps.setHevyLoginError(getHevyErrorMessage(err));
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};

export const runHevyApiKeyLogin = (deps: AppAuthHandlersDeps, apiKey: string): void => {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    deps.setHevyLoginError('Missing API key.');
    return;
  }

  trackEvent('hevy_sync_start', { method: 'pro_api_key' });

  deps.setHevyLoginError(null);
  deps.setLoadingKind('hevy');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(STEP.INIT);
  const startedAt = deps.startProgress();

  hevyBackendValidateProApiKey(trimmed)
    .then((valid) => {
      if (!valid) throw new Error('Invalid API key. Please check your Hevy Pro API key and try again.');
      saveHevyProApiKey(trimmed);
      saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);

      deps.setLoadingStep(STEP.PROCESS);
      return hevyBackendGetSetsWithProApiKey<WorkoutSet>(trimmed);
    })
    .then((resp) => {
      const sets = resp.sets ?? [];
      const hydrated = hydrateBackendWorkoutSets(sets);
      const enriched = identifyPersonalRecords(hydrated);

      deps.setLoadingStep(STEP.BUILD);
      deps.setParsedData(enriched);
      deps.setDataSource('hevy');
      saveSetupComplete(true);
      deps.setOnboarding(null);
    })
    .catch((err) => {
      trackEvent('hevy_sync_error', { method: 'pro_api_key' });
      clearHevyProApiKey();
      deps.setHevyLoginError(getHevyErrorMessage(err));
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};

export const runHevyLogin = (deps: AppAuthHandlersDeps, emailOrUsername: string, password: string): void => {
  trackEvent('hevy_sync_start', { method: 'credentials' });
  deps.setHevyLoginError(null);
  deps.setLoadingKind('hevy');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(STEP.INIT);
  const startedAt = deps.startProgress();

  hevyBackendLogin(emailOrUsername, password)
    .then((r) => {
      if (!r.auth_token) throw new Error('Missing auth token');
      saveHevyAuthToken(r.auth_token);
      const trimmed = emailOrUsername.trim();
      saveHevyUsernameOrEmail(trimmed);
      saveLastLoginMethod('hevy', 'credentials', trimmed);
      return Promise.all([
        saveHevyPassword(password).catch(() => {}),
        hevyBackendGetAccount(r.auth_token),
      ]).then(([, { username }]) => ({ token: r.auth_token, username }));
    })
    .then(({ token, username }) => {
      deps.setLoadingStep(STEP.PROCESS);
      return hevyBackendGetSets<WorkoutSet>(token, username);
    })
    .then((resp) => {
      const sets = resp.sets ?? [];
      const hydrated = hydrateBackendWorkoutSets(sets);
      const enriched = identifyPersonalRecords(hydrated);

      deps.setLoadingStep(STEP.BUILD);
      deps.setParsedData(enriched);
      deps.setDataSource('hevy');
      saveSetupComplete(true);
      deps.setOnboarding(null);
    })
    .catch((err) => {
      trackEvent('hevy_sync_error', { method: 'credentials' });
      deps.setHevyLoginError(getHevyErrorMessage(err));
    })
    .finally(() => {
      deps.finishProgress(startedAt);
    });
};
