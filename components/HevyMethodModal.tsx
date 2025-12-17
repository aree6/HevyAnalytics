import React from 'react';

type HevyMethod = 'login' | 'csv' | 'saved';

type Intent = 'initial' | 'update';

interface HevyMethodModalProps {
  intent: Intent;
  hasSavedSession?: boolean;
  onSelect: (method: HevyMethod) => void;
  onBack: () => void;
  onClose?: () => void;
}

export const HevyMethodModal: React.FC<HevyMethodModalProps> = ({ intent, hasSavedSession = false, onSelect, onBack, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-2 sm:px-3 py-6">
        <div className="max-w-2xl mx-auto slide-in-from-top-2">
          <div className="bg-black/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center h-9 px-3 rounded-md text-xs font-semibold bg-black/60 hover:bg-black/70 border border-slate-700/50 text-slate-200"
              >
                Back
              </button>

              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Hevy</h2>
                <p className="mt-1 text-sm text-slate-300">Choose how you want to import your data.</p>
              </div>

              <div className="w-[72px] flex justify-end">
                {intent === 'update' && onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-md text-xs font-semibold bg-black/60 hover:bg-black/70 border border-slate-700/50 text-slate-200"
                  >
                    Close
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSelect('login')}
                className="group rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-semibold text-lg">Login</div>
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">BETA</span>
                </div>
                <div className="mt-1 text-xs text-slate-200/90">
                  Recommended. Fetch your full workout history from the Hevy API.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelect('csv')}
                className="group rounded-xl border border-slate-700/60 bg-white/5 hover:bg-white/10 px-4 py-4 text-left transition-colors"
              >
                <div className="text-white font-semibold text-lg">Import CSV</div>
                <div className="mt-1 text-xs text-slate-200/90">
                  Manual option. Upload a Hevy export instead of logging in.
                </div>
              </button>
            </div>

            {hasSavedSession ? (
              <button
                type="button"
                onClick={() => onSelect('saved')}
                className="mt-3 w-full rounded-xl border border-slate-700/60 bg-white/5 hover:bg-white/10 px-4 py-4 text-left transition-colors"
              >
                <div className="text-white font-semibold text-lg">Continue</div>
                <div className="mt-1 text-xs text-slate-200/90">
                  Use your saved session token and fetch workouts now.
                </div>
              </button>
            ) : null}

            <div className="mt-5 text-[11px] text-slate-400">
              Your login is sent only to your own backend to retrieve a token. Your workouts are processed in your browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
