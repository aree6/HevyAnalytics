import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const HistoryPaginationControls: React.FC<HistoryPaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 w-9 bg-transparent border border-black/70 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200"
    >
      <ChevronLeft className="w-4 h-4 text-slate-400" />
    </button>
    <span className="text-xs font-medium text-slate-400 min-w-[80px] text-center">
      Page {currentPage} of {totalPages}
    </span>
    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 w-9 bg-transparent border border-black/70 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200"
    >
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </button>
  </div>
);
