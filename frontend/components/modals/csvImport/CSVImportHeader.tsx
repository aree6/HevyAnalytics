import React from 'react';
import { ArrowLeft, X } from 'lucide-react';

import { UNIFORM_HEADER_BUTTON_CLASS, UNIFORM_HEADER_ICON_BUTTON_CLASS } from '../../../utils/ui/uiConstants';

interface CSVImportHeaderProps {
  intent: 'initial' | 'update';
  onBack?: () => void;
  onClose?: () => void;
}

export const CSVImportHeader: React.FC<CSVImportHeaderProps> = ({ intent, onBack, onClose }) => (
  <div className="grid grid-cols-3 items-start gap-4">
    <div className="flex items-center justify-start">
      {onBack ? (
        <button type="button" onClick={onBack} className={UNIFORM_HEADER_ICON_BUTTON_CLASS}>
          <ArrowLeft className="w-4 h-4" />
        </button>
      ) : null}
    </div>

    <div className="flex justify-center" />

    <div className="flex items-center justify-end">
      {intent === 'update' && onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={`${UNIFORM_HEADER_BUTTON_CLASS} gap-2`}
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      ) : null}
    </div>
  </div>
);
