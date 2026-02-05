import React from 'react';
import { Trash2, Upload } from 'lucide-react';

import { UNIFORM_HEADER_BUTTON_CLASS } from '../../../utils/ui/uiConstants';

interface CSVImportFooterProps {
  variant: 'csv' | 'preferences';
  platform: 'hevy' | 'strong' | 'lyfta' | 'other';
  showExportHelp: boolean;
  onToggleExportHelp: () => void;
  onClearCache?: () => void;
  isLoading: boolean;
}

export const CSVImportFooter: React.FC<CSVImportFooterProps> = ({
  variant,
  platform,
  showExportHelp,
  onToggleExportHelp,
  onClearCache,
  isLoading,
}) => {
  if (variant === 'csv') {
    return (
      <div className="flex items-center justify-center gap-3">
        {platform !== 'other' ? (
          <button
            type="button"
            onClick={onToggleExportHelp}
            className={`${UNIFORM_HEADER_BUTTON_CLASS} h-10 text-sm font-semibold gap-2`}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{showExportHelp ? 'Hide export guide' : 'How to export CSV'}</span>
            <span className="sm:hidden">{showExportHelp ? 'Hide' : 'Export guide'}</span>
          </button>
        ) : null}

        {onClearCache ? (
          <button
            type="button"
            onClick={onClearCache}
            disabled={isLoading}
            className={`${UNIFORM_HEADER_BUTTON_CLASS} h-10 text-sm font-semibold disabled:opacity-60 gap-2`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear cache</span>
          </button>
        ) : null}
      </div>
    );
  }

  if (!onClearCache) return null;

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClearCache}
        disabled={isLoading}
        className={`${UNIFORM_HEADER_BUTTON_CLASS} h-10 text-sm font-semibold disabled:opacity-60 gap-2`}
      >
        <Trash2 className="w-4 h-4" />
        <span>Clear cache</span>
      </button>
    </div>
  );
};
