import {
  getGroupForSvgId,
  getSvgIdsForQuickFilter,
  type QuickFilterCategory,
  getHeadlessIdForDetailedSvgId,
} from '../../utils/muscle/muscleMappingConstants';

export type MuscleAnalysisViewMode = 'muscle' | 'group' | 'headless';

export const resolveSelectedSubjectKeys = (args: {
  viewMode: MuscleAnalysisViewMode;
  selectedMuscle: string | null;
  activeQuickFilter: QuickFilterCategory | null;
}): string[] => {
  const { viewMode, selectedMuscle, activeQuickFilter } = args;

  if (viewMode === 'group') {
    if (activeQuickFilter) {
      const svgIds = getSvgIdsForQuickFilter(activeQuickFilter);
      const groups = new Set<string>();
      for (const id of svgIds) {
        const g = getGroupForSvgId(id);
        if (g && g !== 'Other') groups.add(g);
      }
      return Array.from(groups);
    }
    return selectedMuscle ? [selectedMuscle] : [];
  }

  if (viewMode === 'headless') {
    if (activeQuickFilter) {
      const svgIds = getSvgIdsForQuickFilter(activeQuickFilter);
      const headless = new Set<string>();
      for (const id of svgIds) {
        const h = getHeadlessIdForDetailedSvgId(id);
        if (h) headless.add(h);
      }
      return Array.from(headless);
    }
    return selectedMuscle ? [selectedMuscle] : [];
  }

  if (activeQuickFilter) return [...getSvgIdsForQuickFilter(activeQuickFilter)];
  return selectedMuscle ? [selectedMuscle] : [];
};
