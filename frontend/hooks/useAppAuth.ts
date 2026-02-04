import { useState, useCallback } from 'react';
import { WorkoutSet } from '../types';
import { WeightUnit } from '../utils/storage/localStorage';
import type { DataSourceChoice } from '../utils/dataSources/types';
import {
  getHevyAuthToken,
  saveHevyAuthToken,
  clearHevyAuthToken,
  getHevyProApiKey,
  saveHevyProApiKey,
  clearHevyProApiKey,
  getLyfataApiKey,
  saveLyfataApiKey,
  clearLyfataApiKey,
  saveLastCsvPlatform,
  saveLastLoginMethod,
  saveSetupComplete,
} from '../utils/storage/dataSourceStorage';
import { getHevyUsernameOrEmail, saveHevyPassword, saveHevyUsernameOrEmail } from '../utils/storage/hevyCredentialsStorage';
import { saveCSVData } from '../utils/storage/localStorage';
import { hevyBackendGetAccount, hevyBackendGetSets, hevyBackendGetSetsWithProApiKey, hevyBackendLogin, hevyBackendValidateProApiKey } from '../utils/api/hevyBackend';
import { lyfatBackendGetSets } from '../utils/api/lyfataBackend';
import { identifyPersonalRecords } from '../utils/analysis/analytics';
import { hydrateBackendWorkoutSets } from '../app/hydrateBackendWorkoutSets';
import { getErrorMessage, getHevyErrorMessage, getLyfatErrorMessage } from '../app/appErrorMessages';
import { parseWorkoutCSVAsyncWithUnit, ParseWorkoutCsvResult } from '../utils/csv/csvParser';
import { trackEvent } from '../utils/integrations/analytics';
import type { OnboardingFlow } from '../app/onboarding/types';

export interface UseAppAuthReturn {
  hevyLoginError: string | null;
  lyfatLoginError: string | null;
  csvImportError: string | null;
  loadingKind: 'hevy' | 'lyfta' | 'csv' | null;
  isAnalyzing: boolean;
  loadingStep: number;
  progress: number;
  startProgress: () => number;
  finishProgress: (startedAt: number) => void;
  handleHevySyncSaved: () => void;
  handleHevyApiKeyLogin: (apiKey: string) => void;
  handleHevyLogin: (emailOrUsername: string, password: string) => void;
  handleLyfatSyncSaved: () => void;
  handleLyfatLogin: (apiKey: string) => void;
  processFile: (file: File, platform: DataSourceChoice, unitOverride?: WeightUnit) => void;
  clearHevyLoginError: () => void;
  clearLyfatLoginError: () => void;
  clearCsvImportError: () => void;
}

export interface UseAppAuthProps {
  weightUnit: WeightUnit;
  setParsedData: (data: WorkoutSet[]) => void;
  setDataSource: (source: DataSourceChoice | null) => void;
  setOnboarding: (flow: OnboardingFlow | null) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedDay: (day: Date | null) => void;
}

