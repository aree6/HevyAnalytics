import React from 'react';
import { FlexCard, type CardTheme, FlexCardFooter } from './FlexCard';
import { StreakInfo } from '../../utils/analysis/insights';
import { FANCY_FONT, FANCY_FONT_NUMBERS } from '../../utils/ui/uiConstants';
import CountUp from '../ui/CountUp';

// ============================================================================
// CARD 2: Streak Card - Longest streak with fire emoji
// ============================================================================
export const StreakCard: React.FC<{
  streakInfo: StreakInfo;
  theme: CardTheme;
}> = ({ streakInfo, theme }) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <FlexCard theme={theme} className="min-h-[500px] flex flex-col">
      <div className="relative z-[1] pt-6 px-6 pb-16 flex flex-col items-center text-center flex-1 justify-center">
        <div className={`absolute top-10 right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-orange-500/20' : 'bg-orange-200/50'}`} />
        <div className={`absolute bottom-32 left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-red-500/15' : 'bg-red-200/40'}`} />

        <h2 className={`text-2xl sm:text-3xl font-bold ${textPrimary} mb-12`} style={FANCY_FONT}>
          Your Longest Streak
        </h2>

        <div className="relative mb-8">
          <div className="absolute inset-0 blur-2xl bg-gradient-to-t from-orange-500/40 to-red-500/30 scale-150" />

          <div className="relative">
            <svg
              className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] leading-none filter drop-shadow-lg"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d="M57.047 26.167s-3.049 2.77-8.145 6.074C47.512 24.159 43.656 14.182 36.02 2c0 0-2.497 13.067-10.813 25.435c-3.629-5.598-5.186-9.993-5.186-9.993C-6.145 43.521 15.545 62 29.167 62c17.484 0 32.87-8.361 27.88-35.833M30.063 60.332c-3.81 0-12.314-2.656-16.425-14.883c0 0 1.477.756 3.879 1.631c.098-4.227 1.797-9.636 6.144-16.46c0 0 1.09 2.93 3.63 6.662c5.821-8.246 7.569-16.961 7.569-16.961c5.346 8.125 8.045 14.778 9.019 20.167c3.566-2.204 5.701-4.052 5.701-4.052c-.243 5.423-1.29 9.673-2.805 12.995c2.385-.391 3.892-.807 3.892-.807C43.8 58.322 36.87 60.332 30.063 60.332"
                fill={isDark ? '#ff6b35' : '#ff4500'}
              />
              <path
                d="M21.897 43.854s2.805 3.826 4.938 2.902c0 0 4.055-6.301 9.874-9.804c0 0-1.195 9.606.179 11.304c1.822 2.258 6.759-2.504 6.759-2.504c0 5.676-6.231 12.828-11.806 12.828c-5.535 0-13.382-6.156-9.944-14.726"
                fill={isDark ? '#ff8c42' : '#ff6347'}
              />
              <path
                d="M49.84 18.118c2.101-3.041 3.529-6.156 3.529-6.156c3.523 5.775 1.444 9.287-.104 10.434c-2.077 1.542-5.85-.763-3.425-4.278"
                fill={isDark ? '#ffa500' : '#ff8c00'}
              />
              <path
                d="M11.497 17.131C9.441 13.606 9.21 9.213 9.21 9.213C4.187 16.76 6.149 20.87 7.82 22.114c2.242 1.67 6.05-.91 3.677-4.983"
                fill={isDark ? '#ffb347' : '#ffa500'}
              />
              <path
                d="M23.183 9.291c.256-2.369-.737-4.826-.737-4.826c4.764 3.064 4.707 5.733 4.086 6.772c-.837 1.394-3.646.791-3.349-1.946"
                fill={isDark ? '#ffd700' : '#ffb347'}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <span
                className="text-5xl sm:text-6xl font-black text-black tabular-nums tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                style={{ ...FANCY_FONT_NUMBERS, fontStyle: 'normal' }}
              >
                <CountUp from={0} to={streakInfo.longestStreak} separator="," direction="up" duration={1} />
              </span>
            </div>
          </div>
        </div>

        <div className={`text-3xl sm:text-4xl font-bold ${textPrimary} mb-3`} style={FANCY_FONT}>
          weeks
        </div>

        <p className={`text-base ${textSecondary} max-w-xs`}>
          was your longest streak — keep that fire burning!
        </p>

        {streakInfo.currentStreak > 0 && (
          <div className={`mt-6 px-4 py-2 rounded-full ${isDark ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-orange-100 border border-orange-200'}`}>
            <span className={`text-sm font-semibold ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
              🔥 Currently on a {streakInfo.currentStreak} week streak!
            </span>
          </div>
        )}
      </div>
      <FlexCardFooter theme={theme} />
    </FlexCard>
  );
};
