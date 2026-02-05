import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { CardTheme } from '../ui/FlexCard';
import type { FlexCardId } from '../utils/flexViewConstants';

interface FlexFocusedCardModalProps {
  cardId: FlexCardId;
  renderCard: (id: FlexCardId) => React.ReactNode;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  showFocusedNav: boolean;
  setShowFocusedNav: (value: boolean) => void;
  toggleFocusedNavTouch: () => void;
  clearHideNavTimeout: () => void;
  canHover: boolean;
  cardTheme: CardTheme;
}

export const FlexFocusedCardModal: React.FC<FlexFocusedCardModalProps> = ({
  cardId,
  renderCard,
  onClose,
  onPrev,
  onNext,
  showFocusedNav,
  setShowFocusedNav,
  toggleFocusedNavTouch,
  clearHideNavTimeout,
  canHover,
  cardTheme,
}) => (
  <div
    className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    onMouseDown={onClose}
  >
    <div
      className="relative w-full max-w-md"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        toggleFocusedNavTouch();
      }}
      onMouseEnter={() => {
        setShowFocusedNav(true);
        clearHideNavTimeout();
      }}
      onMouseLeave={() => {
        setShowFocusedNav(false);
        clearHideNavTimeout();
      }}
    >
      <div>{renderCard(cardId)}</div>

      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
          if (!canHover) setShowFocusedNav(true);
        }}
        className={`absolute left-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 w-12 h-12 flex items-center justify-center z-[1005] ${
          showFocusedNav ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${cardTheme === 'dark' ? 'text-white hover:text-white' : 'text-black hover:text-black'} drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]`}
        aria-label="Previous card"
        title="Previous"
      >
        <span className="sr-only">Previous</span>
        <ChevronLeft className="pointer-events-none w-10 h-10" strokeWidth={3} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
          if (!canHover) setShowFocusedNav(true);
        }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 w-12 h-12 flex items-center justify-center z-[1005] ${
          showFocusedNav ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${cardTheme === 'dark' ? 'text-white hover:text-white' : 'text-black hover:text-black'} drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]`}
        aria-label="Next card"
        title="Next"
      >
        <span className="sr-only">Next</span>
        <ChevronRight className="pointer-events-none w-10 h-10" strokeWidth={3} />
      </button>
    </div>
  </div>
);
