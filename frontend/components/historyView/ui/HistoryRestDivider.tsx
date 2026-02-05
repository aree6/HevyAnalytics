import React from 'react';

interface HistoryRestDividerProps {
  restText: string;
  isDayBreak: boolean;
}

export const HistoryRestDivider: React.FC<HistoryRestDividerProps> = ({ restText, isDayBreak }) => (
  <div className={`${isDayBreak ? 'my-20 sm:my-28' : 'my-10 sm:my-12'} w-full flex justify-center`}>
    <div className="flex flex-col items-center">
      <div className={`w-px ${isDayBreak ? 'h-24 sm:h-32' : 'h-14 sm:h-20'} bg-slate-800/70`} aria-hidden />
      <div className="my-4 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm sm:text-base font-extrabold tracking-wide shadow-[0_0_18px_rgba(16,185,129,0.15)]">
        {restText}
      </div>
      <div className={`w-px ${isDayBreak ? 'h-24 sm:h-32' : 'h-14 sm:h-20'} bg-slate-800/70`} aria-hidden />
    </div>
  </div>
);
