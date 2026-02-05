import { useEffect } from 'react';

import { getCSVData, getPreferencesConfirmed, getWeightUnit, savePreferencesConfirmed } from '../../utils/storage/localStorage';
import {
  getDataSourceChoice,
  getHevyAuthToken,
  getHevyProApiKey,
  getLastCsvPlatform,
  getLastLoginMethod,
  getLyfataApiKey,
  getSetupComplete,
  saveSetupComplete,
} from '../../utils/storage/dataSourceStorage';
import { getHevyUsernameOrEmail } from '../../utils/storage/hevyCredentialsStorage';

import { loadCsvAuto } from './startupAutoLoadCsv';
import { loadLyftaFromApiKey } from './startupAutoLoadLyfta';
import { loadHevyFromProKey, loadHevyFromToken } from './startupAutoLoadHevy';
import type { StartupAutoLoadParams } from './startupAutoLoadTypes';

export type { StartupAutoLoadParams } from './startupAutoLoadTypes';

export const useStartupAutoLoad = (params: StartupAutoLoadParams): void => {
  useEffect(() => {
    if (!getSetupComplete()) return;

    if (!getPreferencesConfirmed()) {
      savePreferencesConfirmed(true);
    }

    const storedChoice = getDataSourceChoice();
    if (!storedChoice) {
      saveSetupComplete(false);
      params.setOnboarding({ intent: 'initial', step: 'platform' });
      return;
    }

    params.setDataSource(storedChoice);

    const hevyAccountKey = storedChoice === 'hevy' ? (getHevyUsernameOrEmail() ?? undefined) : undefined;
    const lastMethod = getLastLoginMethod(storedChoice, hevyAccountKey);

    const storedCSV = getCSVData();
    const lastCsvPlatform = getLastCsvPlatform();
    const shouldUseCsv = lastMethod === 'csv' || (!lastMethod && storedCSV && lastCsvPlatform === storedChoice);
    const weightUnit = getWeightUnit();

    const resetToPlatform = () => {
      saveSetupComplete(false);
      params.setOnboarding({ intent: 'initial', step: 'platform' });
    };

    if (storedChoice === 'strong' || storedChoice === 'other') {
      if (!storedCSV || lastCsvPlatform !== storedChoice) {
        resetToPlatform();
        return;
      }

      loadCsvAuto(params, {
        platform: storedChoice,
        storedCSV,
        weightUnit,
        clearLoginErrors: () => params.setHevyLoginError(null),
      });
      return;
    }

    if (storedChoice === 'lyfta') {
      const lyfatApiKey = getLyfataApiKey();
      if (lastMethod === 'apiKey' && lyfatApiKey) {
        loadLyftaFromApiKey(params, lyfatApiKey);
        return;
      }

      if (shouldUseCsv) {
        if (!storedCSV || lastCsvPlatform !== 'lyfta') {
          resetToPlatform();
          return;
        }

        loadCsvAuto(params, {
          platform: 'lyfta',
          storedCSV,
          weightUnit,
          clearLoginErrors: () => params.setLyfatLoginError(null),
        });
        return;
      }

      if (lyfatApiKey) {
        loadLyftaFromApiKey(params, lyfatApiKey);
        return;
      }

      if (storedCSV && lastCsvPlatform === 'lyfta') {
        loadCsvAuto(params, {
          platform: 'lyfta',
          storedCSV,
          weightUnit,
          clearLoginErrors: () => params.setLyfatLoginError(null),
        });
        return;
      }

      resetToPlatform();
      return;
    }

    if (storedChoice === 'hevy' && shouldUseCsv) {
      if (!storedCSV || lastCsvPlatform !== 'hevy') {
        resetToPlatform();
        return;
      }

      loadCsvAuto(params, {
        platform: 'hevy',
        storedCSV,
        weightUnit,
        clearLoginErrors: () => params.setHevyLoginError(null),
      });
      return;
    }

    const hevyProApiKey = getHevyProApiKey();
    if (storedChoice === 'hevy' && lastMethod === 'apiKey' && hevyProApiKey) {
      loadHevyFromProKey(params, hevyProApiKey);
      return;
    }

    const token = getHevyAuthToken();
    if (storedChoice === 'hevy' && lastMethod === 'credentials' && !token) {
      resetToPlatform();
      return;
    }

    if (storedChoice === 'hevy' && !lastMethod) {
      if (hevyProApiKey) {
        loadHevyFromProKey(params, hevyProApiKey);
        return;
      }
      if (token) {
        loadHevyFromToken(params, token);
        return;
      }
      if (storedCSV && lastCsvPlatform === 'hevy') {
        loadCsvAuto(params, {
          platform: 'hevy',
          storedCSV,
          weightUnit,
          clearLoginErrors: () => params.setHevyLoginError(null),
        });
        return;
      }
      resetToPlatform();
      return;
    }

    if (storedChoice === 'hevy' && lastMethod === 'apiKey' && !hevyProApiKey) {
      resetToPlatform();
      return;
    }

    if (storedChoice !== 'hevy') {
      resetToPlatform();
      return;
    }

    if (!token) {
      resetToPlatform();
      return;
    }

    loadHevyFromToken(params, token, { successMethod: 'saved_auth_token', errorMethod: 'saved_auth_token' });
  }, []);
};
