import React from 'react';

export type CardTheme = 'dark' | 'light';

interface FlexCardProps {
  children: React.ReactNode;
  theme: CardTheme;
  className?: string;
}

// Shared card wrapper for consistent styling
export const FlexCard: React.FC<FlexCardProps> = ({ children, theme, className = '' }) => {
  const isDark = theme === 'dark';
  const cardBg = isDark 
    ? 'bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628]' 
    : 'bg-gradient-to-br from-white/80 via-sky-50/70 to-fuchsia-50/60';
  const cardBorder = isDark ? 'border-slate-700/40' : 'border-slate-200/80';
  const glowClass = '';
  const ringClass = '';

  return (
    <div className={`relative rounded-3xl border ${cardBorder} ${cardBg} ${glowClass} ${ringClass} overflow-hidden transition-all duration-500 ${className}`}>
      {children}
    </div>
  );
};

// Branding footer component
export function FlexCardFooter({ theme }: { theme: CardTheme }) {
  const isDark = theme === 'dark';
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none select-none">
      <span className={`text-[11px] font-semibold tracking-wide ${isDark ? '!text-slate-500' : '!text-slate-600'}`}>
        LiftShift.app
      </span>
    </div>
  );
}
