import { PostHog } from 'posthog-node';

type Properties = Record<string, unknown>;

type PosthogConfig = {
  apiKey: string;
  host: string;
};

let client: PostHog | null = null;
let enabled = true;

const getConfig = (): PosthogConfig | null => {
  const apiKey = String(process.env.POSTHOG_PROJECT_API_KEY ?? '').trim();
  const host = String(process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com').trim();
  if (!apiKey) return null;
  return { apiKey, host: host || 'https://us.i.posthog.com' };
};

export const getPosthogClient = (): PostHog | null => {
  if (!enabled) return null;
  if (client) return client;

  const cfg = getConfig();
  if (!cfg) return null;

  client = new PostHog(cfg.apiKey, { host: cfg.host });
  return client;
};

export const captureBackendEvent = (distinctId: string, event: string, properties?: Properties): void => {
  const ph = getPosthogClient();
  if (!ph) return;

  try {
    ph.capture({
      distinctId,
      event,
      properties,
    });
  } catch {
    // ignore
  }
};

export const shutdownPosthog = async (): Promise<void> => {
  enabled = false;
  const ph = client;
  client = null;
  if (!ph) return;

  try {
    await ph.shutdown();
  } catch {
    // ignore
  }
};
