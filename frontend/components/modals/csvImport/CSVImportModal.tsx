import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import { CSV_LOADING_ANIMATION_SRC, assetPath } from '../../../constants';
import { UNIFORM_HEADER_BUTTON_CLASS } from '../../../utils/ui/uiConstants';
import { OnboardingModalShell } from '../ui/OnboardingModalShell';
import { CSVExportHelp } from './CSVExportHelp';
import { CSVImportBodyTypeSelector } from './CSVImportBodyTypeSelector';
import { CSVImportDropzone } from './CSVImportDropzone';
import { CSVImportErrorNotice } from './CSVImportErrorNotice';
import { CSVImportFooter } from './CSVImportFooter';
import { CSVImportHeader } from './CSVImportHeader';
import { CSVImportIntro } from './CSVImportIntro';
import { CSVImportUnitSelector } from './CSVImportUnitSelector';
import { useCsvImportState } from './useCsvImportState';

type Intent = 'initial' | 'update';

type CSVImportVariant = 'csv' | 'preferences';

interface CSVImportModalProps {
  intent: Intent;
  platform: 'hevy' | 'strong' | 'lyfta' | 'other';
  variant?: CSVImportVariant;
  /** Hide the body type + weight unit selectors (used when preferences were already collected earlier in onboarding). */
  hideBodyTypeAndUnit?: boolean;
  onFileSelect?: (file: File, gender: BodyMapGender, unit: WeightUnit) => void;
  onContinue?: (gender: BodyMapGender, unit: WeightUnit) => void;
  continueLabel?: string;
  isLoading?: boolean;
  initialGender?: BodyMapGender;
  initialUnit?: WeightUnit;
  errorMessage?: string | null;
  onBack?: () => void;
  onClose?: () => void;
  onClearCache?: () => void;
  onGenderChange?: (gender: BodyMapGender) => void;
  onUnitChange?: (unit: WeightUnit) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  intent,
  platform,
  onFileSelect,
  variant = 'csv',
  hideBodyTypeAndUnit = false,
  onContinue,
  continueLabel = 'Continue',
  isLoading = false,
  initialGender,
  initialUnit,
  errorMessage,
  onBack,
  onClose,
  onClearCache,
  onGenderChange,
  onUnitChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedGender,
    selectedUnit,
    showExportHelp,
    setShowExportHelp,
    handleGenderSelect,
    handleUnitSelect,
    canUploadCsv,
    handleFileChange,
    handleDragOver,
    handleDrop,
    handleContinue,
  } = useCsvImportState({
    initialGender,
    initialUnit,
    onFileSelect,
    onContinue,
    onGenderChange,
    onUnitChange,
  });

  const showBodyTypeAndUnitSelectors = variant === 'preferences' || !hideBodyTypeAndUnit;

  useEffect(() => {
    const controller = new AbortController();
    fetch(assetPath(CSV_LOADING_ANIMATION_SRC), {
      method: 'GET',
      cache: 'force-cache',
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <OnboardingModalShell
      header={<CSVImportHeader intent={intent} onBack={onBack} onClose={onClose} />}
      footer={(
        <CSVImportFooter
          variant={variant}
          platform={platform}
          showExportHelp={showExportHelp}
          onToggleExportHelp={() => setShowExportHelp((v) => !v)}
          onClearCache={onClearCache}
          isLoading={isLoading}
        />
      )}
    >
      <div className="flex flex-col h-full min-h-0 pt-6">
        <CSVImportIntro
          variant={variant}
          platform={platform}
          showBodyTypeAndUnitSelectors={showBodyTypeAndUnitSelectors}
        />

        <CSVImportErrorNotice errorMessage={errorMessage} />

        {showBodyTypeAndUnitSelectors ? (
          <div className="flex-shrink-0">
            <CSVImportBodyTypeSelector
              selectedGender={selectedGender}
              onSelectGender={handleGenderSelect}
            />
            <CSVImportUnitSelector
              selectedUnit={selectedUnit}
              onSelectUnit={handleUnitSelect}
            />
          </div>
        ) : null}

        {variant === 'preferences' ? (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading || !selectedGender || !selectedUnit}
              className={`${UNIFORM_HEADER_BUTTON_CLASS} w-full h-11 text-sm font-semibold disabled:opacity-60 gap-2`}
            >
              <span>{continueLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <CSVImportDropzone
              fileInputRef={fileInputRef}
              platform={platform}
              hideBodyTypeAndUnit={hideBodyTypeAndUnit}
              canUploadCsv={canUploadCsv}
              isLoading={isLoading}
              onFileChange={handleFileChange}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />

            {variant === 'csv' && platform !== 'other' && showExportHelp ? (
              <div className="w-full mt-4 flex-shrink-0">
                <CSVExportHelp platform={platform} />
              </div>
            ) : null}

            {isLoading ? (
              <p className="text-slate-400 text-xs sm:text-sm text-center flex-shrink-0 mt-3">
                Importing your data...
              </p>
            ) : null}
          </div>
        )}
      </div>
    </OnboardingModalShell>
  );
};

export default CSVImportModal;
