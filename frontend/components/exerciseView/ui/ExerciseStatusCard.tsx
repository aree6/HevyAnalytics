import React from 'react';
import { FANCY_FONT } from '../../../utils/ui/uiConstants';
import type { ExerciseTrendCoreResult } from '../../../utils/analysis/exerciseTrend';
import { ConfidenceBadge } from './ExerciseBadges';
import { renderEvidenceWithColoredSigns, getTrendEvidenceTitle } from './exerciseEvidence';
import type { StatusResult } from '../trend/exerciseTrendUi';
import type { InactiveReason } from '../utils/exerciseViewTypes';

interface ExerciseStatusCardProps {
  currentStatus: StatusResult;
  currentCore: ExerciseTrendCoreResult | null;
  isSelectedEligible: boolean;
  inactiveReason: InactiveReason | null;
  selectedPrematurePrTooltip: string | null;
}

export const ExerciseStatusCard: React.FC<ExerciseStatusCardProps> = ({
  currentStatus,
  currentCore,
  isSelectedEligible,
  inactiveReason,
  selectedPrematurePrTooltip,
}) => {
  if (!isSelectedEligible) {
    return (
      <div
        className="rounded-lg p-3 border border-slate-700/50 relative overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.85)' }}
      >
        <div className="absolute inset-0 bg-slate-700/10 pointer-events-none" />
        <div className="relative z-10">
          <h4 className="text-sm sm:text-base text-slate-300 mb-1" style={FANCY_FONT}>
            Inactive
          </h4>
          <p className="text-slate-300 text-xs sm:text-sm leading-tight">
            {inactiveReason?.parts?.length
              ? inactiveReason.parts.join(' · ')
              : 'This exercise is inactive because it has not been trained recently or there is not enough data to generate meaningful insights.'}
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 bg-slate-600" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg p-2.5 sm:p-3 border ${currentStatus.borderColor} relative overflow-hidden transition-all duration-500`}
      style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.85)' }}
    >
      <div className={`absolute inset-0 ${currentStatus.bgColor} pointer-events-none`} />
      <div className="relative z-10 flex items-start gap-2.5">
        <div className={`p-2 rounded-lg bg-black/40 ${currentStatus.color} flex-shrink-0`}>
          <currentStatus.icon size={20} />
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`text-sm sm:text-base ${currentStatus.color} leading-tight`}
              style={FANCY_FONT}
            >
              {currentStatus.title}
            </h4>

            <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
              <ConfidenceBadge confidence={currentStatus.confidence} />
              {currentCore?.prematurePr ? (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold whitespace-nowrap bg-orange-500/10 text-orange-400 border-orange-500/20"
                  title={selectedPrematurePrTooltip ?? undefined}
                  aria-label="Premature PR"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Premature PR
                </span>
              ) : null}
            </div>
          </div>

          <p className="mt-0.5 text-slate-300 text-xs sm:text-sm leading-snug">
            {currentStatus.description}
          </p>

          {currentStatus.evidence && currentStatus.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              {currentStatus.evidence.slice(0, 2).map((t, i) => {
                const isStrengthLike = /^(Strength|Reps):\s/.test(t);
                const hasPositiveMarker = t.includes('[[GREEN]]');
                const hasNegativeMarker = t.includes('[[RED]]');
                const badgeBgColor = hasPositiveMarker ? 'bg-emerald-500/10' : hasNegativeMarker ? 'bg-rose-500/10' : currentStatus.bgColor;
                const badgeBorderColor = hasPositiveMarker ? 'border-emerald-500/20' : hasNegativeMarker ? 'border-rose-500/20' : currentStatus.borderColor;
                const badgeTextColor = hasPositiveMarker ? 'text-emerald-400' : hasNegativeMarker ? 'text-rose-400' : isStrengthLike ? currentStatus.color : 'text-slate-300';
                return (
                  <span
                    key={i}
                    title={getTrendEvidenceTitle(currentStatus, t)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border max-w-full ${badgeBgColor} ${badgeBorderColor} ${badgeTextColor} ${isStrengthLike ? 'font-bold' : 'font-mono'} text-[10px] whitespace-normal break-words`}
                  >
                    {renderEvidenceWithColoredSigns(t)}
                  </span>
                );
              })}
              {currentCore?.prematurePr ? (
                <span
                  className="sm:hidden inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap bg-orange-500/10 text-orange-400 border-orange-500/20"
                  title={selectedPrematurePrTooltip ?? undefined}
                  aria-label="Premature PR"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Premature PR
                </span>
              ) : null}
            </div>
          )}

          {currentStatus.subtext && (
            <div className="mt-2">
              <div className={`relative inline-flex flex-col w-fit max-w-full rounded-md border px-2 py-1.5 ${currentStatus.borderColor} overflow-hidden`}>
                <div className="absolute inset-0 bg-black/30" />
                <div className={`absolute inset-0 ${currentStatus.bgColor}`} />
                <div className="relative z-10">
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${currentStatus.color}`}>Next</div>
                  <div className="mt-0.5 text-[11px] sm:text-xs font-mono text-slate-200 leading-snug whitespace-normal">
                    {currentStatus.subtext}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
