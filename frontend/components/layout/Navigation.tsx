import React from 'react';
import { Github, Info, Sparkles, Menu } from 'lucide-react';
import { assetPath } from '../../constants';

type NavigationProps = {
  activeNav?: 'how-it-works' | 'features' | null;
  variant?: 'landing' | 'info';
  className?: string;
};

export const Navigation: React.FC<NavigationProps> = ({
  activeNav = null,
  variant = 'landing',
  className = ''
}) => {
  return (
    <header className={`h-20 sm:h-24 flex items-center justify-between ${className}`}>
      {/* Logo on the left */}
      <a href={assetPath('/')} className="flex items-center gap-2 sm:gap-3 rounded-xl px-1.5 sm:px-2 py-1 hover:bg-white/5 transition-colors">
        <img src={assetPath('/UI/logo.png')} alt="LiftShift Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
        <span className="text-white font-semibold text-sm sm:text-xl">LiftShift</span>
      </a>

      {/* Navigation buttons grouped on the right - Desktop */}
      <div className="hidden sm:flex items-center gap-4">
        <a
          href={assetPath('how-it-works/')}
          className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-xs font-medium bg-slate-950/50 border shadow-lg ${variant === 'info' && activeNav === 'how-it-works'
              ? 'border-emerald-400 text-emerald-300 shadow-emerald-500/40'
              : 'border-emerald-500/30 text-slate-300 shadow-emerald-500/10 hover:border-emerald-400 hover:text-emerald-300 hover:shadow-emerald-500/30'
            }`}
        >
          <Info className="w-3.5 h-3.5 group-hover:text-emerald-300 transition-colors" />
          <span>How it works</span>
        </a>
        <a
          href={assetPath('features/')}
          className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-xs font-medium bg-slate-950/50 border shadow-lg ${variant === 'info' && activeNav === 'features'
              ? 'border-emerald-400 text-emerald-300 shadow-emerald-500/40'
              : 'border-emerald-500/30 text-slate-300 shadow-emerald-500/10 hover:border-emerald-400 hover:text-emerald-300 hover:shadow-emerald-500/30'
            }`}
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:text-emerald-300 transition-colors" />
          <span>Features</span>
        </a>
        <a
          href="https://github.com/aree6/LiftShift"
          target="_blank"
          rel="noopener noreferrer"
          className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-xs font-medium bg-slate-950/50 border shadow-lg border-emerald-500/30 text-slate-300 shadow-emerald-500/10 hover:border-emerald-400 hover:text-emerald-300 hover:shadow-emerald-500/30`}
        >
          <Github className="w-3.5 h-3.5 group-hover:text-emerald-300 transition-colors" />
          <span>GitHub</span>
        </a>
      </div>

      {/* Mobile Navigation - all buttons on the right */}
      <div className="sm:hidden flex items-center gap-2">
        <a
          href={assetPath('how-it-works/')}
          className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 transition-colors ${variant === 'info' && activeNav === 'how-it-works'
            ? 'text-emerald-200'
            : 'text-slate-300 hover:text-emerald-200'
            }`}
        >
          <Info className="w-2.5 h-2.5" />
          <span>How it works</span>
        </a>
        <a
          href={assetPath('features/')}
          className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 transition-colors ${variant === 'info' && activeNav === 'features'
            ? 'text-emerald-200'
            : 'text-slate-300 hover:text-emerald-200'
            }`}
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Features</span>
        </a>
        <a href="https://github.com/aree6/LiftShift" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-emerald-200 px-1.5 py-1">
          <Github className="w-2.5 h-2.5" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
};
