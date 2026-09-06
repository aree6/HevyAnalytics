import { useSyncExternalStore } from 'react';
import { trackEvent } from '../../utils/integrations/analytics';

// Latch: once any source reports a truncated full-sync, stay true for the
// session (merged datasets are OR-ed across sources). Cleared on logout /
// cache clear via clearHistoryTruncation().
let truncated = false;
const listeners = new Set<() => void>();

const emit = (): void => {
  for (const l of listeners) l();
};

export const reportHistoryTruncation = (meta?: { truncated?: boolean }): void => {
  if (meta?.truncated && !truncated) {
    truncated = true;
    try {
      trackEvent('history_truncated', {});
    } catch {
      // analytics must never break sync
    }
    emit();
  }
};

export const clearHistoryTruncation = (): void => {
  if (truncated) {
    truncated = false;
    emit();
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): boolean => truncated;

export const useHistoryTruncated = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
