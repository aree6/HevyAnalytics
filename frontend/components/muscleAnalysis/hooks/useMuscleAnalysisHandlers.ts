import React, { useCallback, useMemo, useState } from 'react';
import type { NormalizedMuscleGroup } from '../../../utils/muscle/analytics';
import { SVG_MUSCLE_NAMES } from '../../../utils/muscle/mapping';
import {
  MUSCLE_GROUP_ORDER,
  SVG_TO_MUSCLE_GROUP,
  getSvgIdsForGroup,
  getGroupForSvgId,
  getSvgIdsForQuickFilter,
  getHeadlessIdForDetailedSvgId,
  HEADLESS_MUSCLE_NAMES,
} from '../../../utils/muscle/mapping';
import type { TooltipData } from '../../ui/Tooltip';
import type { WeeklySetsWindow } from '../../../utils/muscle/analytics';
import type { QuickFilterCategory } from './useMuscleSelection';

interface UseMuscleAnalysisHandlersParams {
  viewMode: 'muscle' | 'group' | 'headless';
  selectedMuscle: string | null;
  activeQuickFilter: QuickFilterCategory | null;
  setSelectedMuscle: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveQuickFilter: (value: QuickFilterCategory | null) => void;
  selectedSvgIdForUrlRef: React.MutableRefObject<string | null>;
  clearSelectionUrl: () => void;
  updateSelectionUrl: (payload: { svgId: string; mode: 'muscle' | 'group' | 'headless'; window: WeeklySetsWindow }) => void;
  weeklySetsWindow: WeeklySetsWindow;
  windowedGroupVolumes: Map<NormalizedMuscleGroup, number>;
  headlessRatesMap: Map<string, number>;
  setHoverTooltip: (value: TooltipData | null) => void;
}

export const useMuscleAnalysisHandlers = ({
  viewMode,
  selectedMuscle,
  activeQuickFilter,
  setSelectedMuscle,
  setActiveQuickFilter,
  selectedSvgIdForUrlRef,
  clearSelectionUrl,
  updateSelectionUrl,
  weeklySetsWindow,
  windowedGroupVolumes,
  headlessRatesMap,
  setHoverTooltip,
}: UseMuscleAnalysisHandlersParams) => {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const handleMuscleClick = useCallback((muscleId: string) => {
    setActiveQuickFilter(null);
    if (viewMode === 'group') {
      const group = getGroupForSvgId(muscleId);
      if (group === 'Other') return;
      setSelectedMuscle((prev) => {
        const next = prev === group ? null : group;
        if (!next) {
          selectedSvgIdForUrlRef.current = null;
          clearSelectionUrl();
        } else {
          selectedSvgIdForUrlRef.current = muscleId;
          updateSelectionUrl({ svgId: muscleId, mode: 'group', window: weeklySetsWindow });
        }
        return next;
      });
    } else if (viewMode === 'headless') {
      setSelectedMuscle((prev) => {
        const next = prev === muscleId ? null : muscleId;
        if (!next) {
          selectedSvgIdForUrlRef.current = null;
          clearSelectionUrl();
        } else {
          selectedSvgIdForUrlRef.current = muscleId;
          updateSelectionUrl({ svgId: muscleId, mode: 'headless', window: weeklySetsWindow });
        }
        return next;
      });
    } else {
      setSelectedMuscle((prev) => {
        const next = prev === muscleId ? null : muscleId;
        if (!next) {
          selectedSvgIdForUrlRef.current = null;
          clearSelectionUrl();
        } else {
          selectedSvgIdForUrlRef.current = muscleId;
          updateSelectionUrl({ svgId: muscleId, mode: 'muscle', window: weeklySetsWindow });
        }
        return next;
      });
    }
  }, [viewMode, clearSelectionUrl, updateSelectionUrl, weeklySetsWindow, setSelectedMuscle, setActiveQuickFilter, selectedSvgIdForUrlRef]);

  const handleMuscleHover = useCallback((muscleId: string | null, e?: MouseEvent) => {
    setHoveredMuscle(muscleId);
    if (!muscleId || !e) {
      setHoverTooltip(null);
      return;
    }

    const target = e.target as Element | null;
    const groupEl = target?.closest?.('g[id]') as Element | null;
    const rect = groupEl?.getBoundingClientRect?.() as DOMRect | undefined;
    if (!rect) {
      setHoverTooltip(null);
      return;
    }

    if (viewMode === 'group') {
      const groupName = SVG_TO_MUSCLE_GROUP[muscleId];
      if (!groupName || groupName === 'Other') {
        setHoverTooltip(null);
        return;
      }

      const sets = windowedGroupVolumes.get(groupName as any) || 0;
      setHoverTooltip({
        rect,
        title: groupName,
        body: `${Math.round(sets * 10) / 10} sets`,
        status: sets > 0 ? 'success' : 'default',
      });
      return;
    }

    if (viewMode === 'headless') {
      const rate = headlessRatesMap.get(muscleId) || 0;
      const bodyText = `${rate.toFixed(1)} sets/wk`;

      setHoverTooltip({
        rect,
        title: (HEADLESS_MUSCLE_NAMES as any)[muscleId] ?? muscleId,
        body: bodyText,
        status: rate > 0 ? 'success' : 'default',
      });
      return;
    }

    const sets = headlessRatesMap.get(muscleId) || 0;
    setHoverTooltip({
      rect,
      title: SVG_MUSCLE_NAMES[muscleId] ?? muscleId,
      body: `${sets.toFixed(1)} sets/wk`,
      status: sets > 0 ? 'success' : 'default',
    });
  }, [windowedGroupVolumes, headlessRatesMap, viewMode, setHoverTooltip]);

  const selectedBodyMapIds = useMemo(() => {
    if (activeQuickFilter) {
      if (viewMode === 'headless') {
        const ids = new Set<string>();
        for (const d of getSvgIdsForQuickFilter(activeQuickFilter)) {
          const h = getHeadlessIdForDetailedSvgId(d);
          if (h) ids.add(h);
        }
        return [...ids];
      }
      return [...getSvgIdsForQuickFilter(activeQuickFilter)];
    }
    if (!selectedMuscle) return undefined;
    if (viewMode === 'muscle') return undefined;

    if (viewMode === 'headless') return [selectedMuscle];

    const group = selectedMuscle as NormalizedMuscleGroup;
    if (!MUSCLE_GROUP_ORDER.includes(group)) return undefined;

    return [...getSvgIdsForGroup(group)];
  }, [selectedMuscle, viewMode, activeQuickFilter]);

  const hoveredBodyMapIds = useMemo(() => {
    if (!hoveredMuscle) return undefined;
    if (viewMode === 'muscle') return undefined;

    if (viewMode === 'headless') return [hoveredMuscle];

    const group = getGroupForSvgId(hoveredMuscle);
    if (group === 'Other') return undefined;

    return [...getSvgIdsForGroup(group)];
  }, [hoveredMuscle, viewMode]);

  return {
    hoveredMuscle,
    handleMuscleClick,
    handleMuscleHover,
    selectedBodyMapIds,
    hoveredBodyMapIds,
  };
};
