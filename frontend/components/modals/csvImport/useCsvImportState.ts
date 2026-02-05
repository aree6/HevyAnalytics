import React, { useCallback, useState } from 'react';

import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { WeightUnit } from '../../../utils/storage/localStorage';

interface UseCsvImportStateArgs {
  initialGender?: BodyMapGender;
  initialUnit?: WeightUnit;
  onFileSelect?: (file: File, gender: BodyMapGender, unit: WeightUnit) => void;
  onContinue?: (gender: BodyMapGender, unit: WeightUnit) => void;
  onGenderChange?: (gender: BodyMapGender) => void;
  onUnitChange?: (unit: WeightUnit) => void;
}

const ensureSelections = (selectedGender: BodyMapGender | null, selectedUnit: WeightUnit | null) => {
  if (!selectedGender) {
    alert('Choose a body type to continue');
    return false;
  }
  if (!selectedUnit) {
    alert('Choose a weight unit to continue');
    return false;
  }
  return true;
};

export const useCsvImportState = ({
  initialGender,
  initialUnit,
  onFileSelect,
  onContinue,
  onGenderChange,
  onUnitChange,
}: UseCsvImportStateArgs) => {
  const [selectedGender, setSelectedGender] = useState<BodyMapGender | null>(initialGender ?? null);
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit | null>(initialUnit ?? null);
  const [showExportHelp, setShowExportHelp] = useState(false);

  const handleGenderSelect = useCallback(
    (gender: BodyMapGender) => {
      setSelectedGender(gender);
      onGenderChange?.(gender);
    },
    [onGenderChange]
  );

  const handleUnitSelect = useCallback(
    (unit: WeightUnit) => {
      setSelectedUnit(unit);
      onUnitChange?.(unit);
    },
    [onUnitChange]
  );

  const canUploadCsv = Boolean(selectedGender && selectedUnit);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!ensureSelections(selectedGender, selectedUnit)) return;
      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        onFileSelect?.(file, selectedGender!, selectedUnit!);
      } else {
        alert('Please choose a valid .csv file');
      }
    },
    [onFileSelect, selectedGender, selectedUnit]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!ensureSelections(selectedGender, selectedUnit)) return;

      const file = event.dataTransfer.files?.[0];
      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        onFileSelect?.(file, selectedGender!, selectedUnit!);
      } else {
        alert('Drop a valid .csv file');
      }
    },
    [onFileSelect, selectedGender, selectedUnit]
  );

  const handleContinue = useCallback(() => {
    if (!ensureSelections(selectedGender, selectedUnit)) return;
    onContinue?.(selectedGender!, selectedUnit!);
  }, [onContinue, selectedGender, selectedUnit]);

  return {
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
  };
};
