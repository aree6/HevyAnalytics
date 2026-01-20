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
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs ${
            variant === 'info' && activeNav === 'how-it-works'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' 
              : 'bg-white/5 border border-slate-700/50 text-slate-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-200'
          }`}
        >
          <Info className="w-3 h-3" />
          <span>How it works</span>
        </a>
        <a 
          href={assetPath('features/')} 
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs ${
            variant === 'info' && activeNav === 'features'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' 
              : 'bg-white/5 border border-slate-700/50 text-slate-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Features</span>
        </a>
        <a href="https://github.com/aree6/LiftShift" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-slate-700/50 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all text-xs text-slate-300 hover:text-emerald-200">
          <Github className="w-3 h-3" />
          <span>GitHub</span>
        </a>
      </div>

      {/* Mobile Navigation - all buttons on the right */}
      <div className="sm:hidden flex items-center gap-2">
        <a 
          href={assetPath('how-it-works/')} 
          className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 transition-colors ${
            variant === 'info' && activeNav === 'how-it-works'
              ? 'text-emerald-200' 
              : 'text-slate-300 hover:text-emerald-200'
          }`}
        >
          <Info className="w-2.5 h-2.5" />
          <span>How it works</span>
        </a>
        <a 
          href={assetPath('features/')} 
          className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 transition-colors ${
            variant === 'info' && activeNav === 'features'
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
