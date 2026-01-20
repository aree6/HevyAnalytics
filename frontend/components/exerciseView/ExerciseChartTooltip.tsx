import React from 'react';
import { CHART_TOOLTIP_STYLE, FANCY_FONT } from '../../utils/ui/uiConstants';
import { formatNumber } from '../../utils/format/formatters';

export const CustomTooltip = ({ active, payload, label, weightUnit }: any) => {
  if (active && payload && payload.length) {
    const unit = weightUnit || 'kg';
    const oneRM = payload.find((p: any) => p.dataKey === 'oneRepMax')?.value;
    const emaValue = payload.find((p: any) => p.dataKey === 'emaValue')?.value;
    const lifted = payload.find((p: any) => p.dataKey === 'weight')?.value;
    const reps = payload.find((p: any) => p.dataKey === 'reps')?.value;
    const sets = payload.find((p: any) => p.dataKey === 'sets')?.value;

    const fmt1 = (v: unknown) => formatNumber(typeof v === 'number' ? v : Number(v), { maxDecimals: 1 });
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
          {typeof reps === 'number' ? (
            <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Reps: <span style={FANCY_FONT}>{Math.round(reps)}</span>
            </p>
          ) : (
            <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              1RM: <span style={FANCY_FONT}>{fmt1(oneRM)} {unit}</span>
            </p>
          )}

          {typeof emaValue === 'number' ? (
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-0.5 bg-white/80"></span>
              EMA:{' '}
              <span style={FANCY_FONT}>
                {typeof reps === 'number' ? fmt1(emaValue) : `${fmt1(emaValue)} ${unit}`}
              </span>
            </p>
          ) : null}
          {typeof sets === 'number' ? (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              Sets: {Math.round(sets)}
            </p>
          ) : typeof lifted === 'number' ? (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              Lifted: {fmt1(lifted)} {unit}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
  return null;
};
