import React from 'react';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import type { WeightUnit } from '../../utils/storage/localStorage';
import type { OnboardingFlow } from '../../app/onboarding/types';
import { CSVImportModal } from '../modals/csvImport/CSVImportModal';
import { getPreferencesConfirmed, savePreferencesConfirmed } from '../../utils/storage/localStorage';

interface OnboardingPreferencesStepProps {
  intent: OnboardingFlow['intent'];
  platform: 'hevy' | 'lyfta' | 'strong' | 'other';
  nextStep: OnboardingFlow['step'];
  backStep: OnboardingFlow['step'];
  nextBackStep?: OnboardingFlow['step'];
  continueLabel?: string;
  bodyMapGender: BodyMapGender;
  weightUnit: WeightUnit;
  isAnalyzing: boolean;
  onSetOnboarding: (next: OnboardingFlow | null) => void;
  onSetBodyMapGender: (g: BodyMapGender) => void;
  onSetWeightUnit: (u: WeightUnit) => void;
  onClose?: () => void;
}

export const OnboardingPreferencesStep: React.FC<OnboardingPreferencesStepProps> = ({
  intent,
  platform,
  nextStep,
  backStep,
  nextBackStep,
  continueLabel = 'Continue',
  bodyMapGender,
  weightUnit,
  isAnalyzing,
  onSetOnboarding,
  onSetBodyMapGender,
  onSetWeightUnit,
  onClose,
}) => (
  <CSVImportModal
    intent={intent}
    platform={platform}
    variant="preferences"
    continueLabel={continueLabel}
    isLoading={isAnalyzing}
    initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
    initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
    onGenderChange={(g) => onSetBodyMapGender(g)}
    onUnitChange={(u) => onSetWeightUnit(u)}
    onContinue={(gender, unit) => {
      onSetBodyMapGender(gender);
      onSetWeightUnit(unit);
      savePreferencesConfirmed(true);
      onSetOnboarding({ intent, step: nextStep, platform, backStep: nextBackStep });
    }}
    onBack={() => onSetOnboarding({ intent, step: backStep, platform })}
    onClose={onClose}
  />
);
