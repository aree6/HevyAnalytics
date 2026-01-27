import React from 'react';
import { CHART_TOOLTIP_STYLE, FANCY_FONT } from '../../utils/ui/uiConstants';
import { formatNumber } from '../../utils/format/formatters';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  weightUnit?: string;
  hasUnilateralData?: boolean;
  showUnilateral?: boolean;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, weightUnit, hasUnilateralData, showUnilateral = false }) => {
  if (active && payload && payload.length) {
    const unit = weightUnit || 'kg';
    const oneRM = payload.find((p: any) => p.dataKey === 'oneRepMax')?.value;
    const emaValue = payload.find((p: any) => p.dataKey === 'emaValue')?.value;
    const lifted = payload.find((p: any) => p.dataKey === 'weight')?.value;
    const reps = payload.find((p: any) => p.dataKey === 'reps')?.value;

    // Unilateral data
    const leftOneRM = payload.find((p: any) => p.dataKey === 'leftOneRepMax')?.value;
    const rightOneRM = payload.find((p: any) => p.dataKey === 'rightOneRepMax')?.value;
    const leftReps = payload.find((p: any) => p.dataKey === 'leftReps')?.value;
    const rightReps = payload.find((p: any) => p.dataKey === 'rightReps')?.value;

    const fmt1 = (v: unknown) => formatNumber(typeof v === 'number' ? v : Number(v), { maxDecimals: 1 });
    
    // Determine what to show
    const hasLeftData = typeof leftOneRM === 'number' || typeof leftReps === 'number';
    const hasRightData = typeof rightOneRM === 'number' || typeof rightReps === 'number';
    const showLR = showUnilateral && hasUnilateralData && (hasLeftData || hasRightData);

    return (
      <div
        className="p-3 rounded-lg shadow-2xl"
        style={{
          ...CHART_TOOLTIP_STYLE,
          borderStyle: 'solid',
          borderWidth: 1,
          boxShadow: '0 20px 50px -15px rgb(0 0 0 / 0.35)',
        }}
      >
        <p className="text-slate-400 text-xs mb-2 font-mono">{label}</p>
        <div className="space-y-1">
          {/* Combined view (when not showing L/R) */}
          {!showLR && (
            <>
              {typeof reps === 'number' ? (
                <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Reps: <span style={FANCY_FONT}>{Math.round(reps)}</span>
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    1RM: <span style={FANCY_FONT}>{fmt1(oneRM)} {unit}</span>
                  </p>
                  {typeof lifted === 'number' && (
                    <span className="text-xs text-slate-500">@ {fmt1(lifted)}{unit}</span>
                  )}
                </div>
              )}

              {typeof emaValue === 'number' && (
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-0.5 bg-white/80"></span>
                  EMA:{' '}
                  <span style={FANCY_FONT}>
                    {typeof reps === 'number' ? fmt1(emaValue) : `${fmt1(emaValue)} ${unit}`}
                  </span>
                </p>
              )}
            </>
          )}

          {/* Unilateral L/R view */}
          {showLR && (
            <>
              {/* Left data */}
              {hasLeftData && (
                <p className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  Left: <span style={FANCY_FONT}>
                    {typeof leftReps === 'number' 
                      ? `${Math.round(leftReps)} reps`
                      : `${fmt1(leftOneRM)} ${unit}`}
                  </span>
                </p>
              )}

              {/* Right data */}
              {hasRightData && (
                <p className="text-sm font-bold text-violet-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  Right: <span style={FANCY_FONT}>
                    {typeof rightReps === 'number' 
                      ? `${Math.round(rightReps)} reps`
                      : `${fmt1(rightOneRM)} ${unit}`}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};
