import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CsvLoadingAnimation } from '../modals/csvImport/CsvLoadingAnimation';

type LoadingKind = 'hevy' | 'lyfta' | 'csv' | null;

interface AppLoadingOverlayProps {
  open: boolean;
  loadingKind: LoadingKind;
  loadingStep: number;
  progress: number;
}

export const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({
  open,
  loadingKind,
  loadingStep,
  progress,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in px-4 sm:px-6">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center">
        <CsvLoadingAnimation className="mb-6" size={160} />
        <h2 className="text-2xl font-bold text-white mb-2">
          {loadingKind === 'hevy' ? 'Crunching your numbers' : 'Analyzing Workout Data'}
        </h2>
        <p className="text-slate-400 mb-6 text-center">
          {loadingKind === 'hevy'
            ? 'Syncing your workouts from Hevy and preparing your dashboard.'
            : 'Please wait while we process your sets, calculate volume, and identify personal records.'}
        </p>

        <div className="w-full space-y-4">
          <div className="flex items-center space-x-3 text-sm">
            {loadingStep >= 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>
            )}
            <span className={loadingStep >= 0 ? 'text-slate-200' : 'text-slate-600'}>Loading workout data...</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            {loadingStep >= 1 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>
            )}
            <span className={loadingStep >= 1 ? 'text-slate-200' : 'text-slate-600'}>Calculating Personal Records (PRs)...</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            {loadingStep >= 2 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>
            )}
            <span className={loadingStep >= 2 ? 'text-slate-200' : 'text-slate-600'}>Generating visualizations...</span>
          </div>

          <div className="mt-4">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-right text-[10px] text-slate-500 mt-1">{progress}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
