import { EXERCISE_ALIASES } from './exerciseNameAliases';
import { RELAXED_STOP_TOKENS, STOP_TOKENS } from './exerciseNameTokens';

export type ExerciseNameResolveMethod =
  | 'exact'
  | 'case_insensitive'
  | 'alias'
  | 'normalized_exact'
  | 'normalized_case_insensitive'
  | 'fuzzy'
  | 'representative'
  | 'none';

export interface ExerciseNameResolution {
  name: string;
  method: ExerciseNameResolveMethod;
}

export interface ExerciseNameResolver {
  resolve: (rawName: string) => ExerciseNameResolution;
}

export type ExerciseNameResolverMode = 'strict' | 'relaxed';

export interface ExerciseNameResolverOptions {
  mode?: ExerciseNameResolverMode;
}


const collapseSpaces = (s: string): string => s.replace(/\s+/g, ' ').trim();

const stripParensContent = (s: string): string =>
  collapseSpaces(String(s ?? '').replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, ' '));

const removeBracketChars = (s: string): string => collapseSpaces(s.replace(/[()\[\]{}]/g, ' '));

const normalizeDashes = (s: string): string => s.replace(/[\u2010-\u2015]/g, '-');

const normalizePunctuationToSpace = (s: string): string =>
  collapseSpaces(
    s
      .replace(/&/g, ' and ')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
  );

const normalizeCompoundTokens = (s: string): string => {
  const lower = s.toLowerCase();
  return collapseSpaces(
    lower
      .replace(/\btricep\b/g, 'triceps')
      .replace(/\bbicep\b/g, 'biceps')
      .replace(/\bdumbbells\b/g, 'dumbbell')
      .replace(/\bbarbells\b/g, 'barbell')
      .replace(/\bkettlebells\b/g, 'kettlebell')
      .replace(/\bplates\b/g, 'plate')
      .replace(/pull\s*down/g, 'pulldown')
      .replace(/push\s*down/g, 'pushdown')
      .replace(/chin\s*up/g, 'chinup')
      .replace(/\bchin\b/g, 'chinup')
      .replace(/pull\s*up/g, 'pullup')
  );
};

export const normalizeExerciseNameBasic = (name: string): string => {
  return collapseSpaces(normalizeDashes(String(name ?? '')).trim());
};

const normalizeAliasKey = (name: string): string => {
  return collapseSpaces(normalizeCompoundTokens(normalizePunctuationToSpace(normalizeExerciseNameBasic(name))));
};

const toTokenSet = (name: string, mode: ExerciseNameResolverMode): Set<string> => {
  const stop = mode === 'relaxed' ? RELAXED_STOP_TOKENS : STOP_TOKENS;
  const base = normalizeAliasKey(removeBracketChars(name));
  const tokens = base
    .split(' ')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .filter(t => !/^\d+$/.test(t))
    .filter(t => !stop.has(t));
  return new Set(tokens);
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
};

const overlapCoefficient = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const denom = Math.min(a.size, b.size);
  return denom > 0 ? inter / denom : 0;
};

