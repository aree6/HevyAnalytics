import { createStorageManager, createCompressedStorageManager } from './createStorageManager';

// CSV Data Storage (compressed)
const CSV_STORAGE_KEY = 'hevy_analytics_csv_data';
const csvStorage = createCompressedStorageManager(CSV_STORAGE_KEY);

export const saveCSVData = csvStorage.set;
export const getCSVData = csvStorage.get;
export const hasCSVData = csvStorage.has;
export const clearCSVData = csvStorage.clear;

// Exercise Trend Mode
export type ExerciseTrendMode = 'stable' | 'reactive';

const trendModeStorage = createStorageManager<ExerciseTrendMode>({
  key: 'hevy_analytics_exercise_trend_mode',
  defaultValue: 'reactive',
  migrator: (stored) => {
    // Migration:
    // - Old version stored 'default' for the stable algorithm.
    // - New version uses 'stable' and makes 'reactive' the default for new users.
    if (stored === 'reactive') return 'reactive';
    if (stored === 'stable') return 'stable';
    if (stored === 'default') return 'stable';
    return null;
  },
});

export const saveExerciseTrendMode = trendModeStorage.set;
export const getExerciseTrendMode = trendModeStorage.get;
export const clearExerciseTrendMode = trendModeStorage.clear;

// Weight Unit Preference
export type WeightUnit = 'kg' | 'lbs';

const weightUnitStorage = createStorageManager<WeightUnit>({
  key: 'hevy_analytics_weight_unit',
  defaultValue: 'kg',
  validator: (v) => (v === 'kg' || v === 'lbs') ? v : null,
});

export const saveWeightUnit = weightUnitStorage.set;
export const getWeightUnit = weightUnitStorage.get;
export const clearWeightUnit = weightUnitStorage.clear;

// Body Map Gender
export type StoredBodyMapGender = 'male' | 'female';

const bodyMapGenderStorage = createStorageManager<StoredBodyMapGender>({
  key: 'hevy_analytics_body_map_gender',
  defaultValue: 'male',
  validator: (v) => (v === 'male' || v === 'female') ? v : null,
});

export const saveBodyMapGender = bodyMapGenderStorage.set;
export const getBodyMapGender = bodyMapGenderStorage.get;
export const clearBodyMapGender = bodyMapGenderStorage.clear;

// Preferences Confirmed
const preferencesConfirmedStorage = createStorageManager<boolean>({
  key: 'hevy_analytics_preferences_confirmed',
  defaultValue: false,
  serializer: (v) => v ? 'true' : 'false',
  deserializer: (v) => v === 'true',
  validator: (v) => v !== null ? v === 'true' : null,
});

export const savePreferencesConfirmed = preferencesConfirmedStorage.set;
export const getPreferencesConfirmed = preferencesConfirmedStorage.get;
export const clearPreferencesConfirmed = preferencesConfirmedStorage.clear;

// Theme Mode
export type ThemeMode = 'light' | 'medium-dark' | 'midnight-dark' | 'pure-black';

const themeModeStorage = createStorageManager<ThemeMode>({
  key: 'hevy_analytics_theme_mode',
  defaultValue: 'pure-black',
  migrator: (stored) => {
    // Back-compat: legacy 'svg' (texture) theme is treated as 'pure-black'.
    const validModes: ThemeMode[] = ['light', 'medium-dark', 'midnight-dark', 'pure-black'];
    if (validModes.includes(stored as ThemeMode)) return stored as ThemeMode;
    if (stored === 'svg') return 'pure-black';
    return null;
  },
});

export const saveThemeMode = themeModeStorage.set;
export const getThemeMode = themeModeStorage.get;
export const clearThemeMode = themeModeStorage.clear;

// Heatmap Theme
export type HeatmapTheme = 'red' | 'brown' | 'blue';

const heatmapThemeStorage = createStorageManager<HeatmapTheme>({
  key: 'hevy_analytics_heatmap_theme',
  defaultValue: 'red',
  migrator: (stored) => {
    // Backward compatibility: previously supported themes (cyan/violet/emerald) map to red.
    if (stored === 'blue') return 'blue';
    if (stored === 'brown') return 'brown';
    return null;
  },
});

export const saveHeatmapTheme = heatmapThemeStorage.set;
export const getHeatmapTheme = heatmapThemeStorage.get;
export const clearHeatmapTheme = heatmapThemeStorage.clear;

// Date Mode
// 'effective' = use the latest workout date as "now" (default, better for relative time displays)
// 'actual' = use the real current date as "now"
export type DateMode = 'effective' | 'actual';

const dateModeStorage = createStorageManager<DateMode>({
  key: 'hevy_analytics_date_mode',
  defaultValue: 'effective',
  validator: (v) => (v === 'effective' || v === 'actual') ? v : null,
});

export const saveDateMode = dateModeStorage.set;
export const getDateMode = dateModeStorage.get;
export const clearDateMode = dateModeStorage.clear;

// Time Filter Mode - for UI aggregation hints
export type TimeFilterMode = 'all' | 'weekly' | 'monthly' | 'yearly';

export const getSmartFilterMode = (spanDays: number): TimeFilterMode => {
  if (spanDays < 35) return 'all';
  if (spanDays < 150) return 'weekly';
  return 'monthly';
};
