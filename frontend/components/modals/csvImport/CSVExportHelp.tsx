import React from 'react';

interface CSVExportHelpProps {
  platform: 'hevy' | 'strong' | 'lyfta' | 'other';
}

export const CSVExportHelp: React.FC<CSVExportHelpProps> = ({ platform }) => {
  if (platform === 'hevy') {
    return (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <img
            src="/images/steps/Step1.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Hevy export step 1"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/Step2.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Hevy export step 2"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/Step3.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Hevy export step 3"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/Step4.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Hevy export step 4"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex justify-center">
          <img
            src="/images/steps/step5.avif"
            className="w-full max-w-xs h-auto rounded-lg border border-slate-700/60"
            alt="Set Hevy export language to English"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="text-xs text-slate-400 text-center">
          Support is English-only right now. Make sure your Hevy app language is set to English before exporting.
        </div>
      </div>
    );
  }

  if (platform === 'strong') {
    return (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <img
            src="/images/steps/StrongStep1.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Strong export step 1"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/StrongStep2.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Strong export step 2"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/images/steps/StrongStep3.avif"
            className="w-full h-auto rounded-lg border border-slate-700"
            alt="Strong export step 3"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    );
  }

  if (platform === 'lyfta') {
    return (
      <div className="mt-3">
        <p className="text-xs text-slate-400 text-center">
          Support is English-only right now. Make sure your Lyfta app language is set to English before exporting.
        </p>
      </div>
    );
  }

  return null;
};
