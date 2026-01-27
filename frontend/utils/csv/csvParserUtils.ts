import { isValid, parse } from 'date-fns';

// ============================================================================
// CONSTANTS
// ============================================================================

export const OUTPUT_DATE_FORMAT = 'dd MMM yyyy, HH:mm';

// ============================================================================
// STRING NORMALIZATION
// ============================================================================

/**
 * Normalize string for matching: lowercase, remove all non-alphanumeric
 */
export const normalize = (s: string): string =>
  String(s ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

/**
 * Clean header: lowercase, normalize separators, remove BOM
 */
export const normalizeHeader = (s: string): string =>
  String(s ?? '')
    .toLowerCase()
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

/**
 * Dice coefficient for string similarity
 */
export const similarity = (a: string, b: string): number => {
  const aNorm = normalize(a);
  const bNorm = normalize(b);

  if (aNorm === bNorm) return 1;
  if (aNorm.length < 2 || bNorm.length < 2) return 0;

  // Containment check
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
    const ratio = Math.min(aNorm.length, bNorm.length) / Math.max(aNorm.length, bNorm.length);
    return 0.7 + ratio * 0.25;
  }

  // Bigram similarity
  const getBigrams = (s: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.slice(i, i + 2));
    }
    return bigrams;
  };

  const aBigrams = getBigrams(aNorm);
  const bBigrams = getBigrams(bNorm);

  let matches = 0;
  for (const bigram of aBigrams) {
    if (bBigrams.has(bigram)) matches++;
  }

  return (2 * matches) / (aBigrams.size + bBigrams.size);
};

/**
 * Detect sequential reset patterns in numbers (1,2,3,1,2,1,2,3...)
 */
export const detectSequentialResets = (nums: number[]): boolean => {
  if (nums.length < 3) return true;
  let resets = 0;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === 1 && nums[i - 1] > 1) resets++;
  }
  return resets >= 1 || nums.every((n) => n >= 1 && n <= 15);
};

/**
 * Extract unit hint from header name
 */
export const extractUnitFromHeader = (header: string): string | undefined => {
  const h = header.toLowerCase();

  // Weight units
  if (/kgs?$|_kgs?$|\(kgs?\)/i.test(h)) return 'kg';
  if (/lbs? $|_lbs?$|pounds|\(lbs?\)/i.test(h)) return 'lbs';

  // Distance units
  if (/km$|_km$|kilometers?|kilometres?|\(km\)/i.test(h)) return 'km';
  if (/mi$|_mi$|miles?|\(mi\)/i.test(h)) return 'miles';
  if (/(?:^|_)m$|meters?|metres?|\(m\)/i.test(h) && !/km|mi/i.test(h)) return 'meters';

  return undefined;
};

// ============================================================================
// PARSING
// ============================================================================

/**
 * Parse number with international format support (US & EU)
 */
export const parseFlexibleNumber = (value: unknown, fallback = NaN): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;

  let s = String(value ?? '').trim();
  if (!s || s === 'null' || s === 'undefined' || s === '-') return fallback;

  // Remove common suffixes
  s = s.replace(/\s*(kg|kgs|lb|lbs|km|mi|m|sec|s|min|reps?)$/i, '');

  // Detect format: EU (1.234,56) vs US (1,234.56)
  const hasCommaDecimal = /^\d{1,3}(\.\d{3})*,\d+$/.test(s);
  const hasDotDecimal = /^\d{1,3}(,\d{3})*\.\d+$/.test(s);

  if (hasCommaDecimal) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasDotDecimal) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Parse date with comprehensive format support
 */
