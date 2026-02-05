import React from 'react';
import { Calendar, ChevronRight, Clock, Dumbbell, Hash, Timer, Trophy, Weight } from 'lucide-react';
import { format } from 'date-fns';
import type { Session } from '../utils/historySessions';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { BodyMapGender } from '../../bodyMap/BodyMap';
import type { TooltipState } from './HistoryTooltipPortal';
import { formatDisplayVolume } from '../../../utils/format/volumeDisplay';
import { formatRelativeTime } from '../../../utils/date/dateUtils';
import { parseHevyDateString } from '../../../utils/date/parseHevyDateString';
import { FANCY_FONT } from '../../../utils/ui/uiConstants';
import { SessionDeltaBadge } from './SessionDeltaBadge';
import { HistorySessionBodyMap } from './HistorySessionBodyMap';

interface HistorySessionHeaderCardProps {
  session: Session;
  effectiveNow: Date;
  weightUnit: WeightUnit;
  exerciseCount: number;
  sessionDurationText: string | null;
  prevSession: Session | null;
  isCollapsed: boolean;
  isLightMode: boolean;
  sessionHeatmapHasData: boolean;
  sessionHeadlessVolumes: Map<string, number>;
  sessionHeadlessMaxVolume: number;
  bodyMapGender: BodyMapGender;
  setTooltip: (state: TooltipState | null) => void;
  toggleCollapsed: () => void;
}

