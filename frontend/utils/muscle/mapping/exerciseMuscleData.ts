import { createExerciseNameResolver, type ExerciseNameResolver } from '../../exercise/exerciseNameResolver';

export interface ExerciseMuscleData {
  name: string;
  equipment: string;
  primary_muscle: string;
  secondary_muscle: string;
}

let exerciseMuscleCache: Map<string, ExerciseMuscleData> | null = null;

export const loadExerciseMuscleData = async (): Promise<Map<string, ExerciseMuscleData>> => {
  if (exerciseMuscleCache) return exerciseMuscleCache;

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}exercises_muscles_and_thumbnail_data.csv`);
    const text = await response.text();
    const lines = text.split('\n');
    const map = new Map<string, ExerciseMuscleData>();

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handling commas in values)
      const parts = parseCSVLine(line);
      if (parts.length >= 4) {
        const name = parts[0].trim();
        map.set(name.toLowerCase(), {
          name,
          equipment: parts[1] || '',
          primary_muscle: parts[2] || '',
          secondary_muscle: parts[3] || '',
        });
      }
    }

    exerciseMuscleCache = map;
    return map;
  } catch (error) {
    console.error('Failed to load exercise muscle data:', error);
    return new Map();
  }
};

// Cached resolver for fuzzy exercise name matching
let exerciseResolverCache: ExerciseNameResolver | null = null;
let exerciseResolverRef: Map<string, ExerciseMuscleData> | null = null;

const getExerciseResolver = (muscleData: Map<string, ExerciseMuscleData>): ExerciseNameResolver => {
  if (exerciseResolverRef === muscleData && exerciseResolverCache) {
    return exerciseResolverCache;
  }
  // Create resolver from the canonical names (values, not keys which are lowercased)
  const canonicalNames = Array.from(muscleData.values()).map((d) => d.name);
  exerciseResolverCache = createExerciseNameResolver(canonicalNames);
  exerciseResolverRef = muscleData;
  return exerciseResolverCache;
};

/**
 * Look up exercise muscle data with fuzzy name matching.
 * This handles variations in exercise names from different CSV sources.
 */
export const lookupExerciseMuscleData = (
  exerciseTitle: string,
  muscleData: Map<string, ExerciseMuscleData>
): ExerciseMuscleData | undefined => {
  if (!exerciseTitle) return undefined;

  // Try exact lowercase match first (fast path)
  const exactMatch = muscleData.get(exerciseTitle.toLowerCase());
  if (exactMatch) return exactMatch;

  // Use fuzzy resolver for non-exact matches
  const resolver = getExerciseResolver(muscleData);
  const resolution = resolver.resolve(exerciseTitle);

  if (resolution.method !== 'none' && resolution.name) {
    return muscleData.get(resolution.name.toLowerCase());
  }

  return undefined;
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
