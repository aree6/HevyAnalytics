import { WeightUnit } from '../../utils/storage/localStorage';
import type { DataSourceChoice } from '../../utils/storage/dataSourceStorage';
import { saveLastCsvPlatform, saveLastLoginMethod, saveSetupComplete } from '../../utils/storage/dataSourceStorage';
import { getHevyUsernameOrEmail } from '../../utils/storage/hevyCredentialsStorage';
import { saveCSVData } from '../../utils/storage/localStorage';
import { identifyPersonalRecords } from '../../utils/analysis/core';
import { getErrorMessage } from '../../app/ui';
import { parseWorkoutCSVAsyncWithUnit, ParseWorkoutCsvResult } from '../../utils/csv/csvParser';
import { trackEvent } from '../../utils/integrations/analytics';
import type { AppAuthHandlersDeps } from './appAuthTypes';

export const runCsvImport = (
  deps: AppAuthHandlersDeps,
  file: File,
  platform: DataSourceChoice,
  unitOverride?: WeightUnit
): void => {
  trackEvent('csv_import_start', { platform, unit: unitOverride ?? deps.weightUnit });
  deps.setLoadingKind('csv');
  deps.setIsAnalyzing(true);
  deps.setLoadingStep(0);
  const startedAt = deps.startProgress();

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result;
    if (typeof text === 'string') {
      deps.setCsvImportError(null);
      deps.setLoadingStep(1);
      const unit = unitOverride ?? deps.weightUnit;
      parseWorkoutCSVAsyncWithUnit(text, { unit })
        .then((result: ParseWorkoutCsvResult) => {
          deps.setLoadingStep(2);
          const enriched = identifyPersonalRecords(result.sets);
          trackEvent('csv_import_success', {
            platform,
            unit,
            sets: result.sets?.length,
            enriched_sets: enriched?.length,
          });
          deps.setParsedData(enriched);
          saveCSVData(text);
          saveLastCsvPlatform(platform);
          saveLastLoginMethod(
            platform,
            'csv',
            platform === 'hevy' ? (getHevyUsernameOrEmail() ?? undefined) : undefined
          );
          deps.setDataSource(platform);
          saveSetupComplete(true);
          deps.setOnboarding(null);
        })
        .catch((err) => {
          trackEvent('csv_import_error', { platform });
          deps.setCsvImportError(getErrorMessage(err));
        })
        .finally(() => {
          deps.setSelectedMonth('all');
          deps.setSelectedDay(null);
          deps.finishProgress(startedAt);
        });
    }
  };
  reader.readAsText(file);
};
