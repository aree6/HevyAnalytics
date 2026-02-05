import React from 'react';
import { Grid3X3, Infinity, Scan } from 'lucide-react';
import { WeeklySetsBodyIcon, WeeklySetsMuscleIcon } from './WeeklySetsIcons';

type WeeklySetsView = 'radar' | 'heatmap';
type WeeklySetsWindow = 'all' | '7d' | '30d' | '365d';
type WeeklySetsGrouping = 'groups' | 'muscles';

interface WeeklySetsHeaderProps {
  weeklySetsView: WeeklySetsView;
  setWeeklySetsView: (v: WeeklySetsView) => void;
  compositionGrouping: WeeklySetsGrouping;
  setCompositionGrouping: (v: WeeklySetsGrouping) => void;
  muscleCompQuick: WeeklySetsWindow;
  setMuscleCompQuick: (v: WeeklySetsWindow) => void;
}

export const WeeklySetsHeader: React.FC<WeeklySetsHeaderProps> = ({
  weeklySetsView,
  setWeeklySetsView,
  compositionGrouping,
  setCompositionGrouping,
  muscleCompQuick,
  setMuscleCompQuick,
}) => (
  <div className="relative z-30 flex flex-row justify-between items-center gap-2 mb-4">
    <h3 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2">
      <WeeklySetsBodyIcon className="w-5 h-5 text-cyan-500" />
      <span>Weekly sets</span>
    </h3>

    <div className="flex items-center justify-end gap-1 flex-wrap sm:flex-nowrap overflow-x-auto sm:overflow-visible">
      <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-800 shrink-0">
        <button
          onClick={() => setWeeklySetsView('radar')}
          title="Radar"
          aria-label="Radar"
          className={`w-6 h-5 flex items-center justify-center rounded ${
            weeklySetsView === 'radar' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Scan className="w-3 h-3" />
          <span className="sr-only">Radar</span>
        </button>
        <button
          onClick={() => setWeeklySetsView('heatmap')}
          title="Heatmap"
          aria-label="Heatmap"
          className={`w-6 h-5 flex items-center justify-center rounded ${
            weeklySetsView === 'heatmap'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Grid3X3 className="w-3 h-3" />
          <span className="sr-only">Heatmap</span>
        </button>
      </div>

      <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-800 shrink-0 hidden">
        <button
          onClick={() => setCompositionGrouping('groups')}
          title="Groups"
          aria-label="Groups"
          className={`w-6 h-5 flex items-center justify-center rounded ${
            compositionGrouping === 'groups'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <WeeklySetsBodyIcon className="w-3 h-3" />
          <span className="sr-only">Groups</span>
        </button>
        <button
          onClick={() => setCompositionGrouping('muscles')}
          title="Muscles"
          aria-label="Muscles"
          className={`w-6 h-5 flex items-center justify-center rounded ${
            compositionGrouping === 'muscles'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <WeeklySetsMuscleIcon className="w-3 h-3" />
          <span className="sr-only">Muscles</span>
        </button>
      </div>

      <div className="bg-black/70 p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-800 shrink-0">
        <button
          onClick={() => setMuscleCompQuick('all')}
          title="All"
          aria-label="All"
          className={`w-6 h-5 flex items-center justify-center rounded ${
            muscleCompQuick === 'all'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Infinity className="w-3 h-3" />
          <span className="sr-only">All</span>
        </button>
        <button
          onClick={() => setMuscleCompQuick('7d')}
          title="Last 7 days"
          aria-label="Last 7 days"
          className={`px-1 h-5 flex items-center justify-center rounded text-[8px] font-bold leading-none ${
            muscleCompQuick === '7d' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          7d
        </button>
        <button
          onClick={() => setMuscleCompQuick('30d')}
          title="Last 30 days"
          aria-label="Last 30 days"
          className={`px-1 h-5 flex items-center justify-center rounded text-[8px] font-bold leading-none ${
            muscleCompQuick === '30d'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          30d
        </button>
        <button
          onClick={() => setMuscleCompQuick('365d')}
          title="Last year"
          aria-label="Last year"
          className={`px-1 h-5 flex items-center justify-center rounded text-[8px] font-bold leading-none ${
            muscleCompQuick === '365d'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          lst yr
        </button>
      </div>
    </div>
  </div>
);
