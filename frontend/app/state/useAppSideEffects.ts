import { useEffect } from 'react';
import { Location } from 'react-router-dom';
import { setContext, trackEvent } from '../../utils/integrations/analytics';
import { trackPageView } from '../../utils/integrations/ga';
import { saveDataSourceChoice } from '../../utils/storage/dataSourceStorage';

interface AppSideEffectsProps {
  onboardingIntent: 'initial' | 'update' | null;
  dataSource: string | null;
  location: Location;
}

export const useAppSideEffects = ({ onboardingIntent, dataSource, location }: AppSideEffectsProps): void => {
  useEffect(() => {
    setContext({ app_shell: onboardingIntent === 'initial' ? 'landing' : 'app' });
  }, [onboardingIntent]);

  useEffect(() => {
    trackEvent('app_open', {
      path: `${window.location.pathname || '/'}${window.location.search || ''}`,
    });
  }, []);

  useEffect(() => {
    const isShell = onboardingIntent !== 'initial';
    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = (body.style as any).overscrollBehavior;
    const prevHtmlOverscroll = (html.style as any).overscrollBehavior;

    if (isShell) {
      body.style.overflow = 'hidden';
      (body.style as any).overscrollBehavior = 'none';
      (html.style as any).overscrollBehavior = 'none';
    } else {
      body.style.overflow = '';
      (body.style as any).overscrollBehavior = '';
      (html.style as any).overscrollBehavior = '';
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      (body.style as any).overscrollBehavior = prevBodyOverscroll;
      (html.style as any).overscrollBehavior = prevHtmlOverscroll;
    };
  }, [onboardingIntent]);

  useEffect(() => {
    if (!dataSource) return;
    saveDataSourceChoice(dataSource);
    setContext({ data_source: dataSource });
  }, [dataSource]);

  useEffect(() => {
    trackPageView(`${window.location.pathname || '/'}${window.location.search || ''}`);
  }, [location.pathname, location.search]);
};
