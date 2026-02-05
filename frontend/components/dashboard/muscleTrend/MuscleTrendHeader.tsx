import React from 'react';
import { AreaChart as AreaChartIcon, ChartColumnStacked, Infinity } from 'lucide-react';
import { MuscleTrendBodyIcon, MuscleTrendIcon } from './MuscleTrendIcons';

type MuscleGrouping = 'groups' | 'muscles';
type MusclePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
type MuscleTrendView = 'area' | 'stackedBar';

interface MuscleTrendHeaderProps {
  muscleGrouping: MuscleGrouping;
  setMuscleGrouping: (v: MuscleGrouping) => void;
  musclePeriod: MusclePeriod;
  setMusclePeriod: (v: MusclePeriod) => void;
  muscleTrendView: MuscleTrendView;
  setMuscleTrendView: (v: MuscleTrendView) => void;
}

export const MuscleTrendHeader: React.FC<MuscleTrendHeaderProps> = ({
  muscleGrouping,
  setMuscleGrouping,
  musclePeriod,
  setMusclePeriod,
  muscleTrendView,
  setMuscleTrendView,
}) => (
  <div className="flex flex-row justify-between items-center gap-2 mb-4">
    <h3 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2">
      <MuscleTrendIcon className="w-5 h-5 text-emerald-500" />
      <span>Muscle Analysis</span>
    </h3>

    <div className="flex items-center justify-end gap-1 flex-wrap sm:flex-nowrap overflow-x-auto w-full sm:w-auto sm:overflow-visible">
      <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-800 shrink-0">
        <button
          onClick={() => setMuscleGrouping('groups')}
          title="Groups"
          aria-label="Groups"
          className={`w-5 h-5 flex items-center justify-center rounded ${
            muscleGrouping === 'groups'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MuscleTrendBodyIcon className="w-3.5 h-3.5" />
          <span className="sr-only">Groups</span>
        </button>
        <button
          onClick={() => setMuscleGrouping('muscles')}
          title="Muscles"
          aria-label="Muscles"
          className={`w-5 h-5 flex items-center justify-center rounded ${
            muscleGrouping === 'muscles'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MuscleTrendIcon className="w-3.5 h-3.5" />
          <span className="sr-only">Muscles</span>
        </button>
      </div>

      <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-800 shrink-0">
        <button
          onClick={() => setMusclePeriod('all')}
          title="All"
          aria-label="All"
          className={`w-5 h-5 flex items-center justify-center rounded ${
            musclePeriod === 'all'
              ? 'bg-purple-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Infinity className="w-3 h-3" />
          <span className="sr-only">All</span>
        </button>
        <button
          onClick={() => setMusclePeriod('weekly')}
          title="Last Week"
          aria-label="Last Week"
          className={`px-1 h-5 flex items-center justify-center rounded text-[8px] font-bold leading-none whitespace-nowrap ${
            musclePeriod === 'weekly'
              ? 'bg-purple-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst wk
        </button>
        <button
          onClick={() => setMusclePeriod('monthly')}
          title="Last Month"
          aria-label="Last Month"
          className={`px-1 h-5 flex items-center justify-center rounded text-[8px] font-bold leading-none whitespace-nowrap ${
            musclePeriod === 'monthly'
              ? 'bg-purple-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst mo
        </button>
        <button
          onClick={() => setMusclePeriod('yearly')}
          title="Last Year"
          aria-label="Last Year"
          className={`px-1 h-5 flex items-center justify-center rounded text-[8px] font-bold leading-none whitespace-nowrap ${
            musclePeriod === 'yearly'
              ? 'bg-purple-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst yr
        </button>
      </div>

      <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-800 shrink-0">
        <button
          onClick={() => setMuscleTrendView('stackedBar')}
          title="Stacked"
          aria-label="Stacked"
          className={`w-5 h-5 flex items-center justify-center rounded ${
            muscleTrendView === 'stackedBar'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ChartColumnStacked className="w-3.5 h-3.5" />
          <span className="sr-only">Stacked</span>
        </button>
        <button
          onClick={() => setMuscleTrendView('area')}
          title="Area"
          aria-label="Area"
          className={`w-5 h-5 flex items-center justify-center rounded ${
            muscleTrendView === 'area'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AreaChartIcon className="w-3.5 h-3.5" />
          <span className="sr-only">Area</span>
        </button>
      </div>
    </div>
  </div>
);
