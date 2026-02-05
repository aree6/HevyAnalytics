import { motion } from 'motion/react';

interface HevyLoginHelpProps {
  loginMode: 'credentials' | 'apiKey';
}

export const HevyLoginHelp = ({ loginMode }: HevyLoginHelpProps) => {
  if (loginMode === 'credentials') {
    return (
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <img
            src="/images/steps/step1Login.avif"
            className="w-full h-auto rounded-lg border border-slate-700/60"
            alt="Hevy login step 1"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/step2Login.avif"
            className="w-full h-auto rounded-lg border border-slate-700/60"
            alt="Hevy login step 2"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/step3Login.avif"
            className="w-full h-auto rounded-lg border border-slate-700/60"
            alt="Hevy login step 3"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex justify-center">
          <img
            src="/images/steps/step5.avif"
            className="w-full max-w-xs h-auto rounded-lg border border-slate-700/60"
            alt="Set Hevy language to English"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="text-xs text-slate-400 text-center">
          Support is English-only right now. If you use quick login, use the same email/username here. If you don't have a
          password, set one in your Hevy account first.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-2"
      >
        <p className="text-xs text-emerald-100 font-semibold">API key login</p>
        <div className="text-xs text-emerald-100/80 space-y-2">
          <div>
            Enter your Hevy <span className="font-semibold">Pro API key</span> to sync without entering your password.
          </div>
          <div>You can get it from https://hevy.com/settings?developer (Pro only).</div>
        </div>
      </motion.div>
    </div>
  );
};
