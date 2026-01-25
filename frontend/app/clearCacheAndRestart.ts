import { trackEvent } from '../utils/integrations/analytics';
import { computationCache } from '../utils/storage/computationCache';
import {
  clearBodyMapGender,
  clearCSVData,
  clearDateMode,
  clearPreferencesConfirmed,
  clearThemeMode,
  clearWeightUnit,
} from '../utils/storage/localStorage';
import {
  clearDataSourceChoice,
  clearHevyAuthToken,
  clearHevyProApiKey,
  clearLastCsvPlatform,
  clearLastLoginMethod,
  clearLyfataApiKey,
  clearSetupComplete,
} from '../utils/storage/dataSourceStorage';
import { clearHevyCredentials } from '../utils/storage/hevyCredentialsStorage';

export const clearCacheAndRestart = (): void => {
  trackEvent('cache_clear', {});
  clearCSVData();
  clearHevyAuthToken();
  clearHevyProApiKey();
  clearHevyCredentials();
  clearLyfataApiKey();
  clearDataSourceChoice();
  clearLastCsvPlatform();
  clearLastLoginMethod();
  clearSetupComplete();
  clearWeightUnit();
  clearBodyMapGender();
  clearPreferencesConfirmed();
  clearThemeMode();
  clearDateMode();
  computationCache.clear();
  window.location.reload();
};
