export const initAdSense = (client: string) => {
  const isProd = (import.meta as any).env?.PROD;
  if (!isProd || !client) return;

  if ((window as any).adsenseInitialized) return;
  (window as any).adsenseInitialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};
