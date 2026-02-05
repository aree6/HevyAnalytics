import React from 'react';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import type { WeightUnit } from '../../utils/storage/localStorage';
import type { OnboardingFlow } from '../../app/onboarding/types';
import { CSVImportModal } from '../modals/csvImport/CSVImportModal';
import { savePreferencesConfirmed } from '../../utils/storage/localStorage';

interface OnboardingCsvStepProps {
  intent: OnboardingFlow['intent'];
  platform: 'strong' | 'hevy' | 'lyfta' | 'other';
  bodyMapGender: BodyMapGender;
  weightUnit: WeightUnit;
  isAnalyzing: boolean;
  csvImportError: string | null;
  backStep: OnboardingFlow['step'];
  onSetOnboarding: (next: OnboardingFlow | null) => void;
  onSetBodyMapGender: (g: BodyMapGender) => void;
  onSetWeightUnit: (u: WeightUnit) => void;
  onSetCsvImportError: (msg: string | null) => void;
  onProcessFile: (file: File, platform: 'strong' | 'hevy' | 'lyfta' | 'other', unitOverride?: WeightUnit) => void;
  onClearCacheAndRestart: () => void;
  onClose?: () => void;
  withPreferences?: boolean;
}

export const OnboardingCsvStep: React.FC<OnboardingCsvStepProps> = ({
  intent,
  platform,
  bodyMapGender,
  weightUnit,
  isAnalyzing,
  csvImportError,
  backStep,
  onSetOnboarding,
  onSetBodyMapGender,
  onSetWeightUnit,
  onSetCsvImportError,
  onProcessFile,
  onClearCacheAndRestart,
  onClose,
  withPreferences = false,
}) => (
  <CSVImportModal
    intent={intent}
    platform={platform}
    hideBodyTypeAndUnit={true}
    onClearCache={onClearCacheAndRestart}
    onFileSelect={(file, gender, unit) => {
      if (withPreferences) {
        onSetBodyMapGender(gender);
        onSetWeightUnit(unit);
        savePreferencesConfirmed(true);
      }
      onSetCsvImportError(null);
      onProcessFile(file, platform, unit);
    }}
    isLoading={isAnalyzing}
    initialGender={bodyMapGender}
    initialUnit={weightUnit}
    onGenderChange={(g) => onSetBodyMapGender(g)}
    onUnitChange={(u) => onSetWeightUnit(u)}
    errorMessage={csvImportError}
    onBack={() => {
      if (intent === 'initial') {
        onSetOnboarding({ intent, step: backStep, platform });
        return;
      }
      onSetOnboarding({ intent: 'initial', step: 'platform' });
    }}
    onClose={onClose}
  />
);
