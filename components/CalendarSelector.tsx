import React, { useMemo, useState } from 'react';
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format, startOfYear, endOfYear } from 'date-fns';

type Range = { start: Date; end: Date };

interface CalendarSelectorProps {
  mode?: 'day' | 'week' | 'both';
  initialMonth?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  availableDates?: Set<string> | null; // yyyy-MM-dd strings for days with data
  onSelectDay?: (date: Date) => void;
  onSelectWeek?: (range: Range) => void;
  // When enabling multiple weeks selection, the week column becomes a checkbox list
  multipleWeeks?: boolean;
  onSelectWeeks?: (ranges: Range[]) => void;
  onSelectMonth?: (range: Range) => void;
  onSelectYear?: (range: Range) => void;
  onClear?: () => void;
}

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({ mode = 'both', initialMonth = null, minDate = null, maxDate = null, availableDates = null, onSelectDay, onSelectWeek, multipleWeeks = false, onSelectWeeks, onSelectMonth, onSelectYear, onClear }) => {
  const [viewMonth, setViewMonth] = useState<Date>(initialMonth ?? new Date());
  const [selectedWeekKeys, setSelectedWeekKeys] = useState<Set<string>>(new Set());
  const today = new Date();

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const rows: Date[][] = [];
    let curr = start;
    let row: Date[] = [];
    while (curr <= end) {
      row.push(curr);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
      curr = addDays(curr, 1);
    }
    return rows;
  }, [viewMonth]);

  const clampDate = (d: Date) => {
    let x = d;
    if (maxDate && x > maxDate) x = maxDate;
    if (minDate && x < minDate) x = minDate;
    if (x > today) x = today;
    return x;
  };

  const clampRange = (r: Range): Range => ({ start: clampDate(r.start), end: clampDate(r.end) });

  const isDisabled = (d: Date) => {
    if (d > today) return true;
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const hasData = (d: Date) => {
    if (!availableDates) return true;
    const key = format(d, 'yyyy-MM-dd');
    return availableDates.has(key);
  };

  const weekKey = (d: Date) => format(d, 'yyyy-MM-dd');
  const weekHasData = (week: Date[]) => week.some(d => hasData(d) && !isDisabled(d));

  return (
    <div className="relative z-10 bg-black/90 border border-slate-700/50 rounded-2xl p-4 w-[360px] max-w-[92vw] text-slate-200 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/60 text-xs font-semibold text-slate-200 border border-slate-700/50"
        >
          Prev
        </button>
        <div className="text-sm font-bold text-white tracking-tight">{format(viewMonth, 'MMMM yyyy')}</div>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/60 text-xs font-semibold text-slate-200 border border-slate-700/50"
        >
          Next
        </button>
      </div>

      <div className={`grid ${mode !== 'day' ? 'grid-cols-8' : 'grid-cols-7'} gap-1 text-[10px] text-slate-400 mb-1`}>
        {mode !== 'day' && <div className="text-center opacity-0">Wk</div>}
        <div className="text-center">Mon</div>
        <div className="text-center">Tue</div>
        <div className="text-center">Wed</div>
        <div className="text-center">Thu</div>
        <div className="text-center">Fri</div>
        <div className="text-center">Sat</div>
        <div className="text-center">Sun</div>
      </div>

      <div className="space-y-1">
        {weeks.map((week, idx) => {
          const weekStart = week[0];
          const weekEnd = week[6];
          const enabledWeek = weekHasData(week);
          const wkKey = weekKey(weekStart);
          const checked = selectedWeekKeys.has(wkKey);
          return (
            <div key={idx} className="flex items-center gap-2">
              {mode !== 'day' && (
                multipleWeeks ? (
                  <label 
                    className={`group flex items-center cursor-pointer shrink-0 ${!enabledWeek ? 'opacity-40 cursor-not-allowed' : ''}`} 
                    title={`${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden peer"
                      disabled={!enabledWeek}
                      checked={checked}
                      onChange={(e) => {
                        if (!enabledWeek) return;
                        setSelectedWeekKeys(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(wkKey); else next.delete(wkKey);
                          return next;
                        });
                      }}
                    />
                    <span className={`relative w-7 h-7 flex justify-center items-center bg-slate-800 border-2 rounded-md shadow-md transition-all duration-300 ${checked ? 'border-blue-500 bg-blue-500' : 'border-slate-600'} ${enabledWeek ? 'group-hover:scale-105 group-hover:border-blue-400' : ''}`}>
                      <span className={`absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-md transition-all duration-300 ${checked ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
                      <svg 
                        fill="currentColor" 
                        viewBox="0 0 20 20" 
                        className={`w-4 h-4 text-white transition-all duration-300 ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path clipRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" fillRule="evenodd" />
                      </svg>
                    </span>
                  </label>
                ) : (
                  <button
                    onClick={() => onSelectWeek && enabledWeek && onSelectWeek(clampRange({ start: weekStart, end: weekEnd }))}
                    className={`text-[10px] px-2 py-1 rounded border w-36 shrink-0 truncate ${enabledWeek ? 'bg-black/70 hover:bg-black/60 border-slate-700/50' : 'bg-black/40 border-slate-700/50 opacity-40 cursor-not-allowed'}`}
                    title={`${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`}
                  >
                    {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
                  </button>
                )
              )}
              <div className={`grid grid-cols-7 gap-1 flex-1`}>
                {week.map((day) => {
                  const disabled = isDisabled(day);
                  const faded = !hasData(day);
                  const hasWorkout = hasData(day) && !disabled;
                  const inMonth = isSameMonth(day, viewMonth);
                  const isToday = isSameDay(day, today);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => (mode !== 'week' && onSelectDay && !disabled && hasWorkout) && onSelectDay(day)}
                      disabled={disabled || !hasWorkout}
                      className={`h-8 rounded flex items-center justify-center text-xs border transition-colors ${
                        inMonth ? (hasWorkout ? 'border-blue-600 bg-blue-900/40 text-blue-200' : 'border-slate-700/50') : 'border-slate-800 text-slate-500'
                      } ${isToday ? 'ring-1 ring-sky-400' : ''} ${disabled || !hasWorkout ? 'opacity-30 cursor-not-allowed' : faded ? 'opacity-50' : 'opacity-100'} ${!disabled && hasWorkout ? 'hover:bg-blue-800' : ''}`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setViewMonth(new Date())}
          className="text-[10px] px-2 py-2 rounded-lg bg-black/70 hover:bg-black/60 border border-slate-700/50 font-semibold"
        >
          Today
        </button>
        {onClear && (
          <button
            onClick={onClear}
            className="text-[10px] px-2 py-2 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-200 font-semibold"
          >
            Clear &amp; Close
          </button>
        )}
        <button
          onClick={() => onSelectMonth && onSelectMonth(clampRange({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) }))}
          className="text-[10px] px-2 py-2 rounded-lg bg-black/70 hover:bg-black/60 border border-slate-700/50 font-semibold"
        >
          Select Month
        </button>
        <button
          onClick={() => onSelectYear && onSelectYear(clampRange({ start: startOfYear(viewMonth), end: endOfYear(viewMonth) }))}
          className="text-[10px] px-2 py-2 rounded-lg bg-black/70 hover:bg-black/60 border border-slate-700/50 font-semibold"
        >
          Select Year
        </button>
      </div>

      {multipleWeeks && onSelectWeeks && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button 
            onClick={() => {
              const ranges: Range[] = Array.from(selectedWeekKeys).map(k => {
                // Avoid timezone drift when reconstructing from 'yyyy-MM-dd' keys
                const d = new Date(`${k}T12:00:00`);
                const start = startOfWeek(d, { weekStartsOn: 1 });
                const end = endOfWeek(d, { weekStartsOn: 1 });
                return clampRange({ start, end });
              });
              onSelectWeeks(ranges);
            }}
            className="text-[10px] px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white"
          >Apply Weeks</button>
          <button onClick={() => setSelectedWeekKeys(new Set())} className="text-[10px] px-2 py-1 rounded bg-black/70 hover:bg-black/60 border border-slate-700/50">Clear Weeks</button>
        </div>
      )}
    </div>
  );
};
