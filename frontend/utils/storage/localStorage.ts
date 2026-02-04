import LZString from 'lz-string';
const STORAGE_KEY = 'hevy_analytics_csv_data';

/**
 * Save CSV data to local storage
 */
export const saveCSVData = (csvData: string): void => {
  try {
    const compressed = LZString.compressToUTF16(csvData);
    localStorage.setItem(STORAGE_KEY, compressed);
  } catch (error) {
    console.error('Failed to save CSV data to local storage:', error);
  }
};

/**
 * Retrieve CSV data from local storage
 */
export const getCSVData = (): string | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data === null) return null;
    const decompressed = LZString.decompressFromUTF16(data);
    return decompressed !== null ? decompressed : data;
  } catch (error) {
    console.error('Failed to retrieve CSV data from local storage:', error);
    return null;
  }
};

/**
 * Check if CSV data exists in local storage
 */
export const hasCSVData = (): boolean => {
  return getCSVData() !== null;
};

/**
 * Clear CSV data from local storage
 */
export const clearCSVData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear CSV data from local storage:', error);
  }
};

export type TimeFilterMode = 'all' | 'weekly' | 'monthly' | 'yearly';

/**
 * Determine a reasonable aggregation mode for the *All* range based on total span (in days).
 *
 * Note: This does not represent the UI range selection (which can include 'yearly'); it's a
 * bucketing hint for long spans so charts stay readable.
 */
export const getSmartFilterMode = (spanDays: number): TimeFilterMode => {
  if (spanDays < 35) return 'all';      // <5 weeks → show all
  if (spanDays < 150) return 'weekly';  // 5 weeks to ~5 months → weekly
  return 'monthly';                      // 5+ months → monthly
};

export type ExerciseTrendMode = 'stable' | 'reactive';

const EXERCISE_TREND_MODE_KEY = 'hevy_analytics_exercise_trend_mode';

export const saveExerciseTrendMode = (mode: ExerciseTrendMode): void => {
  try {
    localStorage.setItem(EXERCISE_TREND_MODE_KEY, mode);
  } catch (error) {
    console.error('Failed to save exercise trend mode to local storage:', error);
  }
};

export const getExerciseTrendMode = (): ExerciseTrendMode => {
  try {
    const mode = localStorage.getItem(EXERCISE_TREND_MODE_KEY);
    // Migration:
    // - Old version stored 'default' for the stable algorithm.
    // - New version uses 'stable' and makes 'reactive' the default for new users.
    if (mode === 'reactive') return 'reactive';
    if (mode === 'stable') return 'stable';
    if (mode === 'default') return 'stable';
    return 'reactive';
  } catch (error) {
    console.error('Failed to retrieve exercise trend mode from local storage:', error);
    return 'reactive';
  }
};

export const clearExerciseTrendMode = (): void => {
  try {
    localStorage.removeItem(EXERCISE_TREND_MODE_KEY);
  } catch (error) {
    console.error('Failed to clear exercise trend mode from local storage:', error);
  }
};

// Weight Unit Preference Storage
export type WeightUnit = 'kg' | 'lbs';
const WEIGHT_UNIT_KEY = 'hevy_analytics_weight_unit';

const BODY_MAP_GENDER_KEY = 'hevy_analytics_body_map_gender';
export type StoredBodyMapGender = 'male' | 'female';

const PREFERENCES_CONFIRMED_KEY = 'hevy_analytics_preferences_confirmed';

/**
 * Save weight unit preference to local storage
 */
export const saveWeightUnit = (unit: WeightUnit): void => {
  try {
    localStorage.setItem(WEIGHT_UNIT_KEY, unit);
  } catch (error) {
    console.error('Failed to save weight unit to local storage:', error);
  }
};

/**
 * Retrieve weight unit preference from local storage
 */
export const getWeightUnit = (): WeightUnit => {
  try {
    const unit = localStorage.getItem(WEIGHT_UNIT_KEY);
    return (unit === 'kg' || unit === 'lbs') ? unit : 'kg';
  } catch (error) {
    console.error('Failed to retrieve weight unit from local storage:', error);
    return 'kg';
  }
};

export const clearWeightUnit = (): void => {
  try {
    localStorage.removeItem(WEIGHT_UNIT_KEY);
  } catch (error) {
    console.error('Failed to clear weight unit from local storage:', error);
  }
};

export const saveBodyMapGender = (gender: StoredBodyMapGender): void => {
  try {
    localStorage.setItem(BODY_MAP_GENDER_KEY, gender);
  } catch (error) {
    console.error('Failed to save body map gender to local storage:', error);
  }
};