export const createExerciseNameResolver = (
  candidateNames: Iterable<string>,
  options?: ExerciseNameResolverOptions
): ExerciseNameResolver => {
  const mode: ExerciseNameResolverMode = options?.mode ?? 'strict';
  const candidates = Array.from(candidateNames);

  const exactSet = new Set(candidates);
  const lowerMap = new Map<string, string>();
  for (const n of candidates) {
    const lower = n.toLowerCase();
    if (!lowerMap.has(lower)) lowerMap.set(lower, n);
  }

  const normalizedKeyMap = new Map<string, string>();
  for (const n of candidates) {
    const key = normalizeAliasKey(n);
    if (!normalizedKeyMap.has(key)) normalizedKeyMap.set(key, n);
  }

  const tokenIndex = candidates.map((n) => ({ name: n, tokens: toTokenSet(n, mode) }));
  const cache = new Map<string, ExerciseNameResolution>();

  const resolve = (rawName: string): ExerciseNameResolution => {
    const raw = normalizeExerciseNameBasic(rawName);
    if (!raw) return { name: rawName, method: 'none' };

    const cached = cache.get(raw);
    if (cached) return cached;

    if (exactSet.has(raw)) {
      const res = { name: raw, method: 'exact' as const };
      cache.set(raw, res);
      return res;
    }

    const directLower = lowerMap.get(raw.toLowerCase());
    if (directLower) {
      const res = { name: directLower, method: 'case_insensitive' as const };
      cache.set(raw, res);
      return res;
    }

    const aliasKey = normalizeAliasKey(raw);
    
    // Check comprehensive aliases - try all fallbacks
    const aliasOptions = EXERCISE_ALIASES[aliasKey];
    if (aliasOptions) {
      for (const alias of aliasOptions) {
        const aliasExact = exactSet.has(alias) ? alias : undefined;
        const aliasLower = lowerMap.get(alias.toLowerCase());
        const chosen = aliasExact ?? aliasLower;
        if (chosen) {
          const res = { name: chosen, method: 'alias' as const };
          cache.set(raw, res);
          return res;
        }
      }
    }
    
    // Also check stripped paren version for alias
    const aliasKeyNoParens = normalizeAliasKey(stripParensContent(raw));
    if (aliasKeyNoParens !== aliasKey) {
      const aliasOptionsNoParens = EXERCISE_ALIASES[aliasKeyNoParens];
      if (aliasOptionsNoParens) {
        for (const alias of aliasOptionsNoParens) {
          const aliasExact = exactSet.has(alias) ? alias : undefined;
          const aliasLower = lowerMap.get(alias.toLowerCase());
          const chosen = aliasExact ?? aliasLower;
          if (chosen) {
            const res = { name: chosen, method: 'alias' as const };
            cache.set(raw, res);
            return res;
          }
        }
      }
    }

    const normalizedExact = normalizedKeyMap.get(aliasKey);
    if (normalizedExact) {
      const res = { name: normalizedExact, method: 'normalized_exact' as const };
      cache.set(raw, res);
      return res;
    }

    const normalizedNoParensKey = normalizeAliasKey(stripParensContent(raw));
    const normalizedNoParensExact = normalizedKeyMap.get(normalizedNoParensKey);
    if (normalizedNoParensExact) {
      const res = { name: normalizedNoParensExact, method: 'normalized_case_insensitive' as const };
      cache.set(raw, res);
      return res;
    }

    const tokens = toTokenSet(raw, mode);
    const allowSingleToken = mode === 'relaxed';
    if (tokens.size >= 1 || (allowSingleToken && tokens.size === 1)) {
      let best: { name: string; score: number; tokenCount: number } | null = null;
      let secondBestScore = 0;

      for (const c of tokenIndex) {
        // Use overlap coefficient as primary metric - better for subset matching
        // e.g. "Advanced Plank" → tokens: [advanced, plank] matches "Plank" → tokens: [plank]
        const jaccardScore = jaccard(tokens, c.tokens);
        const overlapScore = overlapCoefficient(tokens, c.tokens);
        // Weight overlap higher for subset matching scenarios
        const score = Math.max(jaccardScore, overlapScore * 1.1);
        const tokenCount = c.tokens.size;
        if (!best || score > best.score) {
          if (best) secondBestScore = best.score;
          best = { name: c.name, score, tokenCount };
        } else if (score === best.score) {
          // Prefer the more "general" candidate (fewer tokens), then stable sort by name
          if (tokenCount < best.tokenCount || (tokenCount === best.tokenCount && c.name.localeCompare(best.name) < 0)) {
            best = { name: c.name, score, tokenCount };
          }
        } else if (score > secondBestScore) {
          secondBestScore = score;
        }
      }

      if (best) {
        if (mode === 'strict') {
          const scoreGap = best.score - secondBestScore;
          // Lower threshold to 0.5 and reduce gap requirement to allow more matches
          const acceptable = best.score >= 0.5 && scoreGap >= 0.05;
          if (acceptable) {
            const res = { name: best.name, method: 'fuzzy' as const };
            cache.set(raw, res);
            return res;
          }
        } else {
          const acceptable = best.score >= 0.4;
          if (acceptable) {
            const res = { name: best.name, method: 'representative' as const };
            cache.set(raw, res);
            return res;
          }
        }
      }
    }

    const res = { name: rawName, method: 'none' as const };
    cache.set(raw, res);
    return res;
  };

  return { resolve };
};
