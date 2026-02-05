import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { getVolumeColor, SVG_MUSCLE_GROUPS, CSV_TO_SVG_MUSCLE_MAP } from '../../utils/muscle/mapping';
import { INTERACTIVE_MUSCLE_IDS } from '../../utils/muscle/mapping';
import MaleFrontBodyMapMuscle from './muscles/MaleFrontBodyMapMuscle';
import MaleBackBodyMapMuscle from './muscles/MaleBackBodyMapMuscle';
import MaleFrontBodyMapGroup from './groups/MaleFrontBodyMapGroup';
import MaleBackBodyMapGroup from './groups/MaleBackBodyMapGroup';
import FemaleFrontBodyMapMuscle from './muscles/FemaleFrontBodyMapMuscle';
import FemaleBackBodyMapMuscle from './muscles/FemaleBackBodyMapMuscle';
import FemaleFrontBodyMapGroup from './groups/FemaleFrontBodyMapGroup';
import FemaleBackBodyMapGroup from './groups/FemaleBackBodyMapGroup';

export type BodyMapGender = 'male' | 'female';
export type BodyMapViewMode = 'muscle' | 'group' | 'headless';

interface BodyMapProps {
  onPartClick: (muscleGroup: string) => void;
  selectedPart: string | null;
  selectedMuscleIdsOverride?: string[];
  hoveredMuscleIdsOverride?: string[];
  muscleVolumes: Map<string, number>;
  maxVolume?: number;
  onPartHover?: (muscleGroup: string | null, e?: MouseEvent) => void;
  compact?: boolean;
  compactFill?: boolean;
  interactive?: boolean;
  gender?: BodyMapGender;
  viewMode?: BodyMapViewMode;
}

// Hover and selection highlight colors (theme-driven)
const HOVER_HIGHLIGHT = 'rgb(var(--bodymap-hover-rgb) / 1)';
const SELECTION_HIGHLIGHT = 'rgb(var(--bodymap-selection-rgb) / 1)';

const INTERACTIVE_MUSCLES: readonly string[] = INTERACTIVE_MUSCLE_IDS;

const getRelatedMuscleIds = (muscleGroup: string | null): string[] => {
  if (!muscleGroup) return [];
  const groupName = SVG_MUSCLE_GROUPS[muscleGroup];
  if (!groupName) return [muscleGroup];
  const relatedIds: string[] = [];
  for (const [csvMuscle, svgIds] of Object.entries(CSV_TO_SVG_MUSCLE_MAP)) {
    if (csvMuscle === groupName) relatedIds.push(...svgIds);
  }
  return relatedIds.length > 0 ? relatedIds : [muscleGroup];
};

