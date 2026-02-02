import React, { useEffect } from 'react';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import type { WeightUnit } from '../../utils/storage/localStorage';
import type { OnboardingFlow } from '../../app/onboarding/types';
import { LandingPage } from '../landing/LandingPage';
import { CSVImportModal } from '../modals/CSVImportModal';
import { HevyLoginModal } from '../modals/HevyLoginModal';
import { LyfataLoginModal } from '../modals/LyfataLoginModal';
import {
  getHevyAuthToken,
  getHevyProApiKey,
  getLyfataApiKey,
} from '../../utils/storage/dataSourceStorage';
import {
  getPreferencesConfirmed,
  savePreferencesConfirmed,
} from '../../utils/storage/localStorage';

interface AppOnboardingLayerProps {
  onboarding: OnboardingFlow | null;
  dataSource: 'strong' | 'hevy' | 'lyfta' | 'other' | null;

  bodyMapGender: BodyMapGender;
  weightUnit: WeightUnit;

  isAnalyzing: boolean;
  csvImportError: string | null;
  hevyLoginError: string | null;
  lyfatLoginError: string | null;

  onSetOnboarding: (next: OnboardingFlow | null) => void;

  onSetBodyMapGender: (g: BodyMapGender) => void;
  onSetWeightUnit: (u: WeightUnit) => void;

  onSetCsvImportError: (msg: string | null) => void;
  onSetHevyLoginError: (msg: string | null) => void;
  onSetLyfatLoginError: (msg: string | null) => void;

  onClearCacheAndRestart: () => void;

  onProcessFile: (file: File, platform: 'strong' | 'hevy' | 'lyfta' | 'other', unitOverride?: WeightUnit) => void;

  onHevyLogin: (emailOrUsername: string, password: string) => void;
  onHevyApiKeyLogin: (apiKey: string) => void;
  onHevySyncSaved: () => void;

  onLyfatLogin: (apiKey: string) => void;
  onLyfatSyncSaved: () => void;
}

