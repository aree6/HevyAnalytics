import React from 'react';
import { Dumbbell, Trophy } from 'lucide-react';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../../utils/ui/uiConstants';

// ============================================================================
// CARD 5: Top Exercises Card
// ============================================================================
export const TopExercisesCard: React.FC<{
  exercises: { name: string; count: number; thumbnail?: string }[];
  theme: CardTheme;
}> = ({ exercises, theme }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  const maxCount = exercises.length > 0 ? exercises[0].count : 1;

  return (
    <FlexCard theme={theme} className="min-h-[500px] flex flex-col">
      <div className="relative z-[1] pt-6 px-5 pb-16 flex flex-col items-center flex-1">
        <div className={`flex items-center gap-2 mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Trophy className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Most Performed</span>
        </div>

        <h2 className={`text-2xl sm:text-3xl font-bold ${textPrimary} mb-8 text-center`} style={FANCY_FONT}>
          Your Top Exercises
        </h2>

        {exercises.length === 0 ? (
          <div
            className={`flex items-center justify-center h-[220px] text-xs text-slate-500 border border-dashed ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            } rounded-lg`}
          >
            Building baseline — log a few workouts to see your top exercises.
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col justify-center gap-3 px-1 sm:px-2 overflow-x-hidden">
            {(() => {
              const display = exercises.slice(0, 3);
              const max = Math.max(...display.map((e) => e.count), 1);
              const rowH = 48;
              const avatar = 40;
              const colors = ['#06b6d4', '#3b82f6', '#a855f7'];

              return display.map((exercise, idx) => {
                const color = colors[idx % colors.length];
                const pct = Math.max(4, Math.round((exercise.count / max) * 100));

                const medal = idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze';
                const medalEmoji = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉';
                const countClass =
                  medal === 'gold'
                    ? isDark
                      ? 'text-amber-300'
                      : 'text-amber-700'
                    : medal === 'silver'
                      ? isDark
                        ? 'text-slate-200'
                        : 'text-slate-700'
                      : isDark
                        ? 'text-orange-300'
                        : 'text-orange-700';

                const fillBackground =
                  medal === 'gold'
                    ? 'linear-gradient(90deg, rgba(245,158,11,0.95) 0%, rgba(59,130,246,0.9) 100%)'
                    : medal === 'silver'
                      ? 'linear-gradient(90deg, rgba(226,232,240,0.96) 0%, rgba(148,163,184,0.92) 40%, rgba(59,130,246,0.85) 100%)'
                      : 'linear-gradient(90deg, rgba(251,146,60,0.9) 0%, rgba(59,130,246,0.85) 100%)';

                const medalRing =
                  medal === 'gold'
                    ? ''
                    : medal === 'silver'
                      ? ''
                      : '';

                return (
                  <div key={exercise.name} className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative flex-1 min-w-0 rounded-full overflow-hidden ${
                        isDark ? 'bg-black/25' : 'bg-slate-200/70'
                      }`}
                      style={{ height: `${rowH}px` }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                        style={{
                          width: `${pct}%`,
                          minWidth: '64px',
                          backgroundColor: fillBackground ? undefined : color,
                          backgroundImage: fillBackground,
                          opacity: 0.95,
                        }}
                      >
                        <div
                          className="relative z-10 h-full flex items-center pl-4"
                          style={{ paddingRight: `${avatar + 14}px` }}
                        >
                          <div className="text-white font-semibold text-sm truncate">{`${medalEmoji} ${exercise.name}`}</div>
                        </div>

                        <div
                          className={`absolute top-1/2 -translate-y-1/2 right-1 rounded-full overflow-hidden bg-white ${medalRing}`}
                          style={{ width: `${avatar}px`, height: `${avatar}px` }}
                        >
                          {exercise.thumbnail ? (
                            <img
                              src={exercise.thumbnail}
                              alt={exercise.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/95 flex items-center justify-center">
                              <Dumbbell className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`min-w-[72px] text-right font-extrabold text-xl tracking-tight ${countClass}`} style={FANCY_FONT_NUMBERS}>
                      {exercise.count}
                      <span className={`${isDark ? 'text-white/90' : 'text-slate-900/80'} font-bold ml-1`}>x</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
