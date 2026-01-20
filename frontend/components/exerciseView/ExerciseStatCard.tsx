import React from 'react';
import { FANCY_FONT } from '../../utils/ui/uiConstants';
import { DeltaBadge } from './ExerciseBadges';

export const StatCard = ({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  deltaSuffix,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  delta?: number;
  deltaSuffix?: string;
}) => (
  <div className="bg-black/70 border border-slate-700/50 p-4 md:p-5 rounded-lg flex items-center justify-between group hover:border-slate-600/50 transition-colors duration-300 h-full">
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl text-white tracking-tight" style={FANCY_FONT}>
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>
      {delta !== undefined && delta !== 0 && (
        <div className="mt-1">
          <DeltaBadge delta={delta} suffix={deltaSuffix} />
        </div>
      )}
    </div>
    <div className="h-9 w-9 rounded-md bg-black/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors flex-shrink-0">
      <Icon size={16} />
    </div>
  </div>
);
