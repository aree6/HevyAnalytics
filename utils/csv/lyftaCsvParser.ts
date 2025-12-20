import { WorkoutSet } from '../../types';
import { addSeconds, isValid, parse, format } from 'date-fns';
import { toInteger, toString } from '../format/formatters';
import type { WeightUnit } from '../storage/localStorage';
import { DATE_FORMAT_HEVY } from '../date/dateUtils';
import type { ExerciseNameResolver } from '../exercise/exerciseNameResolver';

const LBS_TO_KG = 0.45359237;
const MILES_TO_KM = 1.609344;

// Lyfta CSV Headers (original casing)
// Title, Date, Duration, Exercise, Superset id, Weight, Reps, Distance, Time, Set Type

const canonicalizeLyftaHeader = (header: string): string =>
  String(header ?? '')
    .trim()
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const LYFTA_HEADER_ALIASES: Record<string, string> = {
  // Core columns
  title: 'title',
  date: 'date',
  duration: 'duration',
  exercise: 'exercise',
  superset_id: 'superset_id',
  weight: 'weight',
  reps: 'reps',
  distance: 'distance',
  time: 'time',
  set_type: 'set_type',
};

const normalizeLyftaHeader = (header: string): string => {
  const canonical = canonicalizeLyftaHeader(header);
  return LYFTA_HEADER_ALIASES[canonical] ?? canonical.replace(/_/g, ' ');
};

export const isLyftaCSV = (fields: string[] | undefined): boolean => {
  if (!fields || fields.length === 0) return false;
  const set = new Set(fields.map(normalizeLyftaHeader));
  // Lyfta CSV must have: Title, Date, Duration, Exercise, Weight, Reps, Set Type
  const required = ['title', 'date', 'duration', 'exercise', 'weight', 'reps', 'set_type'];
  return required.every(h => set.has(h));
};

const normalizeLyftaRow = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const normalizedKey = normalizeLyftaHeader(k);
    out[normalizedKey] = v;
  }
  return out;
};

const parseLyftaNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const s = String(value ?? '').trim();
  if (!s || s === 'null') return fallback;

  const looksLikeCommaDecimal = /^-?\d+,\d+$/.test(s);
  const normalized = looksLikeCommaDecimal
    ? s.replace(',', '.')
    : s.replace(/,(?=\d{3}(?:\D|$))/g, '');

  const n = parseFloat(normalized);
  return Number.isNaN(n) ? fallback : n;
};

const parseLyftaDate = (value: unknown): Date | undefined => {
  const s = String(value ?? '').trim();
  if (!s) return undefined;

  // Lyfta format: "2025-12-16 02:02:50"
  const fmts = ['yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd HH:mm', 'yyyy-MM-dd'];
  for (const f of fmts) {
    try {
      const d = parse(s, f, new Date(0));
      if (isValid(d)) return d;
    } catch {
      // ignore
    }
  }
  return undefined;
};

/**
 * Parse Lyfta duration format (HH:mm:ss or mm:ss)
 */
const parseLyftaDuration = (value: unknown): number => {
  const s = String(value ?? '').trim();
  if (!s) return 0;

  // Handle "HH:mm:ss" or "mm:ss" format
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(s)) {
    const parts = s.split(':').map(p => parseInt(p, 10));
    if (parts.some(p => Number.isNaN(p))) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1]; // mm:ss
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:mm:ss
  }

  return 0;
};

/**
 * Parse cardio time format (e.g., "16:00" for 16 minutes)
 */
const parseCardioTime = (value: unknown): number => {
  const s = String(value ?? '').trim();
  if (!s || s === 'null') return 0;

  // Handle "mm:ss" format (common for cardio)
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const parts = s.split(':').map(p => parseInt(p, 10));
    if (parts.some(p => Number.isNaN(p))) return 0;
    return parts[0] * 60 + parts[1]; // mm:ss -> seconds
  }

  return 0;
};

const formatHevyDate = (d: Date): string => {
  try {
    return format(d, DATE_FORMAT_HEVY);
  } catch {
    return '';
  }
};

/**
 * Convert Lyfta set type to standard set type
 * Lyfta types: NORMAL_SET, DROP_SET, RIGHT_SET, LEFT_SET
 */
