import React, { useState } from 'react';
import { Sparkles, Flame, TrendingUp, TrendingDown, AlertTriangle, Trophy, Activity, Target, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Reveal } from '../../ui/Reveal';
import type { DashboardSummaryResult, SummarySegment } from '../../../utils/analysis/dashboardSummary/dashboardSummary';

interface DashboardSummaryCardProps {
  summary: DashboardSummaryResult;
  onExerciseClick?: (exerciseName: string) => void;
  onDayClick?: (date: Date) => void;
  onStrengthBalanceDetails?: () => void;
}

const InlineIcon: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const lowerText = text.toLowerCase();
  
  // Only show icon at start of sentence (index 0 or after a period)
  if (index > 0) return null;
  
  // Check for various patterns and return appropriate icon
  if (lowerText.includes('crushing it') || lowerText.includes('heating up') || (lowerText.includes('trending strong') && lowerText.includes('up'))) {
    return <Flame className="w-3.5 h-3.5 inline-block text-orange-400 ml-1 -mt-0.5" />;
  }
  if (lowerText.includes('pr momentum') || lowerText.includes('pr set')) {
    return <Trophy className="w-3.5 h-3.5 inline-block text-yellow-400 ml-1 -mt-0.5" />;
  }
  if (lowerText.includes('trending up') || lowerText.includes('up from last week') || lowerText.includes('climbing')) {
    return <TrendingUp className="w-3.5 h-3.5 inline-block text-emerald-400 ml-1 -mt-0.5" />;
  }
  if (lowerText.includes('cooling') || lowerText.includes('down significantly') || lowerText.includes('dipped')) {
    return <TrendingDown className="w-3.5 h-3.5 inline-block text-rose-400 ml-1 -mt-0.5" />;
  }
  if (lowerText.includes('needs attention') || lowerText.includes('stuck for')) {
    return <AlertTriangle className="w-3.5 h-3.5 inline-block text-amber-400 ml-1 -mt-0.5" />;
  }
  if (lowerText.includes('streak') || lowerText.includes('consistency')) {
    return <Target className="w-3.5 h-3.5 inline-block text-blue-400 ml-1 -mt-0.5" />;
  }
  if (lowerText.includes('momentum')) {
    return <Activity className="w-3.5 h-3.5 inline-block text-purple-400 ml-1 -mt-0.5" />;
  }
  
  return null;
};

const SegmentRenderer: React.FC<{
  segments: SummarySegment[];
  onExerciseClick?: (exerciseName: string) => void;
  onDayClick?: (date: Date) => void;
}> = ({ segments, onExerciseClick, onDayClick }) => {
  // Combine segments into sentences to detect icons
  const sentences: { text: string; startIndex: number; endIndex: number }[] = [];
  let currentSentence = '';
  let startIdx = 0;
  
  segments.forEach((seg, i) => {
    currentSentence += seg.text;
    if (seg.text.includes('.') || seg.text.includes('!') || i === segments.length - 1) {
      sentences.push({ text: currentSentence, startIndex: startIdx, endIndex: i });
      currentSentence = '';
      startIdx = i + 1;
    }
  });
  
  let sentenceIdx = 0;
  let currentSentenceEnd = sentences.length > 0 ? sentences[0].endIndex : -1;
  
  return (
    <>
      {segments.map((seg, i) => {
        // Check if we're starting a new sentence
        if (i > currentSentenceEnd && sentenceIdx < sentences.length - 1) {
          sentenceIdx++;
          currentSentenceEnd = sentences[sentenceIdx].endIndex;
        }
        
        const isSentenceStart = i === 0 || i === sentences[sentenceIdx]?.startIndex;
        
        if (seg.type === 'exercise') {
          return (
            <span
              key={i}
              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (seg.exerciseName) onExerciseClick?.(seg.exerciseName);
              }}
            >
              {isSentenceStart && <InlineIcon text={sentences[sentenceIdx]?.text || ''} index={0} />}
              {seg.text}
            </span>
          );
        }
        if (seg.type === 'date') {
          return (
            <span
              key={i}
              className="text-amber-400 hover:text-amber-300 hover:underline cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (seg.date) onDayClick?.(seg.date);
              }}
            >
              {isSentenceStart && <InlineIcon text={sentences[sentenceIdx]?.text || ''} index={0} />}
              {seg.text}
            </span>
          );
        }
        return (
          <span key={i}>
            {isSentenceStart && <InlineIcon text={sentences[sentenceIdx]?.text || ''} index={0} />}
            {seg.text}
          </span>
        );
      })}
    </>
  );
};

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  summary,
  onExerciseClick,
  onDayClick,
  onStrengthBalanceDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasStrengthBalance = (summary.strengthBalanceItems?.length ?? 0) > 0;

  if (!summary.text) return null;

  const hasSegments = summary.segments && summary.segments.length > 0;
  
  // Text that can't fit on a single mobile line gets a "more" toggle.
  const isLongText = summary.text.length > 70;

  return (
    <Reveal
      className="bg-black/20 border border-slate-700/50 rounded-xl p-4 relative"
      onClick={() => !isExpanded && isLongText && setIsExpanded(true)}
    >
      <div className="relative flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Overview</div>
          <p className={`text-sm sm:text-[15px] leading-normal text-slate-200 ${!isExpanded && isLongText ? 'line-clamp-1' : ''}`}>
            {hasSegments ? (
              <SegmentRenderer
                segments={summary.segments}
                onExerciseClick={onExerciseClick}
                onDayClick={onDayClick}
              />
            ) : (
              summary.text
            )}
          </p>

          {/* Expand/collapse control */}
          {isLongText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>less</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>more</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}

          {hasStrengthBalance ? (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold text-red-400">
                Strength imbalance detected
                {summary.strengthBalanceItems && summary.strengthBalanceItems.length > 1
                  ? ` · ${summary.strengthBalanceItems.length} findings`
                  : ''}
              </span>
              {summary.strengthBalanceTldr ? (
                <span className="hidden sm:inline text-[11px] sm:text-xs text-slate-400">{summary.strengthBalanceTldr}</span>
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStrengthBalanceDetails?.();
                }}
                className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                See details
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
};
