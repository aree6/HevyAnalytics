/**
 * Centralized preferences hook for easy database migration.
 * 
 * All user preferences are managed through this hook. Currently uses localStorage,
 * but the interface is designed so that swapping to a database backend only requires
 * changing the implementation of the get/save functions - no changes needed in components.
 * 
 * To migrate to a database:
 * 1. Create a PreferencesService class with async get/save methods
 * 2. Replace the localStorage calls in this file with API calls
 * 3. Add loading states and error handling as needed
 * 4. Components using this hook won't need any changes
 */

import { useCallback, useMemo } from 'react';
import {
  WeightUnit,
  getWeightUnit,
  saveWeightUnit,
  StoredBodyMapGender,
  getBodyMapGender,
  saveBodyMapGender,
  ThemeMode,
  getThemeMode,
  saveThemeMode,
  HeatmapTheme,
  getHeatmapTheme,
  saveHeatmapTheme,
  DateMode,
  getDateMode,
  saveDateMode,
  ExerciseTrendMode,
  getExerciseTrendMode,
  saveExerciseTrendMode,
} from '../utils/storage/localStorage';

// Re-export DateMode for convenience
export type { DateMode } from '../utils/storage/localStorage';

/**
 * Shape of all user preferences.
 * Add new preferences here when extending the system.
 */
export interface UserPreferences {
  weightUnit: WeightUnit;
  bodyMapGender: StoredBodyMapGender;
  themeMode: ThemeMode;
  heatmapTheme: HeatmapTheme;
  dateMode: DateMode;
  exerciseTrendMode: ExerciseTrendMode;
}

/**
 * Actions to update preferences.
 * Mirrors the shape of UserPreferences with setter functions.
 */
export interface PreferencesActions {
  setWeightUnit: (unit: WeightUnit) => void;
  setBodyMapGender: (gender: StoredBodyMapGender) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setHeatmapTheme: (theme: HeatmapTheme) => void;
  setDateMode: (mode: DateMode) => void;
  setExerciseTrendMode: (mode: ExerciseTrendMode) => void;
}

/**
 * Get all current preferences from storage.
 * This is a synchronous read - for database migration, this would become async.
 */
export const getAllPreferences = (): UserPreferences => ({
  weightUnit: getWeightUnit(),
  bodyMapGender: getBodyMapGender(),
  themeMode: getThemeMode(),
  heatmapTheme: getHeatmapTheme(),
  dateMode: getDateMode(),
  exerciseTrendMode: getExerciseTrendMode(),
});

/**
 * Hook to access and update user preferences.
 * 
 * Note: This hook returns stable getter functions. For React state integration,
 * components should still manage their own state and use the setters to persist.
 * This design allows for easy database migration while keeping the React
 * reactivity model intact.
 * 
 * Example usage in a component:
 * ```tsx
 * const [dateMode, setDateModeState] = useState<DateMode>(getDateMode());
 * const { setDateMode } = usePreferences();
 * 
 * const handleDateModeChange = (mode: DateMode) => {
 *   setDateModeState(mode);
 *   setDateMode(mode);
 * };
 * ```
 */
export const usePreferences = (): PreferencesActions => {
  const setWeightUnit = useCallback((unit: WeightUnit) => {
    saveWeightUnit(unit);
  }, []);

  const setBodyMapGender = useCallback((gender: StoredBodyMapGender) => {
    saveBodyMapGender(gender);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    saveThemeMode(mode);
  }, []);

  const setHeatmapTheme = useCallback((theme: HeatmapTheme) => {
    saveHeatmapTheme(theme);
  }, []);

  const setDateMode = useCallback((mode: DateMode) => {
    saveDateMode(mode);
  }, []);

  const setExerciseTrendMode = useCallback((mode: ExerciseTrendMode) => {
    saveExerciseTrendMode(mode);
  }, []);

  return useMemo(() => ({
    setWeightUnit,
    setBodyMapGender,
    setThemeMode,
    setHeatmapTheme,
    setDateMode,
    setExerciseTrendMode,
  }), [setWeightUnit, setBodyMapGender, setThemeMode, setHeatmapTheme, setDateMode, setExerciseTrendMode]);
};

/**
 * Compute the effective "now" date based on user preference.
 * 
 * @param dataBasedNow - The date derived from the latest workout data
 * @param dateMode - User's preference for date calculation
 * @returns The appropriate "now" date based on preference
 * 
 * Behavior:
 * - 'effective' mode (default): Uses the latest workout date as "now"
 *   This makes relative time displays more meaningful (e.g., "yesterday" refers to
 *   the day before the last workout, not the actual yesterday)
 * 
 * - 'actual' mode: Uses the real current date as "now"
 *   This shows true relative times but may result in empty recent charts
 *   if data is old (e.g., if last workout was 3 months ago, "last 7 days" is empty)
 */
export const computeEffectiveNow = (
  dataBasedNow: Date,
  dateMode: DateMode
): Date => {
  if (dateMode === 'actual') {
    return new Date();
  }
  // 'effective' mode uses the latest data date
  return dataBasedNow;
};

/**
 * Information about the data age relative to actual current date.
 * Useful for showing warnings or adjusting UI when data is stale.
 */
export interface DataAgeInfo {
  /** Number of days between the latest data and actual current date */
  daysSinceLastData: number;
  /** Whether data is considered "stale" (more than 7 days old) */
  isStale: boolean;
  /** Whether data is considered "old" (more than 30 days old) */
  isOld: boolean;
  /** Whether data is considered "very old" (more than 90 days old) */
  isVeryOld: boolean;
  /** Human-readable description of data age */
  ageDescription: string;
}

/**
 * Calculate information about how old the workout data is.
 * Useful for showing warnings when using "actual date" mode with old data.
 * 
 * @param dataBasedNow - The date of the most recent workout
 * @returns Information about the data age
 */
export const getDataAgeInfo = (dataBasedNow: Date): DataAgeInfo => {
  const actualNow = new Date();
  const diffMs = actualNow.getTime() - dataBasedNow.getTime();
  const daysSinceLastData = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  
  const isStale = daysSinceLastData > 7;
  const isOld = daysSinceLastData > 30;
  const isVeryOld = daysSinceLastData > 90;
  
  let ageDescription: string;
  if (daysSinceLastData === 0) {
    ageDescription = 'Data is from today';
  } else if (daysSinceLastData === 1) {
    ageDescription = 'Data is from yesterday';
  } else if (daysSinceLastData < 7) {
    ageDescription = `Data is ${daysSinceLastData} days old`;
  } else if (daysSinceLastData < 30) {
    const weeks = Math.floor(daysSinceLastData / 7);
    ageDescription = `Data is ${weeks} week${weeks > 1 ? 's' : ''} old`;
  } else if (daysSinceLastData < 365) {
    const months = Math.floor(daysSinceLastData / 30);
    ageDescription = `Data is ${months} month${months > 1 ? 's' : ''} old`;
  } else {
    const years = Math.floor(daysSinceLastData / 365);
    ageDescription = `Data is ${years} year${years > 1 ? 's' : ''} old`;
  }
  
  return {
    daysSinceLastData,
    isStale,
    isOld,
    isVeryOld,
    ageDescription,
  };
};
