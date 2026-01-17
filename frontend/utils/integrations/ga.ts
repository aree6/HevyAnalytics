import { initAnalytics, trackPageView as trackUnifiedPageView } from './analytics';
import { installGlobalClickCapture } from './analyticsClickCapture';

export const initGA = () => {
  initAnalytics();
  installGlobalClickCapture();
};

export const trackPageView = (path: string) => {
  trackUnifiedPageView(path);
};
