import Papa from 'papaparse';
import type { WeightUnit } from '../storage/localStorage';

import type { FieldMatch, ParseOptions, ParseResult, Row, TransformContext } from './csvParserTypes';
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
  const normalizedContent = csvContent.replace(/^\uFEFF/, '');
  const delimiter = guessDelimiter(normalizedContent);
  const sampleSize = 50;
  const maxBatchSize = 300;

  return new Promise((resolve, reject) => {
    let settled = false;
    let parseComplete = false;
    let headers: string[] = [];
    let fieldMappings: Map<string, FieldMatch> | null = null;
    let context: TransformContext | null = null;
    let rowCount = 0;
    let idleHandle: number | null = null;
    let processing = false;
    let parserRef: Papa.Parser | null = null;
    let headerMap: Map<string, string> | null = null;

    const rowQueue: Row[] = [];
    const sampleRows: Row[] = [];
    const sets: WorkoutSet[] = [];
    const parseErrors: Papa.ParseError[] = [];
    const stats = { unmatched: new Set<string>(), fuzzyMatches: 0, representativeMatches: 0 };

    const normalizeHeaderKey = (header: string): string => header.trim().replace(/^\uFEFF/, '');

    const ensureHeaderMap = (): void => {
      if (headerMap || headers.length === 0) return;
      const normalized = headers.map((header) => normalizeHeaderKey(header));
      const changed = normalized.some((value, index) => value !== headers[index]);
      if (!changed) return;
      headerMap = new Map<string, string>();
      headers.forEach((header, index) => {
        headerMap!.set(header, normalized[index]);
      });
      headers = normalized;
      if (sampleRows.length > 0) {
        for (let i = 0; i < sampleRows.length; i += 1) {
          sampleRows[i] = normalizeRow(sampleRows[i]);
        }
      }
      if (rowQueue.length > 0) {
        for (let i = 0; i < rowQueue.length; i += 1) {
          rowQueue[i] = normalizeRow(rowQueue[i]);
        }
      }
    };

    const normalizeRow = (row: Row): Row => {
      if (!headerMap) return row;
      const normalizedRow: Row = {};
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[headerMap.get(key) ?? key] = value;
      }
      return normalizedRow;
    };

    const getGlobal = (): any => (typeof window !== 'undefined' ? window : globalThis);

    const scheduleIdle = (cb: () => void): number => {
      const g = getGlobal();
      if (typeof g.requestIdleCallback === 'function') {
        return g.requestIdleCallback(() => cb(), { timeout: 50 });
      }
      return g.setTimeout(cb, 0);
    };

    const cancelIdle = (handle: number): void => {
      const g = getGlobal();
      if (typeof g.cancelIdleCallback === 'function') {
        g.cancelIdleCallback(handle);
        return;
      }
      g.clearTimeout(handle);
    };

    const rejectOnce = (err: Error): void => {
      if (settled) return;
      settled = true;
      if (idleHandle !== null) cancelIdle(idleHandle);
      if (parserRef && typeof (parserRef as Papa.Parser).abort === 'function') {
        (parserRef as Papa.Parser).abort();
      }
      reject(err);
    };

    const resolveOnce = (result: ParseResult): void => {
      if (settled) return;
      settled = true;
      if (idleHandle !== null) cancelIdle(idleHandle);
      resolve(result);
    };

    const ensureMappings = (): boolean => {
      if (context) return true;
      if (headers.length === 0) return false;
      if (sampleRows.length === 0 && !parseComplete) return false;
      if (sampleRows.length < sampleSize && !parseComplete) return false;
      if (sampleRows.length === 0 && parseComplete) return false;

      fieldMappings = detectFieldMappings(headers, sampleRows);
      const detectedFields = new Set(Array.from(fieldMappings.values()).map((m) => m.field));
      if (!detectedFields.has('exercise')) {
        rejectOnce(
          new Error(
            'Could not detect an exercise column. Please ensure your CSV has a column for exercises ' +
              '(e.g., "Exercise", "Exercise Name", "Movement", "Lift", etc. )'
          )
        );
        return false;
      }
      if (!detectedFields.has('startTime')) {
        rejectOnce(
          new Error(
            'Could not detect a date/time column. Please ensure your CSV has a column for dates ' +
              '(e.g., "Date", "Time", "Start Time", "Timestamp", etc.)'
          )
        );
        return false;
      }

      context = { fieldMappings, options, stats };
      return true;
    };

    const finalize = (): void => {
      if (!context) return;

      const fatal = parseErrors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter');
      if (fatal) {
        rejectOnce(new Error(`CSV parsing error: ${fatal.message}`));
        return;
      }

      calculateSetIndices(sets);
      inferWorkoutTitles(sets);

      sets.sort((a, b) => {
        const timeA = a.parsedDate?.getTime() ?? 0;
        const timeB = b.parsedDate?.getTime() ?? 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.set_index - b.set_index;
      });

      const mappingConfidences = Array.from(context.fieldMappings.values()).map((m) => m.confidence);
      const avgConfidence =
        mappingConfidences.length > 0
          ? mappingConfidences.reduce((a, b) => a + b, 0) / mappingConfidences.length
          : 0;

      const fieldMappingsSummary: Record<string, string> = {};
      for (const [header, match] of context.fieldMappings) {
        fieldMappingsSummary[header] = match.field;
      }

      const warnings: string[] = [];
      if (avgConfidence < 0.6) {
        warnings.push('Some columns may not have been detected correctly. Please verify your data after import.');
      }

      resolveOnce({
        sets,
        meta: {
          confidence: avgConfidence,
          fieldMappings: fieldMappingsSummary,
          unmatchedExercises: Array.from(stats.unmatched).sort(),
          fuzzyMatches: stats.fuzzyMatches,
          representativeMatches: stats.representativeMatches,
          rowCount,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      });
    };

    const processQueue = (): void => {
      if (processing || settled) return;
      processing = true;

      const run = () => {
        if (settled) {
          processing = false;
          return;
        }

        if (!ensureMappings()) {
          processing = false;
          if (parseComplete && !settled) {
            rejectOnce(new Error('CSV file is empty or has no valid data rows.'));
          }
          return;
        }

        const batch = rowQueue.splice(0, maxBatchSize);
        for (const row of batch) {
          const set = transformRow(row, context!);
          if (set) sets.push(set);
        }

        processing = false;

        if (rowQueue.length > 0) {
          idleHandle = scheduleIdle(processQueue);
          return;
        }

        if (parseComplete) {
          finalize();
        }
      };

      idleHandle = scheduleIdle(run);
    };

    Papa.parse<Row>(normalizedContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter,
      worker: true,
      step: (results, parser) => {
        parserRef = parser;
        if (results.meta?.fields && headers.length === 0) {
          headers = results.meta.fields;
          ensureHeaderMap();
        }
        if (results.errors?.length) {
          parseErrors.push(...results.errors);
        }
        if (results.data) {
          const row = normalizeRow(results.data as Row);
          rowCount += 1;
          if (sampleRows.length < sampleSize) sampleRows.push(row);
          rowQueue.push(row);
          if (!processing) processQueue();
        }
      },
      complete: (results?: Papa.ParseResult<Row>) => {
        const finalResults = results ?? { data: [], errors: [], meta: {} };
        if (finalResults.meta?.fields && headers.length === 0) {
          headers = finalResults.meta.fields as string[];
          ensureHeaderMap();
        }
        if (finalResults.errors?.length) {
          parseErrors.push(...finalResults.errors);
        }

        parseComplete = true;

        if (headers.length === 0 || rowCount === 0) {
          rejectOnce(new Error('CSV file is empty or has no valid data rows.'));
          return;
        }

        if (!processing) processQueue();
      },
      error: (error) => {
        rejectOnce(error instanceof Error ? error : new Error(String(error)));
      },
    });
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
