import React from 'react';
import { AnalysisStatus } from '../types';

export interface TooltipData {
  rect: DOMRect;
  title: string;
  body: string;
  footer?: string;
  status: AnalysisStatus | 'default';
  metrics?: Array<{ label: string; value: string }>;
}

interface TooltipProps {
  data: TooltipData;
}

const TOOLTIP_WIDTH = 280;
const GAP = 12;
const FLIP_THRESHOLD = 200;

const STATUS_THEMES: Readonly<Record<TooltipData['status'], string>> = {
  success: 'border-emerald-500/50 bg-emerald-950/95 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  warning: 'border-amber-500/50 bg-amber-950/95 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  danger: 'border-rose-500/50 bg-rose-950/95 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  info: 'border-blue-500/50 bg-slate-900/95 text-slate-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
  default: 'border-slate-700/50 bg-slate-950/95 text-slate-300 shadow-xl',
};

const calculatePosition = (rect: DOMRect): React.CSSProperties => {
  const left = Math.min(
    window.innerWidth - TOOLTIP_WIDTH - 20,
    Math.max(20, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2)
  );
  
  const shouldFlip = rect.top < FLIP_THRESHOLD;
  
  const style: React.CSSProperties = {
    left: `${left}px`,
    width: `${TOOLTIP_WIDTH}px`,
  };

  if (shouldFlip) {
    style.top = `${rect.bottom + GAP}px`;
  } else {
    style.bottom = `${window.innerHeight - rect.top + GAP}px`;
  }

  return style;
};

export const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  const { rect, title, body, footer, status, metrics } = data;
  const theme = STATUS_THEMES[status];
  const positionStyle = calculatePosition(rect);

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
      style={positionStyle}
    >
      <div className={`border rounded-xl backdrop-blur-md p-3 ${theme}`}>
        <div className="flex items-center gap-2 mb-1 pb-1 border-b border-white/10">
          <span className="font-bold uppercase text-[10px] tracking-wider">{title}</span>
        </div>
        <div className="text-xs leading-relaxed opacity-90 whitespace-pre-line">{body}</div>
        {metrics && metrics.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10 flex gap-4 text-xs font-mono opacity-80">
            {metrics.map((m, i) => (
              <div key={i}>
                <span>{m.label}:</span>
                <span className="font-bold ml-1">{m.value}</span>
              </div>
            ))}
          </div>
        )}
        {footer && (
          <div className="mt-2 text-[10px] font-bold text-blue-400">{footer}</div>
        )}
      </div>
    </div>
  );
};

export const useTooltip = () => {
  const [tooltip, setTooltip] = React.useState<TooltipData | null>(null);

  const showTooltip = React.useCallback(
    (e: React.MouseEvent, data: Omit<TooltipData, 'rect'>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ ...data, rect });
    },
    []
  );

  const hideTooltip = React.useCallback(() => {
    setTooltip(null);
  }, []);

  return { tooltip, showTooltip, hideTooltip };
};