export const getBodyMapGender = (): StoredBodyMapGender => {
  try {
    const gender = localStorage.getItem(BODY_MAP_GENDER_KEY);
    return (gender === 'male' || gender === 'female') ? gender : 'male';
  } catch (error) {
    console.error('Failed to retrieve body map gender from local storage:', error);
    return 'male';
  }
};

export const clearBodyMapGender = (): void => {
  try {
    localStorage.removeItem(BODY_MAP_GENDER_KEY);
  } catch (error) {
    console.error('Failed to clear body map gender from local storage:', error);
  }
};

export const savePreferencesConfirmed = (confirmed: boolean): void => {
  try {
    localStorage.setItem(PREFERENCES_CONFIRMED_KEY, confirmed ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to save preferences confirmed flag to local storage:', error);
  }
};

export const getPreferencesConfirmed = (): boolean => {
  try {
    return localStorage.getItem(PREFERENCES_CONFIRMED_KEY) === 'true';
  } catch (error) {
    console.error('Failed to retrieve preferences confirmed flag from local storage:', error);
    return false;
  }
};

export const clearPreferencesConfirmed = (): void => {
  try {
    localStorage.removeItem(PREFERENCES_CONFIRMED_KEY);
  } catch (error) {
    console.error('Failed to clear preferences confirmed flag from local storage:', error);
  }
};

export type ThemeMode = 'light' | 'medium-dark' | 'midnight-dark' | 'pure-black';

const THEME_MODE_KEY = 'hevy_analytics_theme_mode';

export const saveThemeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch (error) {
    console.error('Failed to save theme mode to local storage:', error);
  }
};

export const getThemeMode = (): ThemeMode => {
  try {
    const mode = localStorage.getItem(THEME_MODE_KEY);
    // Back-compat: legacy 'svg' (texture) theme is treated as 'pure-black'.
    return mode === 'light' || mode === 'medium-dark' || mode === 'midnight-dark' || mode === 'pure-black'
      ? mode
      : 'pure-black';
  } catch (error) {
    console.error('Failed to retrieve theme mode from local storage:', error);
    return 'pure-black';
  }
};

export const clearThemeMode = (): void => {
  try {
    localStorage.removeItem(THEME_MODE_KEY);
  } catch (error) {
    console.error('Failed to clear theme mode from local storage:', error);
  }
};

export type HeatmapTheme = 'red' | 'brown' | 'blue';

const HEATMAP_THEME_KEY = 'hevy_analytics_heatmap_theme';

export const saveHeatmapTheme = (theme: HeatmapTheme): void => {
  try {
    localStorage.setItem(HEATMAP_THEME_KEY, theme);
  } catch (error) {
    console.error('Failed to save heatmap theme to local storage:', error);
  }
};

export const getHeatmapTheme = (): HeatmapTheme => {
  try {
    const theme = localStorage.getItem(HEATMAP_THEME_KEY);

    // Backward compatibility: previously supported themes (cyan/violet/emerald) map to red.
    // This keeps existing users on a valid palette without breaking localStorage.
    if (theme === 'blue') return 'blue';
    if (theme === 'brown') return 'brown';
    return 'red';
  } catch (error) {
    console.error('Failed to retrieve heatmap theme from local storage:', error);
    return 'red';
  }
};

export const clearHeatmapTheme = (): void => {
  try {
    localStorage.removeItem(HEATMAP_THEME_KEY);
  } catch (error) {
    console.error('Failed to clear heatmap theme from local storage:', error);
  }
};

// Date Mode Preference Storage
// 'effective' = use the latest workout date as "now" (default, better for relative time displays)
// 'actual' = use the real current date as "now"
export type DateMode = 'effective' | 'actual';
const DATE_MODE_KEY = 'hevy_analytics_date_mode';

export const saveDateMode = (mode: DateMode): void => {
  try {
    localStorage.setItem(DATE_MODE_KEY, mode);
  } catch (error) {
    console.error('Failed to save date mode to local storage:', error);
  }
};

export const getDateMode = (): DateMode => {
  try {
    const mode = localStorage.getItem(DATE_MODE_KEY);
    return mode === 'effective' || mode === 'actual' ? mode : 'effective';
  } catch (error) {
    console.error('Failed to retrieve date mode from local storage:', error);
    return 'effective';
  }
};

export const clearDateMode = (): void => {
  try {
    localStorage.removeItem(DATE_MODE_KEY);
  } catch (error) {
    console.error('Failed to clear date mode from local storage:', error);
  }
};
