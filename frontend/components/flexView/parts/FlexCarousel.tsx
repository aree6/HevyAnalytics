import React from 'react';

import { LazyRender } from '../../ui/LazyRender';
import type { FlexCardId } from '../utils/flexViewConstants';

interface FlexCarouselProps {
  cards: { id: FlexCardId; label: string }[];
  onSelectCard: (id: FlexCardId) => void;
  renderCard: (id: FlexCardId) => React.ReactNode;
}

const FlexCarouselPlaceholder = () => (
  <div className="min-h-[500px] rounded-2xl border border-slate-700/50 bg-black/70 p-6">
    <div className="animate-pulse">
      <div className="h-6 w-1/2 rounded bg-slate-800/60" />
      <div className="mt-4 h-24 rounded bg-slate-800/40" />
      <div className="mt-3 h-24 rounded bg-slate-800/35" />
      <div className="mt-3 h-24 rounded bg-slate-800/30" />
    </div>
  </div>
);

export const FlexCarousel: React.FC<FlexCarouselProps> = ({ cards, onSelectCard, renderCard }) => (
  <div className="relative w-full overflow-hidden">
    <div
      className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 px-3"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {cards.map((card) => (
        <div
          key={card.id}
          className="flex-shrink-0 w-[calc(100%-2rem)] max-w-md snap-center mx-auto cursor-pointer"
          onClick={() => onSelectCard(card.id)}
        >
          <LazyRender className="w-full" placeholder={<FlexCarouselPlaceholder />} rootMargin="600px 0px">
            {renderCard(card.id)}
          </LazyRender>
        </div>
      ))}
    </div>
  </div>
);
