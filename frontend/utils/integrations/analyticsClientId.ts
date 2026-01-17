const STORAGE_KEY = 'liftshift_analytics_client_id';

const generateId = (): string => {
  try {
    const c = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    // ignore
  }

  const rand = () => Math.floor(Math.random() * 1e9).toString(16);
  return `ls_${Date.now().toString(16)}_${rand()}_${rand()}`;
};

export const getAnalyticsClientId = (): string => {
  if (typeof window === 'undefined') return 'server';

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.trim()) return existing;

    const next = generateId();
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return generateId();
  }
};

export const getAnalyticsRequestHeaders = (): Record<string, string> => {
  return {
    'x-liftshift-client-id': getAnalyticsClientId(),
  };
};

export const mergeAnalyticsHeaders = (headers?: HeadersInit): HeadersInit => {
  const analyticsHeaders = getAnalyticsRequestHeaders();

  if (!headers) return analyticsHeaders;

  if (headers instanceof Headers) {
    Object.entries(analyticsHeaders).forEach(([k, v]) => headers.set(k, v));
    return headers;
  }

  if (Array.isArray(headers)) {
    return [...headers, ...Object.entries(analyticsHeaders)];
  }

  return {
    ...headers,
    ...analyticsHeaders,
  };
};
