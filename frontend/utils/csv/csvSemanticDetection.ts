import type { FieldMatch, Row, SemanticConfig, SemanticField } from './csvParserTypes';
import { SEMANTIC_DICTIONARY, UNIQUE_FIELDS } from './csvSemanticDictionary';
import { extractUnitFromHeader, normalize, normalizeHeader, similarity } from './csvParserUtils';

// ============================================================================
// SEMANTIC FIELD DETECTION
// ============================================================================

/**
 * Find best semantic match for a header
 */
export const findBestMatch = (
  header: string,
  sampleValues: unknown[],
  usedFields: Set<SemanticField>
): FieldMatch | null => {
  const normalizedHeader = normalize(header);
  const cleanHeader = normalizeHeader(header);
  let bestMatch: FieldMatch | null = null;
  let bestScore = 0;

  for (const [field, config] of Object.entries(SEMANTIC_DICTIONARY) as [SemanticField, SemanticConfig][]) {
    // Skip unique fields already used
    if (UNIQUE_FIELDS.includes(field) && usedFields.has(field)) continue;

    let score = 0;

    for (const synonym of config.synonyms) {
      const normalizedSynonym = normalize(synonym);
      const cleanSynonym = normalizeHeader(synonym);

      // Exact match
      if (normalizedHeader === normalizedSynonym) {
        score = 1.0;
        break;
      }

      // Clean match
      if (cleanHeader === cleanSynonym) {
        score = Math.max(score, 0.95);
        continue;
      }

      // Fuzzy match
      const sim = similarity(header, synonym);
      if (sim > 0.75) {
        score = Math.max(score, sim);
      }
    }

    // Boost with value validation (but not for exact/near-exact header matches)
    const isExactMatch = score >= 0.95;
    if (score > 0 && score < 0.95 && config.validate && sampleValues.length > 0) {
      const validValues = sampleValues.filter((v) => v !== null && v !== undefined && v !== '');
      if (validValues.length > 0) {
        const validationScore = config.validate(validValues);
        score = score * 0.6 + validationScore * 0.4;
      }
    }

    // For exact matches, only boost (never reduce) with validation
    if (isExactMatch && config.validate && sampleValues.length > 0) {
      const validValues = sampleValues.filter((v) => v !== null && v !== undefined && v !== '');
      if (validValues.length > 0) {
        const validationScore = config.validate(validValues);
        // Only boost if validation is positive, never reduce below exact match score
        if (validationScore > 0.5) {
          score = Math.max(score, score * 0.9 + validationScore * 0.1);
        }
      }
    }

    // Apply priority, but give exact matches a significant boost to ensure they
    // always beat partial/fuzzy matches from other fields
    let finalScore = score * (config.priority / 10);
    if (isExactMatch) {
      // Exact header matches should always win - add bonus that exceeds max priority
      finalScore += 1.0;
    }

    if (finalScore > bestScore && score > 0.5) {
      bestScore = finalScore;
      bestMatch = {
        field,
        confidence: score,
        originalHeader: header,
        unitHint: field === 'weight' || field === 'distance' ? extractUnitFromHeader(header) : undefined,
      };
    }
  }

  return bestMatch;
};

/**
 * Detect all field mappings
 */
export const detectFieldMappings = (headers: string[], sampleRows: Row[]): Map<string, FieldMatch> => {
  const mappings = new Map<string, FieldMatch>();
  const usedFields = new Set<SemanticField>();

  // Score all headers
  const scores: Array<{ header: string; match: FieldMatch | null }> = [];
  for (const header of headers) {
    const values = sampleRows.map((r) => r[header]);
    scores.push({ header, match: findBestMatch(header, values, usedFields) });
  }

  // Sort by confidence and assign greedily
  scores.sort((a, b) => (b.match?.confidence ?? 0) - (a.match?.confidence ?? 0));

  for (const { header, match } of scores) {
    if (match && !usedFields.has(match.field)) {
      mappings.set(header, match);
      usedFields.add(match.field);
    }
  }

  return mappings;
};
