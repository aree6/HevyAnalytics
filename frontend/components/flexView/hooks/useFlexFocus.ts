import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FlexCardId } from '../utils/flexViewConstants';

export const useFlexFocus = (cardIds: FlexCardId[]) => {
  const [focusedCardId, setFocusedCardId] = useState<FlexCardId | null>(null);
  const [showFocusedNav, setShowFocusedNav] = useState(false);
  const hideNavTimeoutRef = useRef<number | null>(null);
  const canHover = useMemo(
    () => (typeof window !== 'undefined' ? window.matchMedia?.('(hover: hover)')?.matches : true),
    []
  );

  const clearHideNavTimeout = useCallback(() => {
    if (hideNavTimeoutRef.current) {
      window.clearTimeout(hideNavTimeoutRef.current);
      hideNavTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!focusedCardId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedCardId(null);
    };

    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [focusedCardId]);

  useEffect(() => {
    if (!focusedCardId) {
      setShowFocusedNav(false);
      clearHideNavTimeout();
      return;
    }
    if (!canHover) {
      setShowFocusedNav(true);
    }
    return () => {
      clearHideNavTimeout();
    };
  }, [focusedCardId, canHover, clearHideNavTimeout]);

  const toggleFocusedNavTouch = useCallback(() => {
    if (canHover) return;
    setShowFocusedNav((v) => !v);
    clearHideNavTimeout();
  }, [canHover, clearHideNavTimeout]);

  const focusAdjacentCard = useCallback(
    (direction: -1 | 1) => {
      setFocusedCardId((currentId) => {
        if (!currentId) return currentId;
        const idx = cardIds.findIndex((c) => c === currentId);
        if (idx < 0) return currentId;
        const nextIdx = idx + direction;
        if (nextIdx < 0 || nextIdx >= cardIds.length) return currentId;
        return cardIds[nextIdx];
      });
    },
    [cardIds]
  );

  return {
    focusedCardId,
    setFocusedCardId,
    showFocusedNav,
    setShowFocusedNav,
    toggleFocusedNavTouch,
    focusAdjacentCard,
    canHover,
    clearHideNavTimeout,
  };
};
