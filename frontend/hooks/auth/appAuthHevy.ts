import { WorkoutSet } from '../types';
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

export const runHevySyncSaved = (deps: AppAuthHandlersDeps): void => {
  const savedProKey = getHevyProApiKey();
  if (savedProKey) {
    deps.setHevyLoginError(null);
    deps.setLoadingKind('hevy');
    deps.setIsAnalyzing(true);
    deps.setLoadingStep(0);
    const startedAt = deps.startProgress();

    Promise.resolve()
      .then(() => {
        deps.setLoadingStep(1);
        return hevyBackendGetSetsWithProApiKey<WorkoutSet>(savedProKey);
      })
      .then((resp) => {
        deps.setLoadingStep(2);
        const sets = resp.sets ?? [];
        
        // Debug logging for empty dashboard issue
        if (sets.length === 0) {
          console.warn('[runHevySyncSaved Pro API] No sets received from backend');
        }
        
        const hydrated = hydrateBackendWorkoutSets(sets);
        const enriched = identifyPersonalRecords(hydrated);
        
        // Debug logging for empty dashboard issue
        if (enriched.length > 0 && enriched.every(s => !s.parsedDate)) {
          console.warn('[runHevySyncSaved Pro API] All hydrated sets have invalid parsedDate');
        }
        
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
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  hevyBackendGetAccount(token)
    .then(({ username }) => {
      deps.setLoadingStep(1);
      return hevyBackendGetSets<WorkoutSet>(token, username);
    })
    .then((resp) => {
      deps.setLoadingStep(2);
      const sets = resp.sets ?? [];
      
      // Debug logging for empty dashboard issue
      if (sets.length === 0) {
        console.warn('[runHevySyncSaved] No sets received from backend');
      }
      
      const hydrated = hydrateBackendWorkoutSets(sets);
      const enriched = identifyPersonalRecords(hydrated);
      
      // Debug logging for empty dashboard issue
      if (enriched.length > 0 && enriched.every(s => !s.parsedDate)) {
        console.warn('[runHevySyncSaved] All hydrated sets have invalid parsedDate');
      }
      
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
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  Promise.resolve()
    .then(() => hevyBackendValidateProApiKey(trimmed))
    .then((valid) => {
      if (!valid) throw new Error('Invalid API key. Please check your Hevy Pro API key and try again.');
      saveHevyProApiKey(trimmed);
      saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);
      deps.setLoadingStep(1);
      return hevyBackendGetSetsWithProApiKey<WorkoutSet>(trimmed);
    })
    .then((resp) => {
      deps.setLoadingStep(2);
      const sets = resp.sets ?? [];
      
      // Debug logging for empty dashboard issue
      if (sets.length === 0) {
        console.warn('[runHevyApiKeyLogin] No sets received from backend');
      }
      
      const hydrated = hydrateBackendWorkoutSets(sets);
      const enriched = identifyPersonalRecords(hydrated);
      
      // Debug logging for empty dashboard issue
      if (enriched.length > 0 && enriched.every(s => !s.parsedDate)) {
        console.warn('[runHevyApiKeyLogin] All hydrated sets have invalid parsedDate');
      }
      
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
  deps.setLoadingStep(0);
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
      deps.setLoadingStep(1);
      return hevyBackendGetSets<WorkoutSet>(token, username);
    })
    .then((resp) => {
      deps.setLoadingStep(2);
      const sets = resp.sets ?? [];
      
      // Debug logging for empty dashboard issue
      if (sets.length === 0) {
        console.warn('[runHevyLogin] No sets received from backend');
      }
      
      const hydrated = hydrateBackendWorkoutSets(sets);
      const enriched = identifyPersonalRecords(hydrated);
      
      // Debug logging for empty dashboard issue
      if (enriched.length > 0 && enriched.every(s => !s.parsedDate)) {
        console.warn('[runHevyLogin] All hydrated sets have invalid parsedDate');
      }
      
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
