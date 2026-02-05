import React from 'react';

interface CSVImportIntroProps {
  variant: 'csv' | 'preferences';
  platform: 'hevy' | 'strong' | 'lyfta' | 'other';
  showBodyTypeAndUnitSelectors: boolean;
}

const platformLabel = (platform: CSVImportIntroProps['platform']) => {
  if (platform === 'strong') return 'Strong';
  if (platform === 'lyfta') return 'Lyfta';
  return 'Hevy';
};

export const CSVImportIntro: React.FC<CSVImportIntroProps> = ({
  variant,
  platform,
  showBodyTypeAndUnitSelectors,
}) => {
  const copy = (() => {
    if (variant === 'preferences') {
      return "Let's get set up. Choose your body type and unit, then continue.";
    }

    if (platform === 'other') {
      if (showBodyTypeAndUnitSelectors) {
        return "Let's get set up. Choose your body type and unit, then upload your CSV.";
      }
      return 'Drop your CSV below.';
    }

    const platformName = platformLabel(platform);
    if (showBodyTypeAndUnitSelectors) {
      return `Let's get set up. Choose your body type and unit, then upload your ${platformName} CSV export.`;
    }
    return `Drop your ${platformName} CSV export below.`;
  })();

  return (
    <p className="text-slate-400 mb-6 text-center text-xs sm:text-sm flex-shrink-0">
      {copy}
    </p>
  );
};
