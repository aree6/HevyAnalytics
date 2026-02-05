import React, { useMemo } from 'react';
import { ExerciseTrendStatus } from '../../../utils/analysis/exerciseTrend';
import type { UseExerciseFiltersReturn } from '../hooks/useExerciseFilters';

interface ExerciseViewHeaderProps {
  filtersSlot?: React.ReactNode;
  stickyHeader?: boolean;
  trainingStructure: UseExerciseFiltersReturn['trainingStructure'];
  trendFilter: ExerciseTrendStatus | null;
  setTrendFilter: (filter: ExerciseTrendStatus | null) => void;
}

export const ExerciseViewHeader: React.FC<ExerciseViewHeaderProps> = ({
  filtersSlot,
  stickyHeader = false,
  trainingStructure,
  trendFilter,
  setTrendFilter,
}) => {
  const headerCenterSlot = useMemo(() => {
    if (trainingStructure.activeCount <= 0) return filtersSlot;

    const isSelected = (s: ExerciseTrendStatus) => trendFilter === s;
    const chipCls = (s: ExerciseTrendStatus, tone: 'good' | 'warn' | 'bad' | 'info') => {
      const base = 'text-[9px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap transition-all duration-200';
      const selected = isSelected(s);

      if (selected) {
        if (tone === 'good') return `${base} bg-emerald-500/20 text-emerald-200 border-emerald-400/60 ring-2 ring-emerald-500/25`;
        if (tone === 'warn') return `${base} bg-amber-500/20 text-amber-200 border-amber-400/60 ring-2 ring-amber-500/25`;
        if (tone === 'bad') return `${base} bg-rose-500/20 text-rose-200 border-rose-400/60 ring-2 ring-rose-500/25`;
        return `${base} bg-blue-500/20 text-blue-200 border-blue-400/60 ring-2 ring-blue-500/25`;
      }

      if (tone === 'good') return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:border-emerald-400/45`;
      if (tone === 'warn') return `${base} bg-amber-500/10 text-amber-300 border-amber-500/25 hover:border-amber-400/45`;
      if (tone === 'bad') return `${base} bg-rose-500/10 text-rose-300 border-rose-500/25 hover:border-rose-400/45`;
      return `${base} bg-blue-500/10 text-blue-300 border-blue-500/25 hover:border-blue-400/45`;
    };

    const toggle = (s: ExerciseTrendStatus) => {
      setTrendFilter(trendFilter === s ? null : s);
    };

    return (
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 justify-start min-w-0">
          <span className="text-xs text-slate-200 font-semibold whitespace-nowrap">
            {trainingStructure.activeCount} active exercises
          </span>
          <button type="button" onClick={() => toggle('overload')} className={chipCls('overload', 'good')}>
            {trainingStructure.overloadCount} Gaining
          </button>
          <button type="button" onClick={() => toggle('stagnant')} className={chipCls('stagnant', 'warn')}>
            {trainingStructure.plateauCount} Plateauing
          </button>
          <button type="button" onClick={() => toggle('regression')} className={chipCls('regression', 'bad')}>
            {trainingStructure.regressionCount} Losing
          </button>
        </div>

        <div className="justify-self-center">{filtersSlot}</div>
      </div>
    );
  }, [filtersSlot, trainingStructure.activeCount, trainingStructure.overloadCount, trainingStructure.plateauCount, trainingStructure.regressionCount, trendFilter, setTrendFilter]);

  return (
    <>
      <div className="sm:hidden">
        <div className="bg-black/70 p-2 rounded-xl">
          {trainingStructure.activeCount > 0 ? (
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => setTrendFilter(null)}
                className={`w-full text-center text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === null ? 'bg-slate-500/20 text-slate-200 border-slate-400/60 ring-2 ring-slate-500/25' : 'bg-slate-500/10 text-slate-300 border-slate-500/25 hover:border-slate-400/45'}`}
              >
                {trainingStructure.activeCount} active
              </button>
              <button
                type="button"
                onClick={() => setTrendFilter(trendFilter === 'overload' ? null : 'overload')}
                className={`w-full text-center text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'overload' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60 ring-2 ring-emerald-500/25' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:border-emerald-400/45'}`}
              >
                {trainingStructure.overloadCount} Gaining
              </button>
              <button
                type="button"
                onClick={() => setTrendFilter(trendFilter === 'stagnant' ? null : 'stagnant')}
                className={`w-full text-center text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'stagnant' ? 'bg-amber-500/20 text-amber-200 border-amber-400/60 ring-2 ring-amber-500/25' : 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:border-amber-400/45'}`}
              >
                {trainingStructure.plateauCount} Plateauing
              </button>
              <button
                type="button"
                onClick={() => setTrendFilter(trendFilter === 'regression' ? null : 'regression')}
                className={`w-full text-center text-[9px] px-2 py-1 rounded font-bold border whitespace-nowrap transition-all duration-200 ${trendFilter === 'regression' ? 'bg-rose-500/20 text-rose-200 border-rose-400/60 ring-2 ring-rose-500/25' : 'bg-rose-500/10 text-rose-300 border-rose-500/25 hover:border-rose-400/45'}`}
              >
                {trainingStructure.regressionCount} Losing
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden sm:contents">
        <div className={`${stickyHeader ? 'sticky top-0 z-30' : ''} bg-black/70 p-2 sm:p-3 rounded-xl`}>
          {headerCenterSlot}
        </div>
      </div>
    </>
  );
};
