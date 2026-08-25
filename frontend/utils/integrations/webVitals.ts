import { trackEvent } from './analytics';

let started = false;

/**
 * Field (RUM) Web Vitals reporting. Dynamically imports `web-vitals` off the
 * critical path and forwards each metric once through the existing analytics
 * pipeline (`trackEvent` queues when PostHog isn't ready yet, so early
 * metrics are never lost). No-ops when analytics are disabled — `trackEvent`
 * already enforces that.
 */
export const initWebVitals = (): void => {
  if (started) return;
  started = true;
  if (typeof window === 'undefined') return;

  const schedule = (cb: () => void): void => {
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (typeof ric === 'function') ric(cb, { timeout: 3000 });
    else window.setTimeout(cb, 1000);
  };

  schedule(() => {
    import('web-vitals')
      .then(({ onLCP, onINP, onCLS }) => {
        const report = (metric: { name: string; value: number; rating: string }) => {
          try {
            trackEvent('web_vital', {
              metric: metric.name,
              // LCP ms / INP ms / CLS ×1000 as integers for clean aggregation.
              value: metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value),
              rating: metric.rating,
            });
          } catch {
            // RUM must never break the app.
          }
        };
        try {
          onLCP(report);
          onINP(report);
          onCLS(report);
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // web-vitals chunk failed — app works fine without RUM.
      });
  });
};