export const AppOnboardingLayer: React.FC<AppOnboardingLayerProps> = ({
  onboarding,
  dataSource,
  bodyMapGender,
  weightUnit,
  isAnalyzing,
  csvImportError,
  hevyLoginError,
  lyfatLoginError,
  onSetOnboarding,
  onSetBodyMapGender,
  onSetWeightUnit,
  onSetCsvImportError,
  onSetHevyLoginError,
  onSetLyfatLoginError,
  onClearCacheAndRestart,
  onProcessFile,
  onHevyLogin,
  onHevyApiKeyLogin,
  onHevySyncSaved,
  onLyfatLogin,
  onLyfatSyncSaved,
}) => {
  // Auto-load demo data when entering demo_csv step
  useEffect(() => {
    if (onboarding?.step === 'demo_csv' && !isAnalyzing) {
      // Fetch and process the sample CSV automatically
      fetch(`${import.meta.env.BASE_URL}sample_demo.csv`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to load demo data');
          }
          return response.text();
        })
        .then((csvText) => {
          onSetCsvImportError(null);
          // Create a File object from the CSV text to reuse existing processFile logic
          const file = new File([csvText], 'sample_demo.csv', { type: 'text/csv' });
          onProcessFile(file, 'other', weightUnit);
        })
        .catch((err) => {
          onSetCsvImportError('Failed to load demo data. Please try again.');
        });
    }
  }, [onboarding?.step, isAnalyzing, weightUnit, onSetCsvImportError, onProcessFile]);

  if (!onboarding) return null;

  return (
    <>
      {/* Landing page for initial visitors - shows real content for SEO/AdSense */}
      {onboarding.intent === 'initial' && onboarding.step === 'platform' ? (
        <LandingPage
          onSelectPlatform={(source) => {
            onSetCsvImportError(null);
            onSetHevyLoginError(null);
            onSetLyfatLoginError(null);
            if (source === 'strong') {
              onSetOnboarding({ intent: onboarding.intent, step: 'strong_prefs', platform: 'strong' });
              return;
            }
            if (source === 'lyfta') {
              onSetOnboarding({ intent: onboarding.intent, step: 'lyfta_prefs', platform: 'lyfta' });
              return;
            }
            if (source === 'other') {
              onSetOnboarding({ intent: onboarding.intent, step: 'other_prefs', platform: 'other' });
              return;
            }
            onSetOnboarding({ intent: onboarding.intent, step: 'hevy_prefs', platform: 'hevy' });
          }}
          onTryDemo={() => {
            onSetCsvImportError(null);
            onSetHevyLoginError(null);
            onSetLyfatLoginError(null);
            onSetOnboarding({ intent: 'initial', step: 'demo_prefs', platform: 'other' });
          }}
        />
      ) : null}

      {/* Modal for update flow only */}
      {onboarding.intent === 'update' && onboarding.step === 'platform' ? (
        <LandingPage
          onSelectPlatform={(source) => {
            onSetCsvImportError(null);
            onSetHevyLoginError(null);
            onSetLyfatLoginError(null);
            if (source === 'strong') {
              onSetOnboarding({ intent: onboarding.intent, step: 'strong_prefs', platform: 'strong' });
              return;
            }
            if (source === 'lyfta') {
              onSetOnboarding({ intent: onboarding.intent, step: 'lyfta_prefs', platform: 'lyfta' });
              return;
            }
            if (source === 'other') {
              onSetOnboarding({ intent: onboarding.intent, step: 'other_prefs', platform: 'other' });
              return;
            }
            onSetOnboarding({ intent: onboarding.intent, step: 'hevy_prefs', platform: 'hevy' });
          }}
          onTryDemo={() => {
            onSetCsvImportError(null);
            onSetHevyLoginError(null);
            onSetLyfatLoginError(null);
            onSetOnboarding({ intent: 'initial', step: 'demo_prefs', platform: 'other' });
          }}
        />
      ) : null}

      {/* Demo preferences step */}
      {onboarding.step === 'demo_prefs' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="other"
          variant="preferences"
          continueLabel="Try Demo"
          isLoading={isAnalyzing}
          initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
          initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          onContinue={(gender, unit) => {
            onSetBodyMapGender(gender);
            onSetWeightUnit(unit);
            savePreferencesConfirmed(true);
            onSetOnboarding({ intent: onboarding.intent, step: 'demo_csv', platform: 'other', backStep: 'demo_prefs' });
          }}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
              : () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {/* Demo CSV step - automatically load sample data */}
      {onboarding.step === 'demo_csv' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="other"
          variant="csv"
          hideBodyTypeAndUnit={true}
          onClearCache={onClearCacheAndRestart}
          onFileSelect={(_file, _gender, unit) => {
            // This won't be called for demo since we'll auto-load
            onSetCsvImportError(null);
            onProcessFile(_file, 'other', unit);
          }}
          isLoading={isAnalyzing}
          initialGender={bodyMapGender}
          initialUnit={weightUnit}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          errorMessage={csvImportError}
          onBack={() => {
            if (onboarding.intent === 'initial') {
              const backStep = onboarding.backStep ?? 'demo_prefs';
              onSetOnboarding({ intent: onboarding.intent, step: backStep, platform: 'other' });
              return;
            }
            onSetOnboarding({ intent: 'initial', step: 'platform' });
          }}
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'hevy_prefs' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="hevy"
          variant="preferences"
          continueLabel="Continue"
          isLoading={isAnalyzing}
          initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
          initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          onContinue={(gender, unit) => {
            onSetBodyMapGender(gender);
            onSetWeightUnit(unit);
            savePreferencesConfirmed(true);
            onSetOnboarding({ intent: onboarding.intent, step: 'hevy_login', platform: 'hevy' });
          }}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
              : () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'lyfta_prefs' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="lyfta"
          variant="preferences"
          continueLabel="Continue"
          isLoading={isAnalyzing}
          initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
          initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          onContinue={(gender, unit) => {
            onSetBodyMapGender(gender);
            onSetWeightUnit(unit);
            savePreferencesConfirmed(true);
            onSetOnboarding({ intent: onboarding.intent, step: 'lyfta_login', platform: 'lyfta' });
          }}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
              : () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'strong_prefs' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="strong"
          variant="preferences"
          continueLabel="Continue"
          isLoading={isAnalyzing}
          initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
          initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          onContinue={(gender, unit) => {
            onSetBodyMapGender(gender);
            onSetWeightUnit(unit);
            savePreferencesConfirmed(true);
            onSetOnboarding({ intent: onboarding.intent, step: 'strong_csv', platform: 'strong', backStep: 'strong_prefs' });
          }}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
              : () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'other_prefs' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="other"
          variant="preferences"
          continueLabel="Continue"
          isLoading={isAnalyzing}
          initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
          initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          onContinue={(gender, unit) => {
            onSetBodyMapGender(gender);
            onSetWeightUnit(unit);
            savePreferencesConfirmed(true);
            onSetOnboarding({ intent: onboarding.intent, step: 'other_csv', platform: 'other', backStep: 'other_prefs' });
          }}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
              : () => onSetOnboarding({ intent: onboarding.intent, step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'hevy_login' ? (
        <HevyLoginModal
          intent={onboarding.intent}
          initialMode={getHevyProApiKey() ? 'apiKey' : 'credentials'}
          errorMessage={hevyLoginError}
          isLoading={isAnalyzing}
          onLogin={onHevyLogin}
          onLoginWithApiKey={onHevyApiKeyLogin}
          loginLabel={onboarding.intent === 'initial' ? 'Continue' : 'Login with Hevy'}
          apiKeyLoginLabel={onboarding.intent === 'initial' ? 'Continue' : 'Continue with API key'}
          hasSavedSession={Boolean(getHevyAuthToken() || getHevyProApiKey()) && getPreferencesConfirmed()}
          onSyncSaved={onHevySyncSaved}
          onClearCache={onClearCacheAndRestart}
          onImportCsv={() => onSetOnboarding({ intent: onboarding.intent, step: 'hevy_csv', platform: 'hevy', backStep: 'hevy_login' })}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'hevy_prefs', platform: 'hevy' })
              : () => onSetOnboarding({ intent: 'initial', step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'lyfta_login' ? (
        <LyfataLoginModal
          intent={onboarding.intent}
          errorMessage={lyfatLoginError}
          isLoading={isAnalyzing}
          onLogin={onLyfatLogin}
          loginLabel={onboarding.intent === 'initial' ? 'Continue' : 'Login with Lyfta'}
          hasSavedSession={Boolean(getLyfataApiKey()) && getPreferencesConfirmed()}
          onSyncSaved={onLyfatSyncSaved}
          onClearCache={onClearCacheAndRestart}
          onImportCsv={() => onSetOnboarding({ intent: onboarding.intent, step: 'lyfta_csv', platform: 'lyfta', backStep: 'lyfta_login' })}
          onBack={
            onboarding.intent === 'initial'
              ? () => onSetOnboarding({ intent: onboarding.intent, step: 'lyfta_prefs', platform: 'lyfta' })
              : () => onSetOnboarding({ intent: 'initial', step: 'platform' })
          }
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'strong_csv' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="strong"
          hideBodyTypeAndUnit={true}
          onClearCache={onClearCacheAndRestart}
          onFileSelect={(file, _gender, unit) => {
            onSetCsvImportError(null);
            onProcessFile(file, 'strong', unit);
          }}
          isLoading={isAnalyzing}
          initialGender={bodyMapGender}
          initialUnit={weightUnit}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          errorMessage={csvImportError}
          onBack={() => {
            if (onboarding.intent === 'initial') {
              const backStep = onboarding.backStep ?? 'strong_prefs';
              onSetOnboarding({ intent: onboarding.intent, step: backStep, platform: 'strong' });
              return;
            }
            onSetOnboarding({ intent: 'initial', step: 'platform' });
          }}
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'other_csv' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="other"
          hideBodyTypeAndUnit={true}
          onClearCache={onClearCacheAndRestart}
          onFileSelect={(file, _gender, unit) => {
            onSetCsvImportError(null);
            onProcessFile(file, 'other', unit);
          }}
          isLoading={isAnalyzing}
          initialGender={bodyMapGender}
          initialUnit={weightUnit}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          errorMessage={csvImportError}
          onBack={() => {
            if (onboarding.intent === 'initial') {
              const backStep = onboarding.backStep ?? 'other_prefs';
              onSetOnboarding({ intent: onboarding.intent, step: backStep, platform: 'other' });
              return;
            }
            onSetOnboarding({ intent: 'initial', step: 'platform' });
          }}
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'lyfta_csv' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="lyfta"
          hideBodyTypeAndUnit={true}
          onClearCache={onClearCacheAndRestart}
          onFileSelect={(file, _gender, unit) => {
            onSetCsvImportError(null);
            onProcessFile(file, 'lyfta', unit);
          }}
          isLoading={isAnalyzing}
          initialGender={bodyMapGender}
          initialUnit={weightUnit}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          errorMessage={csvImportError}
          onBack={() => {
            if (onboarding.intent === 'initial') {
              const backStep = onboarding.backStep ?? 'lyfta_prefs';
              onSetOnboarding({ intent: onboarding.intent, step: backStep, platform: 'lyfta' });
              return;
            }
            onSetOnboarding({ intent: 'initial', step: 'platform' });
          }}
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}

      {onboarding.step === 'hevy_csv' ? (
        <CSVImportModal
          intent={onboarding.intent}
          platform="hevy"
          hideBodyTypeAndUnit
          onFileSelect={(file, gender, unit) => {
            onSetBodyMapGender(gender);
            onSetWeightUnit(unit);
            savePreferencesConfirmed(true);
            onSetCsvImportError(null);
            onProcessFile(file, 'hevy', unit);
          }}
          isLoading={isAnalyzing}
          initialGender={bodyMapGender}
          initialUnit={weightUnit}
          onGenderChange={(g) => onSetBodyMapGender(g)}
          onUnitChange={(u) => onSetWeightUnit(u)}
          errorMessage={csvImportError}
          onBack={() => {
            if (onboarding.intent === 'initial') {
              const backStep = onboarding.backStep ?? 'hevy_login';
              onSetOnboarding({ intent: onboarding.intent, step: backStep, platform: 'hevy' });
              return;
            }
            onSetOnboarding({ intent: 'initial', step: 'platform' });
          }}
          onClose={onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined}
        />
      ) : null}
    </>
  );
};
