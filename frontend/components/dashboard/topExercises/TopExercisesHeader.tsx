import React from 'react';
import { AreaChart as AreaChartIcon, ChartBarStacked, Infinity, Zap } from 'lucide-react';
import type { TopExerciseMode, TopExercisesView } from './TopExercisesCard';

interface TopExercisesHeaderProps {
  isMounted: boolean;
  topExerciseMode: TopExerciseMode;
  setTopExerciseMode: (m: TopExerciseMode) => void;
  topExercisesView: TopExercisesView;
  setTopExercisesView: (v: TopExercisesView) => void;
}

export const TopExercisesHeader: React.FC<TopExercisesHeaderProps> = ({
  isMounted,
  topExerciseMode,
  setTopExerciseMode,
  topExercisesView,
  setTopExercisesView,
}) => (
  <div
    className={`flex flex-row justify-between items-center mb-4 gap-3 transition-opacity duration-700 ${
      isMounted ? 'opacity-100' : 'opacity-0'
    }`}
  >
    <h3 className="text-sm sm:text-base sm:text-lg font-semibold text-white flex items-center gap-2">
      <Zap className="w-5 h-5 text-amber-500" />
      Most Frequent Exercises
    </h3>
    <div className="flex items-center justify-end gap-1 flex-wrap sm:flex-nowrap overflow-x-auto sm:overflow-visible max-w-full">
      <div className="bg-black/70 p-0.5 rounded-lg flex gap-0.5 border border-slate-800 transition-all duration-200 hover:border-slate-700 shrink-0">
        <button
          onClick={() => setTopExerciseMode('all')}
          title="All"
          aria-label="All"
          className={`w-6 h-5 flex items-center justify-center rounded transition-all duration-200 ${
            topExerciseMode === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Infinity className="w-3 h-3" />
          <span className="sr-only">All</span>
        </button>
        <button
          onClick={() => setTopExerciseMode('weekly')}
          title="Last Week"
          aria-label="Last Week"
          className={`px-1 h-5 flex items-center justify-center rounded transition-all duration-200 text-[8px] font-bold leading-none whitespace-nowrap ${
            topExerciseMode === 'weekly'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst wk
        </button>
        <button
          onClick={() => setTopExerciseMode('monthly')}
          title="Last Month"
          aria-label="Last Month"
          className={`px-1 h-5 flex items-center justify-center rounded transition-all duration-200 text-[8px] font-bold leading-none whitespace-nowrap ${
            topExerciseMode === 'monthly'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst mo
        </button>
        <button
          onClick={() => setTopExerciseMode('yearly')}
          title="Last Year"
          aria-label="Last Year"
          className={`px-1 h-5 flex items-center justify-center rounded transition-all duration-200 text-[8px] font-bold leading-none whitespace-nowrap ${
            topExerciseMode === 'yearly'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst yr
        </button>
      </div>

      <div className="bg-black/70 p-0.5 rounded-lg flex gap-0.5 border border-slate-800 transition-all duration-200 hover:border-slate-700 shrink-0">
        <button
          onClick={() => setTopExercisesView('barh')}
          title="Bars"
          aria-label="Bars"
          className={`w-6 h-5 flex items-center justify-center rounded transition-all duration-200 ${
            topExercisesView === 'barh'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ChartBarStacked className="w-3 h-3" />
          <span className="sr-only">Bars</span>
        </button>
        <button
          onClick={() => setTopExercisesView('area')}
          title="Area"
          aria-label="Area"
          className={`w-6 h-5 flex items-center justify-center rounded transition-all duration-200 ${
            topExercisesView === 'area'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AreaChartIcon className="w-3 h-3" />
          <span className="sr-only">Area</span>
        </button>
      </div>
    </div>
  </div>
);
