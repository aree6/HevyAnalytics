import { mergeAnalyticsHeaders } from '../integrations/analyticsClientId';
import { buildBackendUrl, parseError, type BackendSetsResponse } from './common';

export interface BackendLyfatLoginResponse {
  api_key: string;
}

export const lyfatBackendValidateApiKey = async (apiKey: string): Promise<boolean> => {
  const res = await fetch(buildBackendUrl('/api/lyfta/validate'), {
    method: 'POST',
    headers: mergeAnalyticsHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    console.error('Lyfta API key validation failed:', msg);
    return false;
  }

  const data = (await res.json()) as { valid: boolean };
  return data.valid === true;
};

export const lyfatBackendGetSets = async <TSet>(apiKey: string): Promise<BackendSetsResponse<TSet>> => {
  const res = await fetch(buildBackendUrl('/api/lyfta/sets'), {
    method: 'POST',
    headers: mergeAnalyticsHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as BackendSetsResponse<TSet>;
};