export const BodyMap: React.FC<BodyMapProps> = ({
  onPartClick,
  selectedPart,
  selectedMuscleIdsOverride,
  hoveredMuscleIdsOverride,
  muscleVolumes,
  maxVolume = 1,
  onPartHover,
  compact = false,
  compactFill = false,
  interactive = false,
  gender = 'male',
  viewMode = 'muscle',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredMuscleRef = useRef<string | null>(null);
  const selectedMuscleIds = useMemo(
    () => selectedMuscleIdsOverride ?? getRelatedMuscleIds(selectedPart),
    [selectedMuscleIdsOverride, selectedPart]
  );

  const applyColors = useCallback((hoveredId: string | null = null) => {
    if (!containerRef.current) return;
    INTERACTIVE_MUSCLES.forEach(muscleId => {
      const elements = containerRef.current?.querySelectorAll(`#${muscleId}`);
      elements?.forEach(el => {
        const volume = muscleVolumes.get(muscleId) || 0;
        const color = getVolumeColor(volume, maxVolume);
        const isSelected = selectedMuscleIds.includes(muscleId);
        const isHovered = hoveredMuscleIdsOverride
          ? hoveredMuscleIdsOverride.includes(muscleId)
          : (hoveredId === muscleId || (hoveredId && getRelatedMuscleIds(hoveredId).includes(muscleId)));
        
        el.querySelectorAll('path').forEach(path => {
          path.style.transition = 'all 0.15s ease';
          const baseStrokeWidth = compact ? 0.6 : 1;
          path.style.stroke = 'rgb(var(--outline-rgb) / 1)';
          path.style.strokeWidth = String(baseStrokeWidth);
          path.style.strokeOpacity = compact ? '0.55' : '0.7';
          
          if (isSelected) {
            // Selected state - should be clearly distinguishable from hover.
            path.style.fill = SELECTION_HIGHLIGHT;
            path.style.stroke = SELECTION_HIGHLIGHT;
            path.style.strokeWidth = String(baseStrokeWidth + (compact ? 0.35 : 0.8));
            path.style.strokeOpacity = '1';
            path.style.filter = 'brightness(1.12)';
          } else if (isHovered) {
            // Hover state - uses a distinct (non-palette) hover color.
            path.style.fill = HOVER_HIGHLIGHT;
            path.style.stroke = HOVER_HIGHLIGHT;
            path.style.strokeWidth = String(baseStrokeWidth + (compact ? 0.2 : 0.45));
            path.style.strokeOpacity = compact ? '0.9' : '0.95';
            path.style.filter = 'brightness(1.08)';
          } else {
            // Default state - volume-based color
            path.style.fill = color;
            path.style.filter = '';
          }
        });
        (el as HTMLElement).style.cursor = compact && !interactive ? 'default' : 'pointer';
      });
    });
  }, [muscleVolumes, maxVolume, selectedMuscleIds, hoveredMuscleIdsOverride, interactive]);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as Element;
    const muscleGroup = target.closest('g[id]');
    if (muscleGroup && INTERACTIVE_MUSCLES.includes(muscleGroup.id)) {
      onPartClick(muscleGroup.id);
    }
  }, [onPartClick]);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as Element;
    const muscleGroup = target.closest('g[id]');
    if (muscleGroup && INTERACTIVE_MUSCLES.includes(muscleGroup.id)) {
      const hoveredId = muscleGroup.id;
      hoveredMuscleRef.current = hoveredId;
      // If hover ids are controlled externally (e.g. group view), let parent drive highlighting.
      if (!hoveredMuscleIdsOverride) {
        applyColors(hoveredId);
      }
      onPartHover?.(hoveredId, e);
    }
  }, [onPartHover, applyColors, hoveredMuscleIdsOverride]);

  const handleMouseOut = useCallback((e: MouseEvent) => {
    hoveredMuscleRef.current = null;
    if (!hoveredMuscleIdsOverride) {
      applyColors(null);
    }
    onPartHover?.(null, e);
  }, [onPartHover, applyColors, hoveredMuscleIdsOverride]);

  useEffect(() => {
    applyColors(hoveredMuscleRef.current);
    const container = containerRef.current;
    if (!container) return;
    // Skip event listeners for compact (mini) body maps - no interaction
    if (compact && !interactive) return;
    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [applyColors, handleClick, handleMouseOver, handleMouseOut, compact, interactive]);

  const svgClass = compact ? (compactFill ? 'h-full w-auto' : 'h-28 w-auto') : 'h-[60vh] md:h-[70vh] w-auto -mb-10 -mt-5 sm:-mb-3';

  const FrontSvg = gender === 'female' 
    ? (viewMode === 'group' || viewMode === 'headless' ? FemaleFrontBodyMapGroup : FemaleFrontBodyMapMuscle)
    : (viewMode === 'group' || viewMode === 'headless' ? MaleFrontBodyMapGroup : MaleFrontBodyMapMuscle);
  
  const BackSvg = gender === 'female'
    ? (viewMode === 'group' || viewMode === 'headless' ? FemaleBackBodyMapGroup : FemaleBackBodyMapMuscle)
    : (viewMode === 'group' || viewMode === 'headless' ? MaleBackBodyMapGroup : MaleBackBodyMapMuscle);

  return (
    <div 
      ref={containerRef}
      className={`flex justify-center items-center ${compact ? 'gap-0' : 'gap-4'} w-full ${compactFill ? 'h-full' : ''}`}
    >
      <FrontSvg className={svgClass} />
      <BackSvg className={svgClass} />
    </div>
  );
};