export const parseFlexibleDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && isValid(value)) return value;

  const s = String(value ?? '').trim();
  if (!s) return undefined;

  const normalizeTwoDigitYearIfNeeded = (d: Date): Date => {
    if (!isValid(d)) return d;
    const y = d.getFullYear();
    // date-fns parses 2-digit years using the reference date's century.
    // When we parse with an epoch reference, years like "23" can become 1923.
    // If bumping the century lands in our plausible data range, do it.
    if (y > 0 && y < 1971) {
      const bumped = y + 100;
      if (bumped > 1970 && bumped < 2100) {
        const copy = new Date(d.getTime());
        copy.setFullYear(bumped);
        return copy;
      }
    }
    return d;
  };

  const formats = [
    // ISO
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy-MM-dd',
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ssXXX",
    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
    // Hevy
    'dd MMM yyyy, HH:mm',
    'dd MMM yyyy HH:mm',
    // European
    'dd/MM/yyyy HH:mm:ss',
    'dd/MM/yyyy HH:mm',
    'dd/MM/yyyy',
    'dd/MM/yy HH:mm:ss',
    'dd/MM/yy HH:mm',
    'dd/MM/yy',
    'dd-MM-yyyy HH:mm:ss',
    'dd-MM-yy HH:mm:ss',
    'dd-MM-yy',
    'dd-MM-yyyy',
    'dd. MM.yyyy HH:mm:ss',
    'dd. MM.yyyy',
    // US
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yyyy HH:mm',
    'MM/dd/yyyy',
    'MM/dd/yy HH:mm:ss',
    'MM/dd/yy HH:mm',
    'MM/dd/yy',
    'M/d/yyyy h:mm a',
    'M/d/yyyy h:mm:ss a',
    'M/d/yy h:mm a',
    'M/d/yy h:mm:ss a',
    // Other
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd',
    'MMM dd, yyyy HH:mm',
    'MMMM dd, yyyy',
    'dd MMM yyyy',
  ];

  for (const fmt of formats) {
    try {
      const d = normalizeTwoDigitYearIfNeeded(parse(s, fmt, new Date(0)));
      if (isValid(d) && d.getFullYear() > 1970 && d.getFullYear() < 2100) {
        return d;
      }
    } catch {
      // Continue
    }
  }

  // Native fallback
  try {
    const d = new Date(s);
    if (isValid(d) && d.getFullYear() > 1970 && d.getFullYear() < 2100) {
      return d;
    }
  } catch {
    // Ignore
  }

  return undefined;
};

/**
 * Parse duration to seconds
 */
export const parseDuration = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  const s = String(value ?? '').trim();
  if (!s) return 0;

  // Pure number
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    return Math.round(parseFloat(s));
  }

  // HH:MM:SS or MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(':').map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p))) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  // Text format: 1h 30m 45s
  let total = 0;
  const hours = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour)/i);
  const mins = s.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute)/i);
  const secs = s.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second)/i);

  if (hours) total += parseFloat(hours[1]) * 3600;
  if (mins) total += parseFloat(mins[1]) * 60;
  if (secs) total += parseFloat(secs[1]);

  return Math.round(total);
};

/**
 * Normalize set type to standard values.
 * These values match the SetTypeId in setClassification.ts
 */
export const normalizeSetType = (value: unknown): string => {
  const s = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!s || s === 'normalset' || s === 'normal' || s === 'working' || s === 'work' || s === 'regular' || s === 'standard') return 'normal';
  
  // Warmup variations
  if (s.includes('warm') || s === 'w' || s === 'warmupset') return 'warmup';
  
  // Unilateral (left/right)
  if (s === 'left' || s === 'leftset' || s === 'l' || (s.includes('left') && s.includes('set'))) return 'left';
  if (s === 'right' || s === 'rightset' || s === 'r' || (s.includes('right') && s.includes('set'))) return 'right';
  
  // Drop sets
  if (s.includes('drop') || s === 'd' || s === 'dropset') return 'dropset';
  
  // Failure
  if (s.includes('fail') || s === 'x' || s === 'failure') return 'failure';
  
  // AMRAP
  if (s.includes('amrap') || s === 'a') return 'amrap';
  
  // Rest-pause
  if ((s.includes('rest') && s.includes('pause')) || s === 'rp' || s === 'restpause') return 'restpause';
  
  // Myo reps
  if (s.includes('myo') || s === 'm' || s === 'myoreps' || s === 'myorepsset') return 'myoreps';
  
  // Cluster
  if (s.includes('cluster') || s === 'c') return 'cluster';
  
  // Giant set
  if (s.includes('giant') || s === 'g' || s === 'giantset') return 'giantset';
  
  // Superset
  if (s.includes('super') || s === 's' || s === 'superset') return 'superset';
  
  // Back-off set
  if (s.includes('backoff') || (s.includes('back') && s.includes('off')) || s === 'b' || s === 'backoffset') return 'backoff';
  
  // Top set
  if (s.includes('top') || s === 't' || s === 'topset') return 'topset';
  
  // Feeder set
  if (s.includes('feeder') || s === 'f' || s === 'feederset') return 'feederset';
  
  // Partial reps
  if (s.includes('partial') || s === 'p' || s === 'partialreps' || s === 'partialrepsset') return 'partial';

  return 'normal';
};

/**
 * Convert RIR to RPE
 */
export const rirToRpe = (rir: number): number => Math.max(1, Math.min(10, 10 - rir));

// ============================================================================
// CSV
// ============================================================================

export const guessDelimiter = (content: string): string => {
  const firstLine = content.split(/\r?\n/)[0] ?? '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ',';
};
