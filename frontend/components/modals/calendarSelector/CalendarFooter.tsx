import React from 'react';

interface CalendarFooterProps {
  hasSelection: boolean;
  onApply: () => void;
  onClose?: () => void;
}

export const CalendarFooter: React.FC<CalendarFooterProps> = ({
  hasSelection,
  onApply,
  onClose,
}) => (
  <>
    <div className="mt-3 flex gap-2">
      <button
        onClick={onApply}
        disabled={!hasSelection}
        className={`flex-1 text-[11px] px-3 py-2 rounded-lg font-semibold transition-colors ${
          hasSelection ? 'bg-white/10 hover:bg-white/15 border border-slate-600/60 text-white' : 'bg-black/40 border border-slate-800/60 text-slate-500 cursor-not-allowed'
        }`}
      >
        Apply
      </button>
    </div>

    <button
      onClick={() => onClose?.()}
      className="sm:hidden mt-2 w-full text-[11px] px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-950 border border-red-500/40 text-red-200 font-semibold transition-colors"
    >
      Close
    </button>
  </>
);
