import Papa from 'papaparse';

const exerciseCSVUrl = new URL('../exercises_muscles_and_thumbnail_data.csv', import.meta.url).href;

export interface ExerciseAsset {
  name: string;
  equipment?: string;
  primary_muscle?: string;
  secondary_muscle?: string;
  source?: string;
  sourceType?: string;
  thumbnail?: string;
}

interface ExerciseAssetRow {
  name?: string;
  equipment?: string;
  primary_muscle?: string;
  secondary_muscle?: string;
  source?: string;
  sourceType?: string;
  thumbnail?: string;
}

let cache: Map<string, ExerciseAsset> | null = null;
let loadPromise: Promise<Map<string, ExerciseAsset>> | null = null;

const parseRow = (row: ExerciseAssetRow): ExerciseAsset | null => {
  if (!row?.name) return null;
  const name = String(row.name);
  return {
    name,
    equipment: row.equipment || undefined,
    primary_muscle: row.primary_muscle || undefined,
    secondary_muscle: row.secondary_muscle || undefined,
    source: row.source || undefined,
    sourceType: row.sourceType || undefined,
    thumbnail: row.thumbnail || undefined,
  };
};

const loadAssets = async (): Promise<Map<string, ExerciseAsset>> => {
  const res = await fetch(exerciseCSVUrl);
  const text = await res.text();
  const parsed = Papa.parse<ExerciseAssetRow>(text, { 
    header: true, 
    skipEmptyLines: true 
  });
  
  const map = new Map<string, ExerciseAsset>();
  for (const row of parsed.data) {
    const asset = parseRow(row);
    if (asset) {
      map.set(asset.name, asset);
    }
  }
  
  return map;
};

export const getExerciseAssets = async (): Promise<Map<string, ExerciseAsset>> => {
  if (cache) return cache;
  
  if (!loadPromise) {
    loadPromise = loadAssets().then(map => {
      cache = map;
      return map;
    });
  }
  
  return loadPromise;
};
