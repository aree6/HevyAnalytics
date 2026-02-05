import React from 'react';
import { Calendar, Pencil, X } from 'lucide-react';

interface AppFilterControlsProps {
  hasActiveCalendarFilter: boolean;
  calendarSummaryText: string;
  setCalendarOpen: (open: boolean) => void;
  clearAllFilters: () => void;
  toggleCalendarOpen: () => void;
}

export const AppFilterControls: React.FC<AppFilterControlsProps> = ({
  hasActiveCalendarFilter,
  calendarSummaryText,
  setCalendarOpen,
  clearAllFilters,
  toggleCalendarOpen,
}) => (
  <div
    className={`relative flex items-center gap-2 rounded-lg px-3 py-2 h-10 shadow-sm transition-all duration-300 ${
      hasActiveCalendarFilter ? 'bg-black/70 border border-slate-600/60' : 'bg-black/70 border border-slate-700/50'
    }`}
  >
    <div className="flex-1 min-w-0 overflow-x-auto">
      <div className="flex items-center gap-2 flex-nowrap min-w-max">
        {hasActiveCalendarFilter ? (
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
            title={calendarSummaryText}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300/80" />
            <span className="max-w-[220px] truncate">{calendarSummaryText}</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 whitespace-nowrap">No filter</span>
        )}
      </div>
    </div>

    {hasActiveCalendarFilter ? (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 transition-colors"
          title="Edit filter"
          aria-label="Edit filter"
        >
          <Pencil className="w-4 h-4 text-slate-300" />
        </button>
        <button
          type="button"
          onClick={clearAllFilters}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-slate-200 transition-colors"
          title="Clear filter"
          aria-label="Clear filter"
        >
          <X className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    ) : (
      <button
        onClick={toggleCalendarOpen}
        className="inline-flex items-center gap-2 h-8 px-2 rounded-md bg-black/50 hover:bg-white/5 border border-slate-700/50 text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>Calendar</span>
      </button>
    )}
  </div>
);
