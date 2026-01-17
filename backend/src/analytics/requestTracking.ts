import type express from 'express';
import { captureBackendEvent } from './posthog';

const CLIENT_ID_HEADER = 'x-liftshift-client-id';

export const getAnalyticsDistinctId = (req: express.Request): string => {
  const raw = req.header(CLIENT_ID_HEADER);
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (id && id.length <= 128) return id;

  // Fallback: still provides some value for request-level analysis.
  const ip = String(req.ip ?? '').trim();
  if (ip) return `ip:${ip}`;

  return 'unknown';
};

const getOriginHostname = (origin: string | undefined): string | undefined => {
  if (!origin) return undefined;
  try {
    return new URL(origin).hostname;
  } catch {
    return undefined;
  }
};

export const analyticsRequestMiddleware: express.RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  const distinctId = getAnalyticsDistinctId(req);

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;

    // Avoid capturing query strings to reduce the chance of sending user identifiers.
    const path = req.path;

    captureBackendEvent(distinctId, 'api_request', {
      method: req.method,
      path,
      status: res.statusCode,
      duration_ms: durationMs,
      origin_host: getOriginHostname(req.header('origin')),
      ua: req.header('user-agent')?.slice(0, 200),
      has_auth_token: Boolean(req.header('auth-token')),
    });

    if (res.statusCode >= 400) {
      captureBackendEvent(distinctId, 'api_response_error', {
        method: req.method,
        path,
        status: res.statusCode,
        origin_host: getOriginHostname(req.header('origin')),
      });
    }
  });

  next();
};
