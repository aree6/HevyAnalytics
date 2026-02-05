import type { ExerciseAsset } from '../../data/exerciseAssets';
import { createExerciseNameResolver, type ExerciseNameResolver } from '../../exercise/exerciseNameResolver';

/** Cache for lowercase asset lookups */
let assetLowerCache: Map<string, ExerciseAsset> | null = null;
let assetCacheRef: Map<string, ExerciseAsset> | null = null;
let assetResolverCache: ExerciseNameResolver | null = null;
let assetResolverRef: Map<string, ExerciseAsset> | null = null;

/**
 * Gets or creates a lowercase-keyed version of the assets map for case-insensitive lookups.
 */
export function getAssetLowerMap(assetsMap: Map<string, ExerciseAsset>): Map<string, ExerciseAsset> {
  if (assetCacheRef === assetsMap && assetLowerCache) return assetLowerCache;

  assetLowerCache = new Map();
  assetsMap.forEach((v, k) => assetLowerCache!.set(k.toLowerCase(), v));
  assetCacheRef = assetsMap;
  return assetLowerCache;
}

/**
 * Gets or creates a fuzzy resolver for exercise name matching.
 */
function getAssetResolver(assetsMap: Map<string, ExerciseAsset>): ExerciseNameResolver {
  if (assetResolverRef === assetsMap && assetResolverCache) return assetResolverCache;

  const names = Array.from(assetsMap.keys());
  assetResolverCache = createExerciseNameResolver(names);
  assetResolverRef = assetsMap;
  return assetResolverCache;
}

/**
 * Looks up an exercise asset by name with fuzzy matching.
 * This handles variations in exercise names from different CSV sources.
 */
export function lookupExerciseAsset(
  name: string,
  assetsMap: Map<string, ExerciseAsset>,
  lowerMap: Map<string, ExerciseAsset>
): ExerciseAsset | undefined {
  if (!name) return undefined;

  // Fast path: exact match
  const exact = assetsMap.get(name);
  if (exact) return exact;

  // Fast path: case-insensitive match
  const lower = lowerMap.get(name.toLowerCase());
  if (lower) return lower;

  // Fallback: fuzzy matching
  const resolver = getAssetResolver(assetsMap);
  const resolution = resolver.resolve(name);

  if (resolution.method !== 'none' && resolution.name) {
    return assetsMap.get(resolution.name) ?? lowerMap.get(resolution.name.toLowerCase());
  }

  return undefined;
}
