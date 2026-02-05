import React from 'react';

interface CSVImportErrorNoticeProps {
  errorMessage?: string | null;
}

export const CSVImportErrorNotice: React.FC<CSVImportErrorNoticeProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;

  const showNonEnglishHevyDateHelp = errorMessage.includes("couldn't parse the workout dates");

  return (
    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-xs sm:text-sm text-red-200 flex-shrink-0">
      {errorMessage}
      {showNonEnglishHevyDateHelp ? (
        <div className="mt-3">
          <img
            src="/images/steps/step5.avif"
            className="w-full max-w-sm h-auto rounded-lg border border-red-500/20 mx-auto"
            alt="Hevy export language must be English"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
    </div>
  );
};
