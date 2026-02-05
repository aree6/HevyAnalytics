import React from 'react';
import type { BodyMapGender } from '../bodyMap/BodyMap';
import type { WeightUnit } from '../../utils/storage/localStorage';
import type { OnboardingFlow } from '../../app/onboarding/types';
import { CSVImportModal } from '../modals/csvImport/CSVImportModal';
import { getPreferencesConfirmed, savePreferencesConfirmed } from '../../utils/storage/localStorage';

interface OnboardingDemoStepProps {
  intent: OnboardingFlow['intent'];
  bodyMapGender: BodyMapGender;
  weightUnit: WeightUnit;
  isAnalyzing: boolean;
  onSetOnboarding: (next: OnboardingFlow | null) => void;
  onSetBodyMapGender: (g: BodyMapGender) => void;
  onSetWeightUnit: (u: WeightUnit) => void;
  onSetCsvImportError: (msg: string | null) => void;
  onProcessFile: (file: File, platform: 'other', unitOverride?: WeightUnit) => void;
  onClose?: () => void;
}

export const OnboardingDemoStep: React.FC<OnboardingDemoStepProps> = ({
  intent,
  bodyMapGender,
  weightUnit,
  isAnalyzing,
  onSetOnboarding,
  onSetBodyMapGender,
  onSetWeightUnit,
  onSetCsvImportError,
  onProcessFile,
  onClose,
}) => (
  <CSVImportModal
    intent={intent}
    platform="other"
    variant="preferences"
    continueLabel="Try Demo"
    isLoading={isAnalyzing}
    initialGender={getPreferencesConfirmed() ? bodyMapGender : undefined}
    initialUnit={getPreferencesConfirmed() ? weightUnit : undefined}
    onGenderChange={(g) => onSetBodyMapGender(g)}
    onUnitChange={(u) => onSetWeightUnit(u)}
    onContinue={async (gender, unit) => {
      onSetBodyMapGender(gender);
      onSetWeightUnit(unit);
      savePreferencesConfirmed(true);

      try {
        onSetCsvImportError(null);
        const response = await fetch(`${import.meta.env.BASE_URL}sample_demo.csv`);
        if (!response.ok) {
          throw new Error('Failed to load demo data');
        }
        const csvText = await response.text();
        const file = new File([csvText], 'sample_demo.csv', { type: 'text/csv' });
        onProcessFile(file, 'other', unit);
      } catch (err) {
        onSetCsvImportError('Failed to load demo data. Please try again.');
      }
    }}
    onBack={() => onSetOnboarding({ intent, step: 'platform' })}
    onClose={onClose}
  />
);
