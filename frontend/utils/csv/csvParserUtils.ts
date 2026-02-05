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

export {
  normalizeSetType,
  parseDuration,
  parseFlexibleDate,
  parseFlexibleNumber,
  rirToRpe,
} from './csvValueParsers';
