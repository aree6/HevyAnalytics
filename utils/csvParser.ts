import { WorkoutSet } from '../types';
import { parse, isValid } from 'date-fns';
import Papa from 'papaparse';
import { toNumber, toInteger, toString } from './formatters';
import { DATE_FORMAT_HEVY } from './dateUtils';

const REQUIRED_HEADERS = [
  'title',
  'start_time',
  'exercise_title',
  'set_index',
  'set_type',
  'reps',
] as const;

const WEIGHT_HEADERS = ['weight_kg', 'weight_lb', 'weight_lbs'] as const;
const LBS_TO_KG = 0.45359237;

type HeaderMode = 'fast' | 'robust';

const normalizeHeaderFast = (header: string): string => header.trim().replace(/^\uFEFF/, '');

const CONSUMED_HEADERS = [
  'title',
  'start_time',
  'end_time',
  'description',
  'exercise_title',
  'superset_id',
  'exercise_notes',
  'set_index',
  'set_type',
  'reps',
  'distance_km',
  'duration_seconds',
  'rpe',
  ...WEIGHT_HEADERS,
] as const;

const HEADER_ALIASES: Record<string, string> = {
  starttime: 'start_time',
  exercisetitle: 'exercise_title',
  setindex: 'set_index',
  settype: 'set_type',
  weightkgs: 'weight_kg',
  weight_kgs: 'weight_kg',
  weightkg: 'weight_kg',
  weight_kg: 'weight_kg',
  weightinkg: 'weight_kg',
  weight_in_kg: 'weight_kg',
  weight_in_kgs: 'weight_kg',
  weightlbs: 'weight_lbs',
  weightlb: 'weight_lb',
  weightinlbs: 'weight_lbs',
  weight_in_lbs: 'weight_lbs',
  weightinpounds: 'weight_lbs',
  weight_in_pounds: 'weight_lbs',
  weightpounds: 'weight_lbs',
};

const canonicalizeHeader = (header: string): string => {
  return header
    .trim()
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const normalizeHeader = (header: string): string => {
  const canonical = canonicalizeHeader(header);
  return HEADER_ALIASES[canonical] ?? canonical;
};

const getHeaderValidation = (
  fields: string[],
  headerNormalizer: (header: string) => string
): { missing: string[]; hasWeightHeader: boolean } => {
  const normalizedFields = fields.map(headerNormalizer);
  const missing = REQUIRED_HEADERS.filter(h => !normalizedFields.includes(h));
  const hasWeightHeader = WEIGHT_HEADERS.some(h => normalizedFields.includes(h));
  return { missing, hasWeightHeader };
};

const validateHevyCSV = (fields: string[] | undefined): HeaderMode => {
  if (!fields || fields.length === 0) {
    throw new Error('CSV file is empty or missing a header row. Please export your workout data from the Hevy app and try again.');
  }

  const fast = getHeaderValidation(fields, normalizeHeaderFast);
  if (fast.missing.length === 0 && fast.hasWeightHeader) {
    const fastFields = fields.map(normalizeHeaderFast);
    const robustFields = fields.map(normalizeHeader);
    const needsRobustMapping = CONSUMED_HEADERS.some(
      (h) => robustFields.includes(h) && !fastFields.includes(h)
    );
    return needsRobustMapping ? 'robust' : 'fast';
  }

  const robust = getHeaderValidation(fields, normalizeHeader);
  if (robust.missing.length === 0 && robust.hasWeightHeader) return 'robust';

  if (robust.missing.length > 0) {
    throw new Error(
      'Invalid CSV format. HevyAnalytics only supports the workout CSV exported from the Hevy app. If you exported in another language, switch the Hevy app language to English before exporting and try again.'
    );
  }

  throw new Error(
    'Invalid CSV format. Missing required weight column. Expected one of: weight_kg, weight_lb, weight_lbs.'
  );
};

const parseHevyDate = (value: string): Date | undefined => {
  if (!value) return undefined;
  try {
    const d = parse(value, DATE_FORMAT_HEVY, new Date(0));
    return isValid(d) ? d : undefined;
  } catch {
    return undefined;
  }
};

const normalizeRowKeysWith = (
  row: Record<string, unknown>,
  headerNormalizer: (header: string) => string
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[headerNormalizer(key)] = value;
  }
  return out;
};

