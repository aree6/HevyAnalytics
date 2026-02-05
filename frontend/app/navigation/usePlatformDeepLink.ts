import type React from 'react';
import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import type { OnboardingFlow } from './onboarding/types';
import { trackEvent } from '../../utils/integrations/analytics';
import { getSetupComplete } from '../../utils/storage/dataSourceStorage';

export const usePlatformDeepLink = ({
  location,
  navigate,
  setOnboarding,
  platformQueryConsumedRef,
}: {
  location: { pathname: string; search: string };
  navigate: NavigateFunction;
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingFlow | null>>;
  platformQueryConsumedRef: React.MutableRefObject<boolean>;
}): void => {
  useEffect(() => {
    if (platformQueryConsumedRef.current) return;
    const params = new URLSearchParams(location.search);
    const platform = params.get('platform');
    if (!platform) return;

    const isKnown = platform === 'hevy' || platform === 'strong' || platform === 'lyfta' || platform === 'other';
    if (!isKnown) return;

    trackEvent('deep_link_platform', { platform });

    platformQueryConsumedRef.current = true;

    const intent = getSetupComplete() ? 'update' : 'initial';

    if (platform === 'strong') {
      setOnboarding({ intent, step: 'strong_prefs', platform: 'strong' });
    } else if (platform === 'lyfta') {
      setOnboarding({ intent, step: 'lyfta_prefs', platform: 'lyfta' });
    } else if (platform === 'other') {
      setOnboarding({ intent, step: 'other_prefs', platform: 'other' });
    } else {
      setOnboarding({ intent, step: 'hevy_prefs', platform: 'hevy' });
    }

    params.delete('platform');
    const nextSearch = params.toString();
    navigate(
      { pathname: location.pathname || '/', search: nextSearch ? `?${nextSearch}` : '' },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate, platformQueryConsumedRef, setOnboarding]);
};
