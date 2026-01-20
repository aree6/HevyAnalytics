import Papa from 'papaparse';
import type { WeightUnit } from '../storage/localStorage';

import type { ParseOptions, ParseResult, Row, TransformContext } from './csvParserTypes';
import { detectFieldMappings } from './csvSemanticDetection';
import { guessDelimiter } from './csvParserUtils';
import { calculateSetIndices, inferWorkoutTitles, transformRow } from './csvRowTransform';
import type { WorkoutSet } from '../../types';

export type { ParseOptions, ParseResult } from './csvParserTypes';

export const parseWorkoutCSV = (csvContent: string, options: ParseOptions): ParseResult => {
  const delimiter = guessDelimiter(csvContent);

  const parsed = Papa.parse<Row>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    delimiter,
    transformHeader: (h) => h.trim().replace(/^\uFEFF/, ''),
  });

  if (parsed.errors?.length > 0) {
    const fatal = parsed.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter');
    if (fatal) throw new Error(`CSV parsing error: ${fatal.message}`);
  }

  const rawRows = parsed.data ?? [];
  const headers = parsed.meta.fields ?? [];

  if (headers.length === 0 || rawRows.length === 0) {
    throw new Error('CSV file is empty or has no valid data rows.');
  }

  const sampleSize = Math.min(50, rawRows.length);
  const sampleRows = rawRows.slice(0, sampleSize);
  const fieldMappings = detectFieldMappings(headers, sampleRows);

  const detectedFields = new Set(Array.from(fieldMappings.values()).map((m) => m.field));

  if (!detectedFields.has('exercise')) {
    throw new Error(
      'Could not detect an exercise column. Please ensure your CSV has a column for exercises ' +
        '(e.g., "Exercise", "Exercise Name", "Movement", "Lift", etc. )'
    );
  }

  if (!detectedFields.has('startTime')) {
    throw new Error(
      'Could not detect a date/time column. Please ensure your CSV has a column for dates ' +
        '(e.g., "Date", "Time", "Start Time", "Timestamp", etc.)'
    );
  }

  const stats = { unmatched: new Set<string>(), fuzzyMatches: 0, representativeMatches: 0 };
  const context: TransformContext = { fieldMappings, options, stats };

  const sets = rawRows.map((row) => transformRow(row, context)).filter((s): s is WorkoutSet => s !== null);

  calculateSetIndices(sets);
  inferWorkoutTitles(sets);

  sets.sort((a, b) => {
    const timeA = a.parsedDate?.getTime() ?? 0;
    const timeB = b.parsedDate?.getTime() ?? 0;
    if (timeB !== timeA) return timeB - timeA;
    return a.set_index - b.set_index;
  });

  const mappingConfidences = Array.from(fieldMappings.values()).map((m) => m.confidence);
  const avgConfidence =
    mappingConfidences.length > 0
      ? mappingConfidences.reduce((a, b) => a + b, 0) / mappingConfidences.length
      : 0;

  const fieldMappingsSummary: Record<string, string> = {};
  for (const [header, match] of fieldMappings) {
    fieldMappingsSummary[header] = match.field;
  }

  const warnings: string[] = [];
  if (avgConfidence < 0.6) {
    warnings.push('Some columns may not have been detected correctly. Please verify your data after import.');
  }

  return {
    sets,
    meta: {
      confidence: avgConfidence,
      fieldMappings: fieldMappingsSummary,
      unmatchedExercises: Array.from(stats.unmatched).sort(),
      fuzzyMatches: stats.fuzzyMatches,
      representativeMatches: stats.representativeMatches,
      rowCount: rawRows.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };
};

export const parseWorkoutCSVAsync = async (csvContent: string, options: ParseOptions): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(parseWorkoutCSV(csvContent, options));
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
};

export type ParseWorkoutCsvResult = ParseResult;

export interface LegacyParseOptions {
  unit: WeightUnit;
}

export const parseWorkoutCSVAsyncWithUnit = async (
  csvContent: string,
  options: LegacyParseOptions
): Promise<ParseResult> => {
  return parseWorkoutCSVAsync(csvContent, {
    userWeightUnit: options.unit,
  });
};
