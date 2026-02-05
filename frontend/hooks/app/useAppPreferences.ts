import { useState, useEffect, useLayoutEffect } from 'react';
import { useTheme } from '../../components/theme/ThemeProvider';
import { setContext, trackEvent } from '../../utils/integrations/analytics';
import {
  WeightUnit,
  getWeightUnit,
  saveWeightUnit,
  StoredBodyMapGender,
  getBodyMapGender,
  saveBodyMapGender,
  DateMode,
  getDateMode,
  saveDateMode,
  ExerciseTrendMode,
  getExerciseTrendMode,
  saveExerciseTrendMode,
  HeatmapTheme,
  getHeatmapTheme,
  saveHeatmapTheme,
} from '../../utils/storage/localStorage';
import { BodyMapGender } from '../../components/bodyMap/BodyMap';

export interface UseAppPreferencesReturn {
  // Theme
  mode: string;
  setMode: (mode: string) => void;
  
  // Weight unit
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  
  // Body map gender
  bodyMapGender: BodyMapGender;
  setBodyMapGender: (gender: BodyMapGender) => void;
  
  // Date mode
  dateMode: DateMode;
  setDateMode: (mode: DateMode) => void;
  
  // Exercise trend mode
  exerciseTrendMode: ExerciseTrendMode;
  setExerciseTrendMode: (mode: ExerciseTrendMode) => void;
  
  // Heatmap theme
  heatmapTheme: HeatmapTheme;
  setHeatmapTheme: (theme: HeatmapTheme) => void;
}

export function useAppPreferences(): UseAppPreferencesReturn {
  const { mode, setMode } = useTheme();
  
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() => getWeightUnit());
  const [bodyMapGender, setBodyMapGenderState] = useState<BodyMapGender>(() => getBodyMapGender());
  const [dateMode, setDateModeState] = useState<DateMode>(() => getDateMode());
  const [exerciseTrendMode, setExerciseTrendModeState] = useState<ExerciseTrendMode>(() => getExerciseTrendMode());
  const [heatmapTheme, setHeatmapThemeState] = useState<HeatmapTheme>(() => getHeatmapTheme());

  // Persist weight unit
  useEffect(() => {
    saveWeightUnit(weightUnit);
    setContext({ weight_unit: weightUnit });
  }, [weightUnit]);

  // Persist body map gender
  useEffect(() => {
    saveBodyMapGender(bodyMapGender as StoredBodyMapGender);
    setContext({ body_map_gender: bodyMapGender });
  }, [bodyMapGender]);

  // Persist date mode
  useEffect(() => {
    saveDateMode(dateMode);
  }, [dateMode]);

  // Persist exercise trend mode
  useEffect(() => {
    saveExerciseTrendMode(exerciseTrendMode);
  }, [exerciseTrendMode]);

  // Persist heatmap theme
  useEffect(() => {
    saveHeatmapTheme(heatmapTheme);
    setContext({ heatmap_theme: heatmapTheme });
    trackEvent('heatmap_theme_change', { heatmap_theme: heatmapTheme });
  }, [heatmapTheme]);

  // Apply heatmap CSS variables
  useLayoutEffect(() => {
    const root = document.documentElement;

    const preset =
      heatmapTheme === 'blue'
        ? { hue: 215, hoverRgb: '220 38 38', selectionRgb: '220 38 38' }
        : heatmapTheme === 'brown'
          ? { hue: 25, hoverRgb: '59 130 246', selectionRgb: '59 130 246' }
          : { hue: 5, hoverRgb: '59 130 246', selectionRgb: '59 130 246' };

    root.style.setProperty('--heatmap-hue', String(preset.hue));
    root.style.setProperty('--bodymap-hover-rgb', preset.hoverRgb);
    root.style.setProperty('--bodymap-selection-rgb', preset.selectionRgb);
  }, [heatmapTheme]);

  return {
    mode,
    setMode,
    weightUnit,
    setWeightUnit: setWeightUnitState,
    bodyMapGender,
    setBodyMapGender: setBodyMapGenderState,
    dateMode,
    setDateMode: setDateModeState,
    exerciseTrendMode,
    setExerciseTrendMode: setExerciseTrendModeState,
    heatmapTheme,
    setHeatmapTheme: setHeatmapThemeState,
  };
}
