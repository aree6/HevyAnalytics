import React from 'react';
import type { OnboardingFlow } from '../../app/onboarding/types';
import { HevyLoginModal } from '../modals/auth/HevyLoginModal';
import { LyfataLoginModal } from '../modals/auth/LyfataLoginModal';
import { getHevyAuthToken, getHevyProApiKey, getLyfataApiKey } from '../../utils/storage/dataSourceStorage';
import { getPreferencesConfirmed } from '../../utils/storage/localStorage';

interface HevyLoginStepProps {
  intent: OnboardingFlow['intent'];
  hevyLoginError: string | null;
  isAnalyzing: boolean;
  onHevyLogin: (emailOrUsername: string, password: string) => void;
  onHevyApiKeyLogin: (apiKey: string) => void;
  onHevySyncSaved: () => void;
  onClearCacheAndRestart: () => void;
  onSetOnboarding: (next: OnboardingFlow | null) => void;
}

export const HevyLoginStep: React.FC<HevyLoginStepProps> = ({
  intent,
  hevyLoginError,
  isAnalyzing,
  onHevyLogin,
  onHevyApiKeyLogin,
  onHevySyncSaved,
  onClearCacheAndRestart,
  onSetOnboarding,
}) => (
  <HevyLoginModal
    intent={intent}
    initialMode={getHevyProApiKey() ? 'apiKey' : 'credentials'}
    errorMessage={hevyLoginError}
    isLoading={isAnalyzing}
    onLogin={onHevyLogin}
    onLoginWithApiKey={onHevyApiKeyLogin}
    loginLabel={intent === 'initial' ? 'Continue' : 'Login with Hevy'}
    apiKeyLoginLabel={intent === 'initial' ? 'Continue' : 'Continue with API key'}
    hasSavedSession={Boolean(getHevyAuthToken() || getHevyProApiKey()) && getPreferencesConfirmed()}
    onSyncSaved={onHevySyncSaved}
    onClearCache={onClearCacheAndRestart}
    onImportCsv={() => onSetOnboarding({ intent, step: 'hevy_csv', platform: 'hevy', backStep: 'hevy_login' })}
    onBack={
      intent === 'initial'
        ? () => onSetOnboarding({ intent, step: 'hevy_prefs', platform: 'hevy' })
        : () => onSetOnboarding({ intent: 'initial', step: 'platform' })
    }
    onClose={intent === 'update' ? () => onSetOnboarding(null) : undefined}
  />
);

interface LyftaLoginStepProps {
  intent: OnboardingFlow['intent'];
  lyfatLoginError: string | null;
  isAnalyzing: boolean;
  onLyfatLogin: (apiKey: string) => void;
  onLyfatSyncSaved: () => void;
  onClearCacheAndRestart: () => void;
  onSetOnboarding: (next: OnboardingFlow | null) => void;
}

export const LyftaLoginStep: React.FC<LyftaLoginStepProps> = ({
  intent,
  lyfatLoginError,
  isAnalyzing,
  onLyfatLogin,
  onLyfatSyncSaved,
  onClearCacheAndRestart,
  onSetOnboarding,
}) => (
  <LyfataLoginModal
    intent={intent}
    errorMessage={lyfatLoginError}
    isLoading={isAnalyzing}
    onLogin={onLyfatLogin}
    loginLabel={intent === 'initial' ? 'Continue' : 'Login with Lyfta'}
    hasSavedSession={Boolean(getLyfataApiKey()) && getPreferencesConfirmed()}
    onSyncSaved={onLyfatSyncSaved}
    onClearCache={onClearCacheAndRestart}
    onImportCsv={() => onSetOnboarding({ intent, step: 'lyfta_csv', platform: 'lyfta', backStep: 'lyfta_login' })}
    onBack={
      intent === 'initial'
        ? () => onSetOnboarding({ intent, step: 'lyfta_prefs', platform: 'lyfta' })
        : () => onSetOnboarding({ intent: 'initial', step: 'platform' })
    }
    onClose={intent === 'update' ? () => onSetOnboarding(null) : undefined}
  />
);
