import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { getVolumeColor, SVG_MUSCLE_GROUPS, CSV_TO_SVG_MUSCLE_MAP } from '../utils/muscleMapping';
import FrontBodySvg from './FrontBodyMap';
import BackBodySvg from './BackBodyMap';

interface BodyMapProps {
  onPartClick: (muscleGroup: string) => void;
  selectedPart: string | null;
  selectedMuscleIdsOverride?: string[];
  hoveredMuscleIdsOverride?: string[];
  muscleVolumes: Map<string, number>;
  maxVolume?: number;
  onPartHover?: (muscleGroup: string | null) => void;
  compact?: boolean;
}

// Hover and selection highlight colors (bright blue theme)
const HOVER_HIGHLIGHT = 'rgba(14, 90, 182, 1)'; 
const SELECTION_HIGHLIGHT = 'rgba(37, 99, 235, 1)'; 

const INTERACTIVE_MUSCLES = [
  'upper-trapezius', 'gastrocnemius', 'tibialis', 'soleus',
  'outer-quadricep', 'rectus-femoris', 'inner-quadricep', 'inner-thigh',
  'wrist-extensors', 'wrist-flexors', 'long-head-bicep', 'short-head-bicep',
  'obliques', 'lower-abdominals', 'upper-abdominals',
  'mid-lower-pectoralis', 'upper-pectoralis',
  'anterior-deltoid', 'lateral-deltoid',
  'medial-hamstrings', 'lateral-hamstrings',
  'gluteus-maximus', 'gluteus-medius',
  'lowerback', 'lats',
  'medial-head-triceps', 'long-head-triceps', 'lateral-head-triceps',
  'posterior-deltoid', 'lower-trapezius', 'traps-middle',
];

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
          
          if (isSelected) {
            // Selected state - blend cyan highlight with volume color
            path.style.fill = SELECTION_HIGHLIGHT;
            path.style.filter = 'brightness(1.2)';
          } else if (isHovered) {
            // Hover state - light cyan highlight blend
            path.style.fill = HOVER_HIGHLIGHT;
            path.style.filter = 'brightness(1.1)';
          } else {
            // Default state - volume-based color
            path.style.fill = color;
            path.style.filter = '';
          }
        });
        (el as HTMLElement).style.cursor = compact ? 'default' : 'pointer';
      });
    });
  }, [muscleVolumes, maxVolume, selectedMuscleIds, hoveredMuscleIdsOverride]);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as Element;
    const muscleGroup = target.closest('g[id]');
    if (muscleGroup && INTERACTIVE_MUSCLES.includes(muscleGroup.id)) {
      const groupName = SVG_MUSCLE_GROUPS[muscleGroup.id] || muscleGroup.id;
      const svgIds = CSV_TO_SVG_MUSCLE_MAP[groupName];
      onPartClick(svgIds?.[0] || muscleGroup.id);
    }
  }, [onPartClick]);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as Element;
    const muscleGroup = target.closest('g[id]');
    if (muscleGroup && INTERACTIVE_MUSCLES.includes(muscleGroup.id)) {
      const svgIds = CSV_TO_SVG_MUSCLE_MAP[SVG_MUSCLE_GROUPS[muscleGroup.id] || muscleGroup.id];
      const hoveredId = svgIds?.[0] || muscleGroup.id;
      hoveredMuscleRef.current = hoveredId;
      // If hover ids are controlled externally (e.g. group view), let parent drive highlighting.
      if (!hoveredMuscleIdsOverride) {
        applyColors(hoveredId);
      }
      onPartHover?.(hoveredId);
    }
  }, [onPartHover, applyColors, hoveredMuscleIdsOverride]);

  const handleMouseOut = useCallback(() => {
    hoveredMuscleRef.current = null;
    if (!hoveredMuscleIdsOverride) {
      applyColors(null);
    }
    onPartHover?.(null);
  }, [onPartHover, applyColors, hoveredMuscleIdsOverride]);

  useEffect(() => {
    applyColors(hoveredMuscleRef.current);
    const container = containerRef.current;
    if (!container) return;
    // Skip event listeners for compact (mini) body maps - no interaction
    if (compact) return;
    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [applyColors, handleClick, handleMouseOver, handleMouseOut, compact]);

  const svgClass = compact ? 'h-28 w-auto' : 'h-[60vh] md:h-[70vh] w-auto';

  return (
    <div ref={containerRef} className={`flex justify-center items-center ${compact ? 'gap-0' : 'gap-4'} w-full`}>
      <FrontBodySvg className={svgClass} />
      <BackBodySvg className={svgClass} />
    </div>
  );
};
