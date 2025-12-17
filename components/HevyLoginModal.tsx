import React, { useState } from 'react';

type Intent = 'initial' | 'update';

interface HevyLoginModalProps {
  intent: Intent;
  errorMessage?: string | null;
  isLoading?: boolean;
  onLogin: (emailOrUsername: string, password: string) => void;
  onBack?: () => void;
  onClose?: () => void;
}

export const HevyLoginModal: React.FC<HevyLoginModalProps> = ({
  intent,
  errorMessage,
  isLoading = false,
  onLogin,
  onBack,
  onClose,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full px-2 sm:px-3 py-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-black/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 slide-in-from-top-2">
            <div className="flex items-start justify-between gap-3">
              <div className="w-[72px]">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-md text-xs font-semibold bg-black/60 hover:bg-black/70 border border-slate-700/50 text-slate-200"
                  >
                    Back
                  </button>
                ) : null}
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Login to Hevy</h2>
                <p className="mt-1 text-sm text-slate-300">We use your credentials once to obtain a Hevy auth token.</p>
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

            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                onLogin(emailOrUsername.trim(), password);
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-200">Username or Email</label>
                <input
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full h-10 rounded-md bg-black/50 border border-slate-700/60 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full h-10 rounded-md bg-black/50 border border-slate-700/60 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                  autoComplete="current-password"
                  required
                />
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
              >
                {isLoading ? 'Logging in…' : 'Login'}
              </button>
            </form>

            <div className="mt-4 text-[11px] text-slate-400">
              Tip: if you don’t want to enter a password here, we can later add “paste auth token” login.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