export function useAppAuth({
  weightUnit,
  setParsedData,
  setDataSource,
  setOnboarding,
  setSelectedMonth,
  setSelectedDay,
}: UseAppAuthProps): UseAppAuthReturn {
  const [hevyLoginError, setHevyLoginError] = useState<string | null>(null);
  const [lyfatLoginError, setLyfatLoginError] = useState<string | null>(null);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [loadingKind, setLoadingKind] = useState<'hevy' | 'lyfta' | 'csv' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = { current: null as number | null };

  const startProgress = useCallback((): number => {
    setProgress(0);
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    const startTime = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const simulatedProgress = Math.min(90, elapsed / 50);
      setProgress(simulatedProgress);
    }, 50);
    progressTimerRef.current = interval;
    return startTime;
  }, []);

  const finishProgress = useCallback((startedAt: number): void => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setLoadingKind(null);
      setProgress(0);
    }, 300);
  }, []);

  const handleHevySyncSaved = useCallback(() => {
    const savedProKey = getHevyProApiKey();
    if (savedProKey) {
      setHevyLoginError(null);
      setLoadingKind('hevy');
      setIsAnalyzing(true);
      setLoadingStep(0);
      const startedAt = startProgress();

      Promise.resolve()
        .then(() => {
          setLoadingStep(1);
          return hevyBackendGetSetsWithProApiKey<WorkoutSet>(savedProKey);
        })
        .then((resp) => {
          setLoadingStep(2);
          const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
          const enriched = identifyPersonalRecords(hydrated);
          setParsedData(enriched);
          saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);
          setDataSource('hevy');
          saveSetupComplete(true);
          setOnboarding(null);
        })
        .catch((err) => {
          clearHevyProApiKey();
          setHevyLoginError(getHevyErrorMessage(err));
        })
        .finally(() => {
          finishProgress(startedAt);
        });
      return;
    }

    const token = getHevyAuthToken();
    if (!token) return;

    setHevyLoginError(null);
    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    hevyBackendGetAccount(token)
      .then(({ username }) => {
        setLoadingStep(1);
        return hevyBackendGetSets<WorkoutSet>(token, username);
      })
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        saveLastLoginMethod('hevy', 'credentials', getHevyUsernameOrEmail() ?? undefined);
        setDataSource('hevy');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        clearHevyAuthToken();
        setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  }, [startProgress, finishProgress, setParsedData, setDataSource, setOnboarding]);

  const handleHevyApiKeyLogin = useCallback((apiKey: string) => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setHevyLoginError('Missing API key.');
      return;
    }

    trackEvent('hevy_sync_start', { method: 'pro_api_key' });

    setHevyLoginError(null);
    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    Promise.resolve()
      .then(() => hevyBackendValidateProApiKey(trimmed))
      .then((valid) => {
        if (!valid) throw new Error('Invalid API key. Please check your Hevy Pro API key and try again.');
        saveHevyProApiKey(trimmed);
        saveLastLoginMethod('hevy', 'apiKey', getHevyUsernameOrEmail() ?? undefined);
        setLoadingStep(1);
        return hevyBackendGetSetsWithProApiKey<WorkoutSet>(trimmed);
      })
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('hevy');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('hevy_sync_error', { method: 'pro_api_key' });
        clearHevyProApiKey();
        setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  }, [startProgress, finishProgress, setParsedData, setDataSource, setOnboarding]);

  const handleHevyLogin = useCallback((emailOrUsername: string, password: string) => {
    trackEvent('hevy_sync_start', { method: 'credentials' });
    setHevyLoginError(null);
    setLoadingKind('hevy');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

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
        setLoadingStep(1);
        return hevyBackendGetSets<WorkoutSet>(token, username);
      })
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('hevy');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('hevy_sync_error', { method: 'credentials' });
        setHevyLoginError(getHevyErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  }, [startProgress, finishProgress, setParsedData, setDataSource, setOnboarding]);

  const handleLyfatSyncSaved = useCallback(() => {
    const apiKey = getLyfataApiKey();
    if (!apiKey) return;

    trackEvent('lyfta_sync_start', { method: 'saved_api_key' });

    setLyfatLoginError(null);
    setLoadingKind('lyfta');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    lyfatBackendGetSets<WorkoutSet>(apiKey)
      .then((resp) => {
        setLoadingStep(2);
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('lyfta');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('lyfta_sync_error', { method: 'saved_api_key' });
        clearLyfataApiKey();
        setLyfatLoginError(getLyfatErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  }, [startProgress, finishProgress, setParsedData, setDataSource, setOnboarding]);

  const handleLyfatLogin = useCallback((apiKey: string) => {
    trackEvent('lyfta_sync_start', { method: 'api_key' });
    setLyfatLoginError(null);
    setLoadingKind('lyfta');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    lyfatBackendGetSets<WorkoutSet>(apiKey)
      .then((resp) => {
        setLoadingStep(2);
        trackEvent('lyfta_sync_success', { method: 'api_key', workouts: resp.meta?.workouts });
        saveLyfataApiKey(apiKey);
        saveLastLoginMethod('lyfta', 'apiKey');
        const hydrated = hydrateBackendWorkoutSets(resp.sets ?? []);
        const enriched = identifyPersonalRecords(hydrated);
        setParsedData(enriched);
        setDataSource('lyfta');
        saveSetupComplete(true);
        setOnboarding(null);
      })
      .catch((err) => {
        trackEvent('lyfta_sync_error', { method: 'api_key' });
        setLyfatLoginError(getLyfatErrorMessage(err));
      })
      .finally(() => {
        finishProgress(startedAt);
      });
  }, [startProgress, finishProgress, setParsedData, setDataSource, setOnboarding]);

  const processFile = useCallback((file: File, platform: DataSourceChoice, unitOverride?: WeightUnit) => {
    trackEvent('csv_import_start', { platform, unit: unitOverride ?? weightUnit });
    setLoadingKind('csv');
    setIsAnalyzing(true);
    setLoadingStep(0);
    const startedAt = startProgress();

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setCsvImportError(null);
        setLoadingStep(1);
        const unit = unitOverride ?? weightUnit;
        parseWorkoutCSVAsyncWithUnit(text, { unit })
          .then((result: ParseWorkoutCsvResult) => {
            setLoadingStep(2);
            const enriched = identifyPersonalRecords(result.sets);
            trackEvent('csv_import_success', {
              platform,
              unit,
              sets: result.sets?.length,
              enriched_sets: enriched?.length,
            });
            setParsedData(enriched);
            saveCSVData(text);
            saveLastCsvPlatform(platform);
            saveLastLoginMethod(platform, 'csv', platform === 'hevy' ? (getHevyUsernameOrEmail() ?? undefined) : undefined);
            setDataSource(platform);
            saveSetupComplete(true);
            setOnboarding(null);
          })
          .catch((err) => {
            trackEvent('csv_import_error', { platform });
            setCsvImportError(getErrorMessage(err));
          })
          .finally(() => {
            setSelectedMonth('all');
            setSelectedDay(null);
            finishProgress(startedAt);
          });
      }
    };
    reader.readAsText(file);
  }, [weightUnit, startProgress, finishProgress, setParsedData, setDataSource, setOnboarding, setSelectedMonth, setSelectedDay]);

  return {
    hevyLoginError,
    lyfatLoginError,
    csvImportError,
    loadingKind,
    isAnalyzing,
    loadingStep,
    progress,
    startProgress,
    finishProgress,
    handleHevySyncSaved,
    handleHevyApiKeyLogin,
    handleHevyLogin,
    handleLyfatSyncSaved,
    handleLyfatLogin,
    processFile,
    clearHevyLoginError: () => setHevyLoginError(null),
    clearLyfatLoginError: () => setLyfatLoginError(null),
    clearCsvImportError: () => setCsvImportError(null),
  };
}
