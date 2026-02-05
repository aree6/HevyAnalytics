import { useCallback } from 'react';
import { trackEvent } from '../../utils/integrations/analytics';
import { getPreferencesConfirmed } from '../../utils/storage/localStorage';
import type { OnboardingFlow } from '../onboarding/types';

interface UpdateFlowArgs {
  dataSource: string | null;
  setOnboarding: (next: OnboardingFlow | null) => void;
  clearCsvImportError: () => void;
  clearHevyLoginError: () => void;
  clearLyfatLoginError: () => void;
}

export const useUpdateFlowHandler = ({
  dataSource,
  setOnboarding,
  clearCsvImportError,
  clearHevyLoginError,
  clearLyfatLoginError,
}: UpdateFlowArgs) => {
  return useCallback(() => {
    trackEvent('update_flow_open', { data_source: dataSource ?? 'unknown' });
    clearCsvImportError();
    clearHevyLoginError();
    clearLyfatLoginError();

    if (dataSource === 'strong') {
      setOnboarding({ intent: 'update', step: 'strong_prefs', platform: 'strong' });
      return;
    }
    if (dataSource === 'lyfta') {
      if (!getPreferencesConfirmed()) {
        setOnboarding({ intent: 'update', step: 'lyfta_prefs', platform: 'lyfta' });
        return;
      }
      setOnboarding({ intent: 'update', step: 'lyfta_login', platform: 'lyfta' });
      return;
    }
    if (dataSource === 'hevy') {
      if (!getPreferencesConfirmed()) {
        setOnboarding({ intent: 'update', step: 'hevy_prefs', platform: 'hevy' });
        return;
      }
      setOnboarding({ intent: 'update', step: 'hevy_login', platform: 'hevy' });
      return;
    }
    if (dataSource === 'other') {
      if (!getPreferencesConfirmed()) {
        setOnboarding({ intent: 'update', step: 'other_prefs', platform: 'other' });
        return;
      }
      setOnboarding({ intent: 'update', step: 'other_csv', platform: 'other', backStep: 'other_prefs' });
      return;
    }
    setOnboarding({ intent: 'update', step: 'platform' });
  }, [dataSource, clearCsvImportError, clearHevyLoginError, clearLyfatLoginError, setOnboarding]);
};
