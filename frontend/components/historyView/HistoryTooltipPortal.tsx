import React from 'react';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { AnalysisResult, StructuredTooltip, TooltipLine } from '../../types';
import { TOOLTIP_THEMES, calculateCenteredTooltipPosition } from '../../utils/ui/uiConstants';

export interface TooltipState {
  rect: DOMRect;
  title: string;
  body: string;
  status: AnalysisResult['status'];
  metrics?: { label: string; value: string }[];
  structured?: StructuredTooltip;
}

const HISTORY_TOOLTIP_WIDTH = 320;

const LINE_COLORS: Record<NonNullable<TooltipLine['color']>, string> = {
  green: 'text-emerald-400',
  red: 'text-rose-400',
  yellow: 'text-orange-400',
  blue: 'text-sky-400',
  gray: 'text-slate-400',
};

const TREND_COLORS = {
  up: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: TrendingUp },
  down: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: TrendingDown },
  same: { bg: 'bg-slate-500/20', text: 'text-slate-300', icon: Target },
};

export const TooltipPortal: React.FC<{ data: TooltipState }> = ({ data }) => {
  const { rect, title, body, status, metrics, structured } = data;
  const positionStyle = calculateCenteredTooltipPosition(rect, HISTORY_TOOLTIP_WIDTH);
  const theme = TOOLTIP_THEMES[status] || TOOLTIP_THEMES.info;

  const renderLine = (line: TooltipLine, idx: number) => (
    <div
      key={idx}
      className={`text-xs leading-relaxed ${line.color ? LINE_COLORS[line.color] : 'text-slate-300'} ${
        line.bold ? 'font-semibold' : ''
      }`}
    >
      {line.text}
    </div>
  );

  return (
    <div className="fixed z-[9999] pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95" style={positionStyle}>
      <div className={`border rounded-xl p-4 ${theme} inline-block w-fit`} style={{ maxWidth: HISTORY_TOOLTIP_WIDTH }}>
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
          <span className="font-bold uppercase text-xs tracking-wider">{title}</span>
          {structured && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${TREND_COLORS[structured.trend.direction].bg}`}>
              {React.createElement(TREND_COLORS[structured.trend.direction].icon, {
                className: `w-3 h-3 ${TREND_COLORS[structured.trend.direction].text}`,
              })}
              <span className={`text-xs font-bold ${TREND_COLORS[structured.trend.direction].text}`}>{structured.trend.value}</span>
            </div>
          )}
        </div>

        {structured ? (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Why</div>
              <div className="space-y-0.5">{structured.why.map(renderLine)}</div>
            </div>

            {structured.improve && structured.improve.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Tips</div>
                <div className="space-y-0.5">{structured.improve.map(renderLine)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm leading-relaxed opacity-90 break-words whitespace-pre-line">{body}</div>
        )}

        {metrics && (
          <div className="mt-3 pt-2 border-t border-white/10 flex gap-4 text-xs font-mono opacity-80">
            {metrics.map((m, i) => (
              <div key={i}>
                <span>{m.label}:</span> <span className="font-bold ml-1">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
