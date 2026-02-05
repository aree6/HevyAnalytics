import React from 'react';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import type { WeightUnit } from '../../utils/storage/localStorage';
import type { OnboardingFlow } from '../../app/onboarding/types';
import { LandingPage } from '../landing/ui/LandingPage';
import { getPreferencesConfirmed } from '../../utils/storage/localStorage';
import { OnboardingPreferencesStep } from './OnboardingPreferencesStep';
import { OnboardingDemoStep } from './OnboardingDemoStep';
import { HevyLoginStep, LyftaLoginStep } from './OnboardingLoginSteps';
import { OnboardingCsvStep } from './OnboardingCsvStep';

interface AppOnboardingStepsProps {
  onboarding: OnboardingFlow;
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

export const AppOnboardingSteps: React.FC<AppOnboardingStepsProps> = ({
  onboarding,
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
  const closeForUpdate = onboarding.intent === 'update' ? () => onSetOnboarding(null) : undefined;

  if (onboarding.step === 'platform') {
    return (
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
    );
  }

  if (onboarding.step === 'demo_prefs') {
    return (
      <OnboardingDemoStep
        intent={onboarding.intent}
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onSetCsvImportError={onSetCsvImportError}
        onProcessFile={onProcessFile}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'hevy_prefs') {
    return (
      <OnboardingPreferencesStep
        intent={onboarding.intent}
        platform="hevy"
        nextStep="hevy_login"
        backStep="platform"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'lyfta_prefs') {
    return (
      <OnboardingPreferencesStep
        intent={onboarding.intent}
        platform="lyfta"
        nextStep="lyfta_login"
        backStep="platform"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'strong_prefs') {
    return (
      <OnboardingPreferencesStep
        intent={onboarding.intent}
        platform="strong"
        nextStep="strong_csv"
        nextBackStep="strong_prefs"
        backStep="platform"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'other_prefs') {
    return (
      <OnboardingPreferencesStep
        intent={onboarding.intent}
        platform="other"
        nextStep="other_csv"
        nextBackStep="other_prefs"
        backStep="platform"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'hevy_login') {
    return (
      <HevyLoginStep
        intent={onboarding.intent}
        hevyLoginError={hevyLoginError}
        isAnalyzing={isAnalyzing}
        onHevyLogin={onHevyLogin}
        onHevyApiKeyLogin={onHevyApiKeyLogin}
        onHevySyncSaved={onHevySyncSaved}
        onClearCacheAndRestart={onClearCacheAndRestart}
        onSetOnboarding={onSetOnboarding}
      />
    );
  }

  if (onboarding.step === 'lyfta_login') {
    return (
      <LyftaLoginStep
        intent={onboarding.intent}
        lyfatLoginError={lyfatLoginError}
        isAnalyzing={isAnalyzing}
        onLyfatLogin={onLyfatLogin}
        onLyfatSyncSaved={onLyfatSyncSaved}
        onClearCacheAndRestart={onClearCacheAndRestart}
        onSetOnboarding={onSetOnboarding}
      />
    );
  }

  if (onboarding.step === 'strong_csv') {
    return (
      <OnboardingCsvStep
        intent={onboarding.intent}
        platform="strong"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        csvImportError={csvImportError}
        backStep={onboarding.backStep ?? 'strong_prefs'}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onSetCsvImportError={onSetCsvImportError}
        onProcessFile={onProcessFile}
        onClearCacheAndRestart={onClearCacheAndRestart}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'other_csv') {
    return (
      <OnboardingCsvStep
        intent={onboarding.intent}
        platform="other"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        csvImportError={csvImportError}
        backStep={onboarding.backStep ?? 'other_prefs'}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onSetCsvImportError={onSetCsvImportError}
        onProcessFile={onProcessFile}
        onClearCacheAndRestart={onClearCacheAndRestart}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'lyfta_csv') {
    return (
      <OnboardingCsvStep
        intent={onboarding.intent}
        platform="lyfta"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        csvImportError={csvImportError}
        backStep={onboarding.backStep ?? 'lyfta_prefs'}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onSetCsvImportError={onSetCsvImportError}
        onProcessFile={onProcessFile}
        onClearCacheAndRestart={onClearCacheAndRestart}
        onClose={closeForUpdate}
      />
    );
  }

  if (onboarding.step === 'hevy_csv') {
    return (
      <OnboardingCsvStep
        intent={onboarding.intent}
        platform="hevy"
        bodyMapGender={bodyMapGender}
        weightUnit={weightUnit}
        isAnalyzing={isAnalyzing}
        csvImportError={csvImportError}
        backStep={onboarding.backStep ?? 'hevy_login'}
        onSetOnboarding={onSetOnboarding}
        onSetBodyMapGender={onSetBodyMapGender}
        onSetWeightUnit={onSetWeightUnit}
        onSetCsvImportError={onSetCsvImportError}
        onProcessFile={onProcessFile}
        onClearCacheAndRestart={onClearCacheAndRestart}
        onClose={closeForUpdate}
        withPreferences={true}
      />
    );
  }

  return null;
};
