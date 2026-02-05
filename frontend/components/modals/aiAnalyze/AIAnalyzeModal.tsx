import React from 'react';

import type { DailySummary, ExerciseStats, WorkoutSet } from '../../../types';
import { ThemeMode } from '../../../utils/storage/localStorage';
import { Tooltip, useTooltip } from '../../ui/Tooltip';
import { AiAnalyzeModalView } from './AiAnalyzeModalView';
import { useAiAnalyzeState } from './useAiAnalyzeState';

export interface AIAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullData: WorkoutSet[];
  dailyData: DailySummary[];
  exerciseStats: ExerciseStats[];
  effectiveNow: Date;
  themeMode: ThemeMode;
}

export const AIAnalyzeModal: React.FC<AIAnalyzeModalProps> = ({
  isOpen,
  onClose,
  fullData,
  dailyData,
  exerciseStats,
  effectiveNow,
  themeMode,
}) => {
  const isLightTheme = themeMode === 'light';
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  const {
    months,
    setMonths,
    activeCategory,
    setActiveCategory,
    selectedIds,
    toggleModule,
    visibleModules,
    isReady,
    isGenerating,
    reCopyCopied,
    handleGenerate,
    handleReCopy,
    handleOpenGemini,
  } = useAiAnalyzeState({
    isOpen,
    fullData,
    dailyData,
    exerciseStats,
    effectiveNow,
  });

  if (!isOpen) return null;

  return (
    <>
      <AiAnalyzeModalView
        isLightTheme={isLightTheme}
        onClose={onClose}
        months={months}
        setMonths={setMonths}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        visibleModules={visibleModules}
        selectedIds={selectedIds}
        onToggleModule={toggleModule}
        isReady={isReady}
        isGenerating={isGenerating}
        reCopyCopied={reCopyCopied}
        onGenerate={handleGenerate}
        onReCopy={handleReCopy}
        onOpenGemini={handleOpenGemini}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
      />
      {tooltip && <Tooltip data={tooltip} />}
    </>
  );
};
