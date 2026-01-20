import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';

import type { WorkoutSet } from '../types';
import type { DataSourceChoice } from '../utils/dataSources/types';
import type { OnboardingFlow } from './onboarding/types';

import { parseWorkoutCSVAsyncWithUnit, type ParseWorkoutCsvResult } from '../utils/csv/csvParser';
import { identifyPersonalRecords } from '../utils/analysis/analytics';
import { trackEvent } from '../utils/integrations/analytics';

import {
  getCSVData,
  clearCSVData,
  getWeightUnit,
  getPreferencesConfirmed,
  savePreferencesConfirmed,
} from '../utils/storage/localStorage';
import {
  getDataSourceChoice,
  getHevyAuthToken,
  getHevyProApiKey,
  getLastCsvPlatform,
  getLastLoginMethod,
  getLyfataApiKey,
  clearLyfataApiKey,
  getSetupComplete,
  saveSetupComplete,
  clearHevyAuthToken,
  clearHevyProApiKey,
} from '../utils/storage/dataSourceStorage';
import { getHevyUsernameOrEmail } from '../utils/storage/hevyCredentialsStorage';

import {
  hevyBackendGetAccount,
  hevyBackendGetSets,
  hevyBackendGetSetsWithProApiKey,
} from '../utils/api/hevyBackend';
import { lyfatBackendGetSets } from '../utils/api/lyfataBackend';

import { hydrateBackendWorkoutSets } from './hydrateBackendWorkoutSets';
import { getErrorMessage, getHevyErrorMessage } from './appErrorMessages';

export interface StartupAutoLoadParams {
  setOnboarding: Dispatch<SetStateAction<OnboardingFlow | null>>;
  setDataSource: Dispatch<SetStateAction<DataSourceChoice | null>>;
  setParsedData: Dispatch<SetStateAction<WorkoutSet[]>>;
  setHevyLoginError: Dispatch<SetStateAction<string | null>>;
  setLyfatLoginError: Dispatch<SetStateAction<string | null>>;
  setCsvImportError: Dispatch<SetStateAction<string | null>>;
  setIsAnalyzing: Dispatch<SetStateAction<boolean>>;
  setLoadingStep: Dispatch<SetStateAction<number>>;
  setLoadingKind: Dispatch<SetStateAction<'hevy' | 'lyfta' | 'csv' | null>>;
  startProgress: () => number;
  finishProgress: (startedAt: number) => void;
}

