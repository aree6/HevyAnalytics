import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { ExerciseStats } from '../../../types';
import { ExerciseAssetLookup } from '../../../utils/exercise/exerciseAssetLookup';
import type { ExerciseListSortMode, UseExerciseFiltersReturn } from '../hooks/useExerciseFilters';
import { ExerciseListRow } from './ExerciseListRow';
import { Reveal } from '../../ui/Reveal';

interface ExerciseListPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  exerciseListSortMode: UseExerciseFiltersReturn['exerciseListSortMode'];
  setExerciseListSortMode: UseExerciseFiltersReturn['setExerciseListSortMode'];
  exerciseListSortDir: UseExerciseFiltersReturn['exerciseListSortDir'];
  setExerciseListSortDir: UseExerciseFiltersReturn['setExerciseListSortDir'];
  filteredExercises: ExerciseStats[];
  selectedExerciseName: string;
  statusMap: UseExerciseFiltersReturn['statusMap'];
  assetLookup: ExerciseAssetLookup | null;
  trainingStructure: UseExerciseFiltersReturn['trainingStructure'];
  lastSessionByName: UseExerciseFiltersReturn['lastSessionByName'];
  effectiveNow: Date;
  exerciseButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onExerciseClick?: (exerciseName: string) => void;
  setSelectedExerciseName: (name: string) => void;
}

export const ExerciseListPanel: React.FC<ExerciseListPanelProps> = ({
  searchTerm,
  setSearchTerm,
  exerciseListSortMode,
  setExerciseListSortMode,
  exerciseListSortDir,
  setExerciseListSortDir,
  filteredExercises,
  selectedExerciseName,
  statusMap,
  assetLookup,
  trainingStructure,
  lastSessionByName,
  effectiveNow,
  exerciseButtonRefs,
  onExerciseClick,
  setSelectedExerciseName,
}) => {
  const handleSelect = useCallback((exerciseName: string) => {
    if (onExerciseClick) {
      onExerciseClick(exerciseName);
    } else {
      setSelectedExerciseName(exerciseName);
    }
    
    // Auto-scroll on mobile to show the exercise details below
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Small delay to let React render and blur take effect
      requestAnimationFrame(() => {
        setTimeout(() => {
          const summaryPanel = document.querySelector('[data-exercise-summary-panel]');
          if (summaryPanel) {
            summaryPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    }
  }, [onExerciseClick, setSelectedExerciseName]);

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const sortOptions = [
    { value: 'trend-asc', label: 'Strength (low to high)', icon: TrendingUp },
    { value: 'trend-desc', label: 'Strength (high to low)', icon: TrendingUp },
    { value: 'recent-desc', label: 'Date (new to old)', icon: Calendar },
    { value: 'recent-asc', label: 'Date (old to new)', icon: Calendar },
  ] as const;

  const currentValue = `${exerciseListSortMode}-${exerciseListSortDir}`;

  const handleSortChange = (value: string) => {
    const [mode, dir] = value.split('-') as [ExerciseListSortMode, 'desc' | 'asc'];
    setExerciseListSortMode(mode);
    setExerciseListSortDir(dir);
    setIsSortOpen(false);
  };

  return (
    <Reveal className="lg:col-span-1 flex flex-col gap-1 h-[34vh] lg:h-0 lg:min-h-full">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search exercises or muscles..."
          className="w-full bg-black/20 border border-slate-700/50 rounded-lg pl-9 pr-[8.5rem] py-1 sm:py-2 text-[11px] sm:text-xs text-slate-200 focus:outline-none focus:border-transparent transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1 p-1.5 rounded-lg bg-black/20 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-black/60 transition-colors cursor-pointer"
            aria-label="Sort exercises"
          >
            {exerciseListSortMode === 'trend' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            <span className="text-[9px] sm:text-[10px] leading-none">{exerciseListSortDir === 'desc' ? '↓' : '↑'}</span>
            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden z-50 py-1">
              {sortOptions.map(opt => {
                const OptionIcon = opt.icon;
                const isActive = currentValue === opt.value;
                const [, oDir] = opt.value.split('-') as [ExerciseListSortMode, 'desc' | 'asc'];
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <OptionIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="w-3 text-center shrink-0">{oDir === 'desc' ? '↓' : '↑'}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-black/20 border border-slate-700/50 rounded-lg overflow-hidden flex flex-col min-h-0">
        <div className="overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar flex-1">
          {filteredExercises.map((exercise) => {
            const status = statusMap[exercise.name];
            const isSelected = selectedExerciseName === exercise.name;
            const asset = assetLookup?.getAsset(exercise.name);
            const eligibility = trainingStructure.eligibilityByName.get(exercise.name);
            const isEligible = eligibility?.isEligible ?? false;
            const inactiveLabel = eligibility?.inactiveLabel ?? 'inactive';
            const lastDone = lastSessionByName.get(exercise.name) ?? null;

            return (
              <ExerciseListRow
                key={exercise.name}
                exercise={exercise}
                asset={asset}
                status={status}
                isSelected={isSelected}
                isEligible={isEligible}
                inactiveLabel={inactiveLabel}
                lastDone={lastDone}
                effectiveNow={effectiveNow}
                onSelect={() => handleSelect(exercise.name)}
                rowRef={(el) => {
                  exerciseButtonRefs.current[exercise.name] = el;
                }}
              />
            );
          })}
        </div>
      </div>
    </Reveal>
  );
};
