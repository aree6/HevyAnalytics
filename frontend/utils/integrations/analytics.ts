import { getAnalyticsClientId } from './analyticsClientId';

type AnalyticsProperties = Record<string, unknown>;

const INIT_FLAG = '__liftshift_analytics_initialized';

type PosthogCapture = { event: string; properties?: AnalyticsProperties };

let posthogClient: any = null;
let posthogInitPromise: Promise<void> | null = null;
let queuedPosthogCaptures: PosthogCapture[] = [];
let queuedPosthogRegisters: AnalyticsProperties | null = null;

const shouldEnableAnalytics = (): boolean => {
  const disabled = String(import.meta.env.VITE_ANALYTICS_DISABLED ?? '').trim();
  return disabled !== '1' && disabled.toLowerCase() !== 'true';
};

const getGaMeasurementId = (): string | null => {
  const id = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? (import.meta.env as any).VITE_PUBLIC_GA_MEASUREMENT_ID) as
    | string
    | undefined;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
};

const getPosthogConfig = (): { key: string; host: string } | null => {
  const key = ((import.meta.env as any).VITE_PUBLIC_POSTHOG_KEY ?? (import.meta.env as any).VITE_POSTHOG_KEY) as string | undefined;
  const host = ((import.meta.env as any).VITE_PUBLIC_POSTHOG_HOST ??
    (import.meta.env as any).VITE_POSTHOG_HOST ??
    'https://us.i.posthog.com') as string | undefined;
  if (!key || !key.trim()) return null;
  return { key: key.trim(), host: typeof host === 'string' && host.trim() ? host.trim() : 'https://us.i.posthog.com' };
};

const getCookieDomain = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const host = (window.location?.hostname ?? '').trim();
  if (!host) return undefined;
  const normalized = host.replace(/^www\./i, '').toLowerCase();
  // GA rejects domains without a dot; let GA default for localhost or unusual hosts.
  if (normalized === 'localhost') return undefined;
  if (!normalized.includes('.')) return undefined;
  return normalized;
};

const ensurePosthogInitialized = (): void => {
  if (typeof window === 'undefined') return;
  if (!shouldEnableAnalytics()) return;
  if (posthogClient) return;
  if (posthogInitPromise) return;

  const posthogCfg = getPosthogConfig();
  if (!posthogCfg) return;

  posthogInitPromise = import('posthog-js')
    .then((m: any) => {
      posthogClient = m?.default ?? m;
      if (!posthogClient?.init) return;

      posthogClient.init(posthogCfg.key, {
        api_host: posthogCfg.host,
        autocapture: {
          dom_event_allowlist: ['click', 'submit'],
          element_allowlist: ['a', 'button', 'form', 'label'],
          capture_copied_text: false,
        },
        capture_pageview: false,
        capture_pageleave: true,
      });

      try {
        posthogClient.register(getCommonProperties());
      } catch {
        // ignore
      }

      if (queuedPosthogRegisters) {
        try {
          posthogClient.register(queuedPosthogRegisters);
        } catch {
          // ignore
        }
        queuedPosthogRegisters = null;
      }

      const queued = queuedPosthogCaptures;
      queuedPosthogCaptures = [];
      for (const item of queued) {
        try {
          posthogClient.capture(item.event, item.properties);
        } catch {
          // ignore
        }
      }
    })
    .catch(() => {
      posthogInitPromise = null;
    })
    .then(() => {
    });
};

const ensureGtagLoaded = (measurementId: string) => {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = (window as any).gtag || function () {
    (window as any).dataLayer.push(arguments);
  };

  if ((window as any).__liftshift_ga_loaded) return;
  (window as any).__liftshift_ga_loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  (window as any).gtag('js', new Date());
  (window as any).gtag('config', measurementId, {
    send_page_view: false,
    cookie_domain: getCookieDomain(),
  });
};

const getCommonProperties = (): AnalyticsProperties => {
  return {
    app: 'LiftShift',
    client_id: getAnalyticsClientId(),
    env: (import.meta.env.MODE ?? (import.meta.env.PROD ? 'production' : import.meta.env.DEV ? 'development' : 'unknown')) as string,
  };
};

export const initAnalytics = (): void => {
  if (typeof window === 'undefined') return;
  if ((window as any)[INIT_FLAG]) return;
  (window as any)[INIT_FLAG] = true;

  if (!shouldEnableAnalytics()) return;

  const gaId = getGaMeasurementId();
  if (gaId) ensureGtagLoaded(gaId);

  ensurePosthogInitialized();

  try {
    window.addEventListener('error', (e) => {
      trackEvent('frontend_error', {
        message: (e as any)?.message,
        filename: (e as any)?.filename,
        lineno: (e as any)?.lineno,
        colno: (e as any)?.colno,
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      trackEvent('frontend_unhandled_rejection', {
        reason: String((e as any)?.reason ?? ''),
      });
    });
  } catch {
    // ignore
  }
};

export const trackPageView = (path: string, properties?: AnalyticsProperties): void => {
  if (!shouldEnableAnalytics()) return;
  if (typeof window === 'undefined') return;

  const common = getCommonProperties();
  const merged = { ...common, ...(properties || {}) };

  const gaId = getGaMeasurementId();
  if (gaId) ensureGtagLoaded(gaId);
  const gtag = (window as any).gtag;
  if (gaId && typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: `${window.location.origin}${path}`,
      page_path: path,
      ...merged,
    });
  }

  ensurePosthogInitialized();

  const phProps = { ...merged, path };
  if (posthogClient?.capture) {
    try {
      posthogClient.capture('$pageview', phProps);
    } catch {
      // ignore
    }
  } else {
    queuedPosthogCaptures.push({ event: '$pageview', properties: phProps });
    if (queuedPosthogCaptures.length > 100) queuedPosthogCaptures = queuedPosthogCaptures.slice(-100);
  }
};

export const trackEvent = (name: string, properties?: AnalyticsProperties): void => {
  if (!shouldEnableAnalytics()) return;
  if (typeof window === 'undefined') return;

  const common = getCommonProperties();
  const merged = { ...common, ...(properties || {}) };

  const gaId = getGaMeasurementId();
  if (gaId) ensureGtagLoaded(gaId);
  const gtag = (window as any).gtag;
  if (gaId && typeof gtag === 'function') {
    gtag('event', name, merged);
  }

  ensurePosthogInitialized();

  if (posthogClient?.capture) {
    try {
      posthogClient.capture(name, merged);
    } catch {
      // ignore
    }
  } else {
    queuedPosthogCaptures.push({ event: name, properties: merged });
    if (queuedPosthogCaptures.length > 100) queuedPosthogCaptures = queuedPosthogCaptures.slice(-100);
  }
};

export const setContext = (properties: AnalyticsProperties): void => {
  if (!shouldEnableAnalytics()) return;

  ensurePosthogInitialized();
  if (posthogClient?.register) {
    try {
      posthogClient.register(properties);
    } catch {
      // ignore
    }
    return;
  }

  queuedPosthogRegisters = { ...(queuedPosthogRegisters || {}), ...properties };
};
