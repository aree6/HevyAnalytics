import type { WeightUnit } from '../../utils/storage/localStorage';
import type { DataSourceChoice } from '../../utils/storage/dataSourceStorage';
import { parseWorkoutCSVAsyncWithUnit, type ParseWorkoutCsvResult } from '../../utils/csv/csvParser';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { clearCSVData } from '../../utils/storage/localStorage';
import { saveSetupComplete } from '../../utils/storage/dataSourceStorage';
import { getErrorMessage } from '../ui/appErrorMessages';
import type { StartupAutoLoadParams } from './startupAutoLoadTypes';

interface CsvLoadOptions {
  platform: DataSourceChoice;
  storedCSV: string;
  weightUnit: WeightUnit;
  clearLoginErrors: () => void;
}

export const loadCsvAuto = (deps: StartupAutoLoadParams, options: CsvLoadOptions): void => {
  deps.setLoadingKind('csv');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  setTimeout(() => {
    deps.setLoadingStep(1);
    parseWorkoutCSVAsyncWithUnit(options.storedCSV, { unit: options.weightUnit })
      .then((result: ParseWorkoutCsvResult) => {
        deps.setLoadingStep(2);
        if (result.sets.length === 0 || result.sets.every((s) => !s.parsedDate)) {
          clearCSVData();
          saveSetupComplete(false);
          deps.setCsvImportError('No workouts found in your CSV.');
          deps.setOnboarding({ intent: 'initial', step: 'platform' });
          return;
        }

        const enriched = identifyPersonalRecords(result.sets);
        deps.setParsedData(enriched);
        options.clearLoginErrors();
        deps.setCsvImportError(null);
      })
      .catch((err) => {
        clearCSVData();
        saveSetupComplete(false);
        deps.setCsvImportError(getErrorMessage(err));
        deps.setOnboarding({ intent: 'initial', step: 'platform' });
      })
      .finally(() => {
        deps.finishProgress(startedAt);
      });
  }, 0);
};
