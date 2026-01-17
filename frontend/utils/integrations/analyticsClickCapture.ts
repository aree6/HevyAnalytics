import { trackEvent } from './analytics';

type ClickMeta = {
  id?: string;
  dataTrack?: string;
  ariaLabel?: string;
  tag?: string;
};

const isInteractive = (el: Element): boolean => {
  const tag = el.tagName.toLowerCase();
  if (tag === 'button' || tag === 'a') return true;
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return true;
  if (el.getAttribute('role') === 'button') return true;
  return false;
};

const getClickMeta = (el: Element): ClickMeta => {
  const id = el.getAttribute('id') || undefined;
  const dataTrack = el.getAttribute('data-track') || undefined;
  const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title') || undefined;
  const tag = el.tagName.toLowerCase();
  return {
    id,
    dataTrack,
    ariaLabel,
    tag,
  };
};

export const installGlobalClickCapture = (): void => {
  if (typeof window === 'undefined') return;
  if ((window as any).__liftshift_click_capture_installed) return;
  (window as any).__liftshift_click_capture_installed = true;

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest('button,a,input,select,textarea,[role="button"],[data-track]');
      if (!interactive) return;
      if (!isInteractive(interactive) && !interactive.getAttribute('data-track')) return;

      const meta = getClickMeta(interactive);
      trackEvent('ui_click', {
        ...meta,
        path: `${window.location.pathname || '/'}${window.location.search || ''}`,
      });
    },
    { capture: true }
  );
};
