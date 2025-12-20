import React from 'react';
import { motion } from 'motion/react';
import type { DataSourceChoice } from '../utils/dataSources/types';
import { ThemedBackground } from './ThemedBackground';
import PlatformDock from './landing/PlatformDock';
import { ReviewsCarousel } from './landing/ReviewsCarousel';
import LightRays from './landing/LightRays';
import { Github, Flame, CalendarDays, Trophy, BarChart3, Dumbbell } from 'lucide-react';
import { FANCY_FONT } from '../utils/ui/uiConstants';

interface LandingPageProps {
  onSelectPlatform: (source: DataSourceChoice) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectPlatform }) => {
  // Platform dock items
  const platformDockItems = [
    { 
      name: 'Hevy',
      image: '/hevy_small.webp',
      onClick: () => onSelectPlatform('hevy'),
      badge: 'Recommended'
    },
    { 
      name: 'Strong',
      image: '/Strong_small.webp',
      onClick: () => onSelectPlatform('strong'),
      badge: 'CSV'
    },
    { 
      name: 'Lyfta',
      image: '/lyfta_small.webp',
      onClick: () => onSelectPlatform('lyfta'),
      badge: 'CSV'
    },
    { 
      name: 'Jefit',
      image: '/Jefit_small.webp',
      onClick: () => {},
      disabled: true,
      badge: 'Soon'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#030712] text-white font-sans"
    >
      <ThemedBackground />
      
      {/* Light Rays Effect */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#10b981"
          raysSpeed={0.8}
          lightSpread={1.2}
          rayLength={1.5}
          followMouse={true}
          mouseInfluence={0.08}
          noiseAmount={0.05}
          distortion={0.03}
          fadeDistance={1.2}
          saturation={0.9}
        />
      </div>
      
      {/* ========== HERO SECTION ========== */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        <div className="max-w-6xl mx-auto w-full">
          {/* Top Nav - Minimal */}
          <nav className="flex items-center justify-between mb-12 sm:mb-20">
            <div className="flex items-center gap-3">
              <img src="/UI/logo.svg" alt="LiftShift Logo" className="w-9 h-9 sm:w-11 sm:h-11" />
              <span className="font-bold text-xl sm:text-2xl tracking-tight text-white">
                LiftShift
              </span>
            </div>
            <a 
              href="https://github.com/aree6/LiftShift" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-slate-700/50 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all text-sm text-slate-400 hover:text-emerald-300"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-300">Free & Open Source</span>
            </div>

            {/* Main Headline - Focus on transformation */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-8 leading-[1.2]">
              <span className="block text-yellow-600 font-medium text-2xl sm:text-3xl lg:text-4xl mb-2" style={FANCY_FONT}>
                Boring workout logs?
              </span>
              <span className="block text-slate-400 text-3xl sm:text-3xl lg:text-4xl xl:text-5xl ">transform them into</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-green-400 bg-clip-text text-transparent pb-2 mt-1 " style={FANCY_FONT}>
                Stunning & actionable insights.
              </span>
            </h1>

            {/* Feature highlights - what you get */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-10 text-slate-400">
              <FeatureTag icon={<Flame className="w-4 h-4 text-orange-400" />} text="Muscle Heatmaps" />
              <FeatureTag icon={<CalendarDays className="w-4 h-4 text-blue-400" />} text="Calendar Filtering" />
              <FeatureTag icon={<Trophy className="w-4 h-4 text-yellow-400" />} text="PR Detection" />
              <FeatureTag icon={<BarChart3 className="w-4 h-4 text-emerald-400" />} text="Volume Trends" />
              <FeatureTag icon={<Dumbbell className="w-4 h-4 text-purple-400" />} text="Exercise Deep Dives" />
            </div>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Import from <span className="text-slate-300">Hevy</span>, <span className="text-slate-300">Strong</span>, or <span className="text-slate-300">Lyfta</span>. 
              All processing happens locally in your browser.
            </p>

            {/* Hero Visual - App Preview */}
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-emerald-500/20 rounded-3xl blur-3xl opacity-60" />
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                <img 
                  src="/carousel/1.webp" 
                  alt="LiftShift Dashboard Preview" 
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== REVIEWS SECTION ========== */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-24 pb-56">
        <div className="max-w-6xl mx-auto">
          <ReviewsCarousel />
        </div>
      </section>

      {/* ========== PLATFORM DOCK ========== */}
      <PlatformDock items={platformDockItems} />
    </motion.div>
  );
};

// Feature tag component
interface FeatureTagProps {
  icon: React.ReactNode;
  text: string;
}

const FeatureTag: React.FC<FeatureTagProps> = ({ icon, text }) => (
  <span className="inline-flex items-center gap-1.5 text-sm">
    {icon}
    <span>{text}</span>
  </span>
);

export default LandingPage;
