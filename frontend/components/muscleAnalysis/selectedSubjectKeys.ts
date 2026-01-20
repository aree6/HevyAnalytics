import {
  getGroupForSvgId,
  getSvgIdsForQuickFilter,
  type QuickFilterCategory,
} from '../../utils/muscle/muscleMappingConstants';

export type MuscleAnalysisViewMode = 'muscle' | 'group';

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

  if (activeQuickFilter) return [...getSvgIdsForQuickFilter(activeQuickFilter)];
  return selectedMuscle ? [selectedMuscle] : [];
};
