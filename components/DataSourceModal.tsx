import React from 'react';
import type { DataSourceChoice } from '../utils/dataSources/types';

type Intent = 'initial' | 'update';

interface DataSourceModalProps {
  intent: Intent;
  onSelect: (source: DataSourceChoice) => void;
  onClose?: () => void;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({ intent, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-2 sm:px-3 py-6">
        <div className="max-w-2xl mx-auto slide-in-from-top-2">
          <div className="bg-black/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="w-9" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Choose your platform</h2>
              <div className="w-9">
                {intent === 'update' && onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md text-xs font-semibold bg-black/60 hover:bg-black/70 border border-slate-700/50 text-slate-200"
                  >
                    Close
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-2 text-center text-sm text-slate-300">
              {intent === 'initial' ? 'Select how you want to load your training data.' : 'Switch or update your data source.'}
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSelect('hevy')}
                className="group rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-semibold text-lg">Hevy</div>
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">BETA</span>
                </div>
                <div className="mt-1 text-xs text-slate-200/90">
                  Login or import CSV.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelect('strong')}
                className="group rounded-xl border border-slate-700/60 bg-white/5 hover:bg-white/10 px-4 py-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-semibold text-lg">Strong</div>
                  <span className="inline-flex items-center rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">EXPERIMENTAL</span>
                </div>
                <div className="mt-1 text-xs text-slate-200/90">
                  Import a CSV export and analyze locally.
                </div>
              </button>

              <button
                type="button"
                disabled
                className="group rounded-xl border border-slate-800/80 bg-white/5 px-4 py-4 text-left opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-semibold text-lg">Jefit</div>
                  <span className="inline-flex items-center rounded-full border border-slate-600/30 bg-slate-600/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">COMING SOON</span>
                </div>
                <div className="mt-1 text-xs text-slate-200/90">
                  Not available yet.
                </div>
              </button>
            </div>

            <div className="mt-5 text-[11px] text-slate-400">
              Your data is processed locally in your browser. Hevy login is sent to your own backend to retrieve a token.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