export const useStartupAutoLoad = ({
  setOnboarding,
  setDataSource,
  setParsedData,
  setHevyLoginError,
  setLyfatLoginError,
  setCsvImportError,
  setIsAnalyzing,
  setLoadingStep,
  setLoadingKind,
  startProgress,
  finishProgress,
}: StartupAutoLoadParams): void => {
  useEffect(() => {
    if (!getSetupComplete()) return;

    // Backwards compatibility: older setups predate the preferences-confirmed flag.
    // Keep existing users unblocked, but require explicit confirmation for new setups.
    if (!getPreferencesConfirmed()) {
      savePreferencesConfirmed(true);
    }

    const storedChoice = getDataSourceChoice();
    if (!storedChoice) {
      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    setDataSource(storedChoice);

    const hevyAccountKey = storedChoice === 'hevy' ? (getHevyUsernameOrEmail() ?? undefined) : undefined;
    const lastMethod = getLastLoginMethod(storedChoice, hevyAccountKey);

    const storedCSV = getCSVData();
    const lastCsvPlatform = getLastCsvPlatform();
    const shouldUseCsv = lastMethod === 'csv' || (!lastMethod && storedCSV && lastCsvPlatform === storedChoice);

    if (storedChoice === 'strong') {
      if (!storedCSV || lastCsvPlatform !== 'strong') {
        saveSetupComplete(false);
        setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }

      setLoadingKind('csv');
      setIsAnalyzing(true);
      setLoadingStep(0);
      const startedAt = startProgress();
      setTimeout(() => {
        setLoadingStep(1);
        parseWorkoutCSVAsyncWithUnit(storedCSV, { unit: getWeightUnit() })
          .then((result: ParseWorkoutCsvResult) => {
            setLoadingStep(2);
            const enriched = identifyPersonalRecords(result.sets);
            setParsedData(enriched);
            setHevyLoginError(null);
            setCsvImportError(null);
          })
          .catch((err) => {
            clearCSVData();
            saveSetupComplete(false);
            setCsvImportError(getErrorMessage(err));
            setOnboarding({ intent: 'initial', step: 'platform' });
          })
          .finally(() => {
            finishProgress(startedAt);
          });
      }, 0);
      return;
    }

    if (storedChoice === 'lyfta') {
      const lyfatApiKey = getLyfataApiKey();
      if (lastMethod === 'apiKey' && lyfatApiKey) {
        setLoadingKind('lyfta');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        Promise.resolve()
          .then(() => {
            setLoadingStep(1);
            return lyfatBackendGetSets<WorkoutSet>(lyfatApiKey);
          })
          .then((resp) => {
            setLoadingStep(2);
            const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
            const enriched = identifyPersonalRecords(hydrated);
            setParsedData(enriched);
            setLyfatLoginError(null);
            setCsvImportError(null);
          })
          .catch((err) => {
            clearLyfataApiKey();
            saveSetupComplete(false);
            setLyfatLoginError(getHevyErrorMessage(err));
            setOnboarding({ intent: 'initial', step: 'platform' });
          })
          .finally(() => {
            finishProgress(startedAt);
          });
        return;
      }

      if (shouldUseCsv) {
        if (!storedCSV || lastCsvPlatform !== 'lyfta') {
          saveSetupComplete(false);
          setOnboarding({ intent: 'initial', step: 'platform' });
          return;
        }

        setLoadingKind('csv');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        setTimeout(() => {
          setLoadingStep(1);
          parseWorkoutCSVAsyncWithUnit(storedCSV, { unit: getWeightUnit() })
            .then((result: ParseWorkoutCsvResult) => {
              setLoadingStep(2);
              const enriched = identifyPersonalRecords(result.sets);
              setParsedData(enriched);
              setLyfatLoginError(null);
              setCsvImportError(null);
            })
            .catch((err) => {
              clearCSVData();
              saveSetupComplete(false);
              setCsvImportError(getErrorMessage(err));
              setOnboarding({ intent: 'initial', step: 'platform' });
            })
            .finally(() => {
              finishProgress(startedAt);
            });
        }, 0);
        return;
      }

      // Fallback for older setups: prefer API key, then CSV, otherwise restart.
      if (lyfatApiKey) {
        setLoadingKind('lyfta');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        Promise.resolve()
          .then(() => {
            setLoadingStep(1);
            return lyfatBackendGetSets<WorkoutSet>(lyfatApiKey);
          })
          .then((resp) => {
            setLoadingStep(2);
            const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
            const enriched = identifyPersonalRecords(hydrated);
            setParsedData(enriched);
            setLyfatLoginError(null);
            setCsvImportError(null);
          })
          .catch((err) => {
            clearLyfataApiKey();
            saveSetupComplete(false);
            setLyfatLoginError(getHevyErrorMessage(err));
            setOnboarding({ intent: 'initial', step: 'platform' });
          })
          .finally(() => {
            finishProgress(startedAt);
          });
        return;
      }

      if (storedCSV && lastCsvPlatform === 'lyfta') {
        setLoadingKind('csv');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        setTimeout(() => {
          setLoadingStep(1);
          parseWorkoutCSVAsyncWithUnit(storedCSV, { unit: getWeightUnit() })
            .then((result: ParseWorkoutCsvResult) => {
              setLoadingStep(2);
              const enriched = identifyPersonalRecords(result.sets);
              setParsedData(enriched);
              setLyfatLoginError(null);
              setCsvImportError(null);
            })
            .catch((err) => {
              clearCSVData();
              saveSetupComplete(false);
              setCsvImportError(getErrorMessage(err));
              setOnboarding({ intent: 'initial', step: 'platform' });
            })
            .finally(() => {
              finishProgress(startedAt);
            });
        }, 0);
        return;
      }

      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    if (storedChoice === 'hevy' && shouldUseCsv) {
      if (!storedCSV || lastCsvPlatform !== 'hevy') {
        saveSetupComplete(false);
        setOnboarding({ intent: 'initial', step: 'platform' });
        return;
      }

      setLoadingKind('csv');
      setIsAnalyzing(true);
      setLoadingStep(0);
      const startedAt = startProgress();
      setTimeout(() => {
        setLoadingStep(1);
        parseWorkoutCSVAsyncWithUnit(storedCSV, { unit: getWeightUnit() })
          .then((result: ParseWorkoutCsvResult) => {
            setLoadingStep(2);
            const enriched = identifyPersonalRecords(result.sets);
            setParsedData(enriched);
            setHevyLoginError(null);
            setCsvImportError(null);
          })
          .catch((err) => {
            clearCSVData();
            saveSetupComplete(false);
            setCsvImportError(getErrorMessage(err));
            setOnboarding({ intent: 'initial', step: 'platform' });
          })
          .finally(() => {
            finishProgress(startedAt);
          });
      }, 0);
      return;
    }

    const hevyProApiKey = getHevyProApiKey();
    if (storedChoice === 'hevy' && lastMethod === 'apiKey' && hevyProApiKey) {
      setLoadingKind('hevy');
      setIsAnalyzing(true);
      setLoadingStep(0);
      const startedAt = startProgress();
      Promise.resolve()
        .then(() => {
          setLoadingStep(1);
          return hevyBackendGetSetsWithProApiKey<WorkoutSet>(hevyProApiKey);
        })
        .then((resp) => {
          setLoadingStep(2);
          const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
          const enriched = identifyPersonalRecords(hydrated);
          setParsedData(enriched);
          setHevyLoginError(null);
          setCsvImportError(null);
        })
        .catch((err) => {
          clearHevyProApiKey();
          saveSetupComplete(false);
          setHevyLoginError(getHevyErrorMessage(err));
          setOnboarding({ intent: 'initial', step: 'platform' });
        })
        .finally(() => {
          finishProgress(startedAt);
        });
      return;
    }

    const token = getHevyAuthToken();
    if (storedChoice === 'hevy' && lastMethod === 'credentials' && !token) {
      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    // Backwards-compatible fallback for existing users: prefer API key or credentials,
    // only using CSV when the last method indicates CSV.
    if (storedChoice === 'hevy' && !lastMethod) {
      if (hevyProApiKey) {
        setLoadingKind('hevy');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        Promise.resolve()
          .then(() => {
            setLoadingStep(1);
            return hevyBackendGetSetsWithProApiKey<WorkoutSet>(hevyProApiKey);
          })
          .then((resp) => {
            setLoadingStep(2);
            const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
            const enriched = identifyPersonalRecords(hydrated);
            setParsedData(enriched);
            setHevyLoginError(null);
            setCsvImportError(null);
          })
          .catch((err) => {
            clearHevyProApiKey();
            saveSetupComplete(false);
            setHevyLoginError(getHevyErrorMessage(err));
            setOnboarding({ intent: 'initial', step: 'platform' });
          })
          .finally(() => {
            finishProgress(startedAt);
          });
        return;
      }
      if (token) {
        setLoadingKind('hevy');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        Promise.resolve()
          .then(() => hevyBackendGetAccount(token))
          .then(({ username }) => {
            setLoadingStep(1);
            return hevyBackendGetSets<WorkoutSet>(token, username);
          })
          .then((resp) => {
            setLoadingStep(2);
            const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
            const enriched = identifyPersonalRecords(hydrated);
            setParsedData(enriched);
            setHevyLoginError(null);
            setCsvImportError(null);
          })
          .catch((err) => {
            clearHevyAuthToken();
            saveSetupComplete(false);
            setHevyLoginError(getHevyErrorMessage(err));
            setOnboarding({ intent: 'initial', step: 'platform' });
          })
          .finally(() => {
            finishProgress(startedAt);
          });
        return;
      }
      if (storedCSV && lastCsvPlatform === 'hevy') {
        setLoadingKind('csv');
        setIsAnalyzing(true);
        setLoadingStep(0);
        const startedAt = startProgress();
        setTimeout(() => {
          setLoadingStep(1);
          parseWorkoutCSVAsyncWithUnit(storedCSV, { unit: getWeightUnit() })
            .then((result: ParseWorkoutCsvResult) => {
              setLoadingStep(2);
              const enriched = identifyPersonalRecords(result.sets);
              setParsedData(enriched);
              setHevyLoginError(null);
              setCsvImportError(null);
            })
            .catch((err) => {
              clearCSVData();
              saveSetupComplete(false);
              setCsvImportError(getErrorMessage(err));
              setOnboarding({ intent: 'initial', step: 'platform' });
            })
            .finally(() => {
              finishProgress(startedAt);
            });
        }, 0);
        return;
      }
      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    if (storedChoice === 'hevy' && lastMethod === 'apiKey' && !hevyProApiKey) {
      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    if (storedChoice !== 'hevy') {
      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    if (!token) {
      saveSetupComplete(false);
      setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();
    Promise.resolve()
      .then(() => hevyBackendGetAccount(token))
      .then(({ username }) => {
        setLoadingStep(1);
        return hevyBackendGetSets<WorkoutSet>(token, username);
      })
      .then((resp) => {
        setLoadingStep(2);
        trackEvent('hevy_sync_success', { method: 'saved_auth_token', workouts: resp.meta?.workouts });
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setHevyLoginError(null);
        setCsvImportError(null);
      })
      .catch((err) => {
        trackEvent('hevy_sync_error', { method: 'saved_auth_token' });
        clearHevyAuthToken();
        saveSetupComplete(false);
        setHevyLoginError(getHevyErrorMessage(err));
        setOnboarding({ intent: 'initial', step: 'platform' });
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  }, []);
};
