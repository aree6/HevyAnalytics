import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router';
import { initGA } from './utils/integrations/ga';
import { ThemeProvider } from './components/theme/ThemeProvider';
import './tailwind.css';
import { getDarkBgChoice } from './utils/storage/localStorage';
import { resolveDarkBgByMode } from './src/assets/images/misc/bgConfig';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Analytics must not compete with first paint — idle-deferred, never render-blocking.
// initAnalytics is idempotent (module INIT_FLAG), so the visibility retry below
// is a safe no-op when init already ran. It covers hidden-tab boot, where
// requestIdleCallback may never fire and its timeout isn't guaranteed.
const scheduleInitGA = () => {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof idle === 'function') {
    idle(() => initGA(), { timeout: 2000 });
  } else {
    window.setTimeout(() => initGA(), 0);
  }
};
scheduleInitGA();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleInitGA();
}, { once: true });

// Preload the background image for instant display
const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = resolveDarkBgByMode('pure-black', getDarkBgChoice());
document.head.appendChild(preloadLink);

const getRouterBasename = (): string => {
  const baseUrl = import.meta.env.BASE_URL;
  if (typeof baseUrl !== 'string') return '/';
  const trimmed = baseUrl.replace(/\/+$/g, '');
  return trimmed || '/';
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter basename={getRouterBasename()}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