export const HistorySessionHeaderCard: React.FC<HistorySessionHeaderCardProps> = ({
  session,
  effectiveNow,
  weightUnit,
  exerciseCount,
  sessionDurationText,
  prevSession,
  isCollapsed,
  isLightMode,
  sessionHeatmapHasData,
  sessionHeadlessVolumes,
  sessionHeadlessMaxVolume,
  bodyMapGender,
  setTooltip,
  toggleCollapsed,
}) => {
  return (
    <div
      id={`session-${session.key}`}
      role="button"
      tabIndex={0}
      aria-expanded={!isCollapsed}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggleCollapsed();
      }}
      onClick={(e) => {
        const el = e.target as Element | null;
        if (el?.closest('button,a,input,select,textarea,[data-no-toggle]')) return;
        toggleCollapsed();
      }}
      className="border border-slate-700/50 rounded-2xl p-5 sm:p-7 sm:min-h-[168px] flex flex-row justify-between items-stretch gap-2 sm:gap-6 shadow-xl relative overflow-visible group transition-all duration-300 hover:border-slate-600/50 cursor-pointer active:scale-[0.99]"
      style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.78)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ backgroundColor: 'rgb(var(--mw-history-header-tint-rgb) / var(--mw-history-header-tint-alpha))' }}
      />
      <div className="absolute inset-0 bg-slate-700/10 pointer-events-none rounded-2xl" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>

      {sessionHeatmapHasData && (
        <div className={`relative z-10 w-full sm:hidden grid grid-cols-3 gap-x-3 gap-y-1 transition-all duration-300 ${isCollapsed ? 'grid-rows-[auto_auto]' : 'grid-rows-[auto_auto_1.75rem_1.75rem_1.75rem_1.75rem]'}`}>
          <div className="col-span-3 relative flex items-center justify-between gap-2 min-w-0">
            <h3
              className="text-base text-slate-200 tracking-tight truncate capitalize"
              style={FANCY_FONT}
              title={session.title}
            >
              {session.title}
            </h3>
            {session.totalPRs > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold flex-shrink-0">
                <Trophy className="w-3 h-3" />
                {session.totalPRs} PR{session.totalPRs > 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              data-no-toggle
              onClick={toggleCollapsed}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center ${isLightMode ? 'bg-white/90 border-slate-300/80' : 'bg-black/75 border-slate-700/60'}`}
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'} ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}
                aria-hidden
              />
            </button>
          </div>

          <div className="col-span-3 flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                {session.date ? formatRelativeTime(session.date, effectiveNow) : '—'}
              </div>
            </div>
          </div>

          {isCollapsed && (
            <div className="col-span-3" />
          )}

          {!isCollapsed && (
            <>
              <div className="col-span-1 row-start-3 h-7 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 min-w-0 transition-all duration-300">
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" aria-hidden />
                <span className="truncate">
                  {(() => {
                    const d = session.date ?? parseHevyDateString(String(session.startTime ?? ''));
                    return d ? format(d, 'h:mm a') : '—';
                  })()}
                </span>
              </div>

              <div className="col-span-1 row-start-4 h-7 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap transition-all duration-300">
                <Hash className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden />
                <span>{session.totalSets} Sets</span>
              </div>

              <div className="col-span-1 row-start-5 h-7 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap transition-all duration-300">
                <Dumbbell className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden />
                <span>{exerciseCount} Exercise{exerciseCount === 1 ? '' : 's'}</span>
              </div>

              <div className="col-span-1 row-start-6 h-7 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap transition-all duration-300">
                <Timer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden />
                <span>{sessionDurationText ?? '—'}</span>
              </div>

              <div
                data-no-toggle
                className="col-start-2 col-span-2 row-start-3 row-span-5 flex items-stretch pl-2 border-l border-slate-800/50 overflow-visible transition-all duration-300"
              >
                <div className="w-full h-full flex items-center justify-center overflow-visible">
                  <div className="w-full h-full overflow-visible">
                    <HistorySessionBodyMap
                      headlessVolumes={sessionHeadlessVolumes}
                      headlessMaxVolume={sessionHeadlessMaxVolume}
                      bodyMapGender={bodyMapGender}
                      setTooltip={setTooltip}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className={sessionHeatmapHasData ? 'relative z-10 hidden sm:flex flex-1 min-w-0 flex-col justify-between gap-2 md:gap-3' : 'relative z-10 flex flex-1 min-w-0 flex-col justify-between gap-2 md:gap-3'}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg text-blue-400 flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3
            className="text-lg sm:text-2xl md:text-3xl text-slate-200 tracking-tight truncate capitalize"
            style={FANCY_FONT}
            title={session.title}
          >
            {session.title}
          </h3>
          {session.totalPRs > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold flex-shrink-0">
              <Trophy className="w-3 h-3" />
              {session.totalPRs} PR{session.totalPRs > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 pl-1">
          {session.date ? formatRelativeTime(session.date, effectiveNow) : session.startTime}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 pl-1 min-w-0">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" aria-hidden />
            <span>{session.totalSets} Sets</span>
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" aria-hidden />
            <span>{exerciseCount} Exercise{exerciseCount === 1 ? '' : 's'}</span>
          </span>
          {sessionDurationText && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" aria-hidden />
              <span>{sessionDurationText}</span>
            </span>
          )}

          <span className="flex items-baseline min-w-0">
            <span className="inline-flex items-center gap-1 whitespace-nowrap min-w-0 truncate">
              <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" aria-hidden />
              <span>{formatDisplayVolume(session.totalVolume, weightUnit as WeightUnit, { round: 'int' })} {weightUnit}</span>
            </span>
            {prevSession && (
              <span className="flex-none overflow-visible hidden sm:block">
                <SessionDeltaBadge
                  current={session.totalVolume}
                  previous={prevSession.totalVolume}
                  label="volume"
                  context="vs lst"
                />
              </span>
            )}
          </span>
        </div>
      </div>

      <div className={sessionHeatmapHasData ? 'hidden sm:flex items-center justify-center px-2 text-black dark:text-slate-300' : 'flex items-center justify-center px-2 text-black dark:text-slate-300'}>
        <ChevronRight
          className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
          aria-hidden
        />
      </div>

      {sessionHeatmapHasData && (
        <div data-no-toggle className="hidden sm:flex relative z-10 flex-shrink-0 items-stretch pl-1 sm:pl-4 py-1 sm:py-2 border-l border-slate-800/50 self-stretch overflow-visible">
          <div className="w-[50vw] h-[30vh] sm:w-32 sm:h-28 md:w-60 md:h-36 md:-mr-6 flex items-center justify-center overflow-visible">
            <div className="w-full h-full md:scale-[1.25] origin-center overflow-visible">
              <HistorySessionBodyMap
                headlessVolumes={sessionHeadlessVolumes}
                headlessMaxVolume={sessionHeadlessMaxVolume}
                bodyMapGender={bodyMapGender}
                setTooltip={setTooltip}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