const deriveFieldsFromRows = (rows: Record<string, unknown>[]): string[] => {
  const fields = new Set<string>();
  for (const row of rows.slice(0, 25)) {
    for (const key of Object.keys(row)) {
      fields.add(key);
    }
  }
  return Array.from(fields);
};

const identityHeader = (header: string): string => header;

const normalizeRow = (row: Record<string, unknown>): WorkoutSet => {
  const start_time = toString(row.start_time);
  const weightKg =
    row.weight_kg != null
      ? toNumber(row.weight_kg)
      : toNumber((row as Record<string, unknown>).weight_lbs ?? (row as Record<string, unknown>).weight_lb) * LBS_TO_KG;
  return {
    title: toString(row.title),
    start_time,
    end_time: toString(row.end_time),
    description: toString(row.description),
    exercise_title: toString(row.exercise_title),
    superset_id: toString(row.superset_id),
    exercise_notes: toString(row.exercise_notes),
    set_index: toInteger(row.set_index),
    set_type: toString(row.set_type),
    weight_kg: weightKg,
    reps: toNumber(row.reps),
    distance_km: toNumber(row.distance_km),
    duration_seconds: toNumber(row.duration_seconds),
    rpe: row.rpe != null && row.rpe !== '' ? toNumber(row.rpe) : null,
    parsedDate: parseHevyDate(start_time),
  };
};

const sortByDateDesc = (sets: WorkoutSet[]): WorkoutSet[] => {
  return sets.sort((a, b) => {
    const timeA = a.parsedDate?.getTime() ?? 0;
    const timeB = b.parsedDate?.getTime() ?? 0;
    return timeB - timeA;
  });
};

const parseWithPapa = (csvContent: string, useWorker: boolean): Promise<WorkoutSet[]> => {
  return new Promise((resolve, reject) => {
    const config: Papa.ParseConfig<Record<string, unknown>> = {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      worker: useWorker,
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            throw new Error(results.errors[0]?.message ?? 'Failed to parse CSV');
          }
          const rawRows = (results.data ?? []) as Record<string, unknown>[];
          const fields =
            results.meta.fields && results.meta.fields.length > 0
              ? results.meta.fields
              : deriveFieldsFromRows(rawRows);
          const mode = validateHevyCSV(fields);
          const rows =
            mode === 'fast'
              ? (() => {
                  const rawRowFields = deriveFieldsFromRows(rawRows);
                  const direct = getHeaderValidation(rawRowFields, identityHeader);
                  const alreadyNormalized = direct.missing.length === 0 && direct.hasWeightHeader;
                  return alreadyNormalized
                    ? rawRows
                    : rawRows.map(r => normalizeRowKeysWith(r, normalizeHeaderFast));
                })()
              : rawRows.map(r => normalizeRowKeysWith(r, normalizeHeader));
          const mapped = rows.map(normalizeRow);
          const withStart = mapped.filter(s => Boolean(s.start_time)).length;
          const withValidDate = mapped.filter(s => Boolean(s.start_time) && Boolean(s.parsedDate)).length;
          if (withStart >= 5 && withValidDate / withStart < 0.5) {
            throw new Error(
              "We detected a Hevy workout CSV, but couldn't parse the workout dates. This usually happens when the Hevy export language isn't English. Please switch Hevy app language to English, export again, and re-upload."
            );
          }
          resolve(sortByDateDesc(mapped));
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error),
    };

    if (!useWorker) {
      config.transformHeader = (header) => normalizeHeaderFast(header);
    }

    Papa.parse<Record<string, unknown>>(csvContent, config);
  });
};

export const parseWorkoutCSV = (csvContent: string): WorkoutSet[] => {
  const result = Papa.parse<Record<string, unknown>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header) => normalizeHeaderFast(header),
  });
  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? 'Failed to parse CSV');
  }
  const rawRows = (result.data ?? []) as Record<string, unknown>[];
  const fields =
    result.meta.fields && result.meta.fields.length > 0
      ? result.meta.fields
      : deriveFieldsFromRows(rawRows);
  const mode = validateHevyCSV(fields);
  const rows =
    mode === 'fast'
      ? rawRows
      : rawRows.map(r => normalizeRowKeysWith(r, normalizeHeader));
  return sortByDateDesc(rows.map(normalizeRow));
};

export const parseWorkoutCSVAsync = (csvContent: string): Promise<WorkoutSet[]> => {
  return parseWithPapa(csvContent, true);
};