const normalizeLyftaSetType = (setType: unknown): string => {
  const s = String(setType ?? '').trim().toLowerCase();
  switch (s) {
    case 'normal_set':
      return 'normal';
    case 'drop_set':
      return 'dropset';
    case 'right_set':
      return 'normal'; // Treat unilateral sets as normal
    case 'left_set':
      return 'normal'; // Treat unilateral sets as normal
    case 'warmup_set':
      return 'warmup';
    case 'failure_set':
      return 'failure';
    default:
      return 'normal';
  }
};

/**
 * Convert weight to kg based on user's preferred unit
 */
const weightToKg = (weight: number, preferredUnit: WeightUnit): number => {
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  // User tells us what unit their CSV is in
  return preferredUnit === 'lbs' ? weight * LBS_TO_KG : weight;
};

/**
 * Convert distance to km
 * Lyfta distance appears to be in km based on sample (1.17, 1.76, 1.85 for walking)
 */
const distanceToKm = (distance: number): number => {
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  // Lyfta appears to use km by default based on sample data
  return distance;
};

export interface LyftaParseResult {
  sets: WorkoutSet[];
  unmatchedExercises: string[];
  fuzzyMatches: number;
  representativeMatches: number;
}

export interface LyftaParseOptions {
  unit: WeightUnit;
  resolver?: ExerciseNameResolver;
}

export const parseLyftaRows = (
  rawRows: Record<string, unknown>[],
  opts: LyftaParseOptions
): LyftaParseResult => {
  const unmatched = new Set<string>();
  let fuzzyMatches = 0;
  let representativeMatches = 0;

  // Group rows by workout (same title + date combination)
  // to properly assign set_index
  const workoutGroups = new Map<string, Record<string, unknown>[]>();
  
  for (const r of rawRows) {
    const row = normalizeLyftaRow(r);
    const title = toString(row['title']);
    const date = toString(row['date']);
    const key = `${title}|${date}`;
    
    if (!workoutGroups.has(key)) {
      workoutGroups.set(key, []);
    }
    workoutGroups.get(key)!.push(row);
  }

  const mapped: WorkoutSet[] = [];
  
  for (const [, rows] of workoutGroups) {
    // Track set index per exercise within each workout
    const exerciseSetIndices = new Map<string, number>();
    
    for (const row of rows) {
      const startDate = parseLyftaDate(row['date']);
      const start_time = startDate ? formatHevyDate(startDate) : toString(row['date']);

      const durationSeconds = parseLyftaDuration(row['duration']);
      const end_time = startDate && durationSeconds > 0 
        ? formatHevyDate(addSeconds(startDate, durationSeconds)) 
        : '';

      const rawExercise = toString(row['exercise']);
      const resolution = opts.resolver ? opts.resolver.resolve(rawExercise) : null;
      const exercise_title = resolution?.name ? resolution.name : rawExercise;

      if (opts.resolver) {
        if (!resolution || resolution.method === 'none') {
          if (rawExercise) unmatched.add(rawExercise);
        } else if (resolution.method === 'fuzzy') {
          fuzzyMatches += 1;
        } else if (resolution.method === 'representative') {
          representativeMatches += 1;
        }
      }

      const weight = parseLyftaNumber(row['weight']);
      const weight_kg = weightToKg(weight, opts.unit);

      const distance = parseLyftaNumber(row['distance']);
      const distance_km = distanceToKm(distance);

      // For cardio exercises, use the "Time" field for duration
      const cardioSeconds = parseCardioTime(row['time']);
      const duration_seconds = cardioSeconds > 0 ? cardioSeconds : 0;

      const setType = normalizeLyftaSetType(row['set_type']);
      const supersetId = toString(row['superset_id']);

      // Calculate set index for this exercise
      const currentSetIndex = (exerciseSetIndices.get(rawExercise) ?? 0) + 1;
      exerciseSetIndices.set(rawExercise, currentSetIndex);

      mapped.push({
        title: toString(row['title']),
        start_time,
        end_time,
        description: '',
        exercise_title,
        superset_id: supersetId,
        exercise_notes: '',
        set_index: currentSetIndex,
        set_type: setType,
        weight_kg,
        reps: parseLyftaNumber(row['reps']),
        distance_km,
        duration_seconds,
        rpe: null,
        parsedDate: startDate,
      });
    }
  }

  return {
    sets: mapped,
    unmatchedExercises: Array.from(unmatched).sort((a, b) => a.localeCompare(b)),
    fuzzyMatches,
    representativeMatches,
  };
};
