import React from 'react';
import { Brain } from 'lucide-react';
import type { DailySummary, ExerciseStats, WorkoutSet } from '../../../types';
import { Reveal } from '../../ui/Reveal';
import { Tooltip, useTooltip } from '../../ui/Tooltip';
import { AiAnalyzeFooter } from '../../modals/aiAnalyze/AiAnalyzeFooter';
import { AiAnalyzeModuleGrid } from '../../modals/aiAnalyze/AiAnalyzeModuleGrid';
import { AiAnalyzeTimeframePicker } from '../../modals/aiAnalyze/AiAnalyzeTimeframePicker';
import { useAiAnalyzeState } from '../../modals/aiAnalyze/useAiAnalyzeState';

interface DashboardAIAnalysisCardProps {
  fullData: WorkoutSet[];
  dailyData: DailySummary[];
  exerciseStats: ExerciseStats[];
  effectiveNow: Date;
}

export const DashboardAIAnalysisCard: React.FC<DashboardAIAnalysisCardProps> = ({
  fullData,
  dailyData,
  exerciseStats,
  effectiveNow,
}) => {
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  const {
    months,
    setMonths,
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
    isOpen: true,
    fullData,
    dailyData,
    exerciseStats,
    effectiveNow,
  });

  return (
    <Reveal className="bg-black/20 border border-slate-700/50 rounded-xl p-4 sm:p-5 space-y-4" style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.5)' }}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300">
          <Brain className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Analysis</h3>
          <p className="text-[11px] sm:text-xs text-slate-500">Generate analysis prompts directly from your dashboard</p>
        </div>
      </div>

      <AiAnalyzeTimeframePicker months={months} setMonths={setMonths} />

      <div className="space-y-2">
        <AiAnalyzeModuleGrid
          visibleModules={visibleModules}
          selectedIds={selectedIds}
          onToggleModule={toggleModule}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
      </div>

      <AiAnalyzeFooter
        isReady={isReady}
        isGenerating={isGenerating}
        reCopyCopied={reCopyCopied}
        rawOnly={selectedIds.length === 0}
        onGenerate={handleGenerate}
        onOpenGemini={handleOpenGemini}
        onReCopy={handleReCopy}
      />

      {tooltip && <Tooltip data={tooltip} />}
    </Reveal>
  );
};
