import { mergeAnalyticsHeaders } from '../integrations/analyticsClientId';
import { buildBackendUrl, parseError, type BackendSetsResponse } from './common';

export interface BackendLoginResponse {
  auth_token: string;
  user_id: string;
  expires_at?: string;
}

export const hevyBackendValidateAuthToken = async (authToken: string): Promise<boolean> => {
  const res = await fetch(buildBackendUrl('/api/hevy/validate'), {
    method: 'POST',
    headers: mergeAnalyticsHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ auth_token: authToken }),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    console.error('Hevy auth token validation failed:', msg);
    return false;
  }

  const data = (await res.json()) as { valid: boolean };
  return data.valid === true;
};

export const hevyBackendValidateProApiKey = async (apiKey: string): Promise<boolean> => {
  const url = buildBackendUrl('/api/hevy/api-key/validate');
  const res = await fetch(url, {
    method: 'POST',
    headers: mergeAnalyticsHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    console.error('Hevy Pro API key validation failed:', { url, status: res.status, msg });
    if (res.status === 404) {
      throw new Error(
        'Backend returned 404 for Hevy Pro API key validation. Check that VITE_BACKEND_URL is correct (no trailing /api) and that your backend has been redeployed to the latest version.'
      );
    }
    return false;
  }

  const data = (await res.json()) as { valid: boolean };
  return data.valid === true;
};

export const hevyBackendGetSetsWithProApiKey = async <TSet>(apiKey: string): Promise<BackendSetsResponse<TSet>> => {
  const url = buildBackendUrl('/api/hevy/api-key/sets');
  const res = await fetch(url, {
    method: 'POST',
    headers: mergeAnalyticsHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    console.error('Hevy Pro API key sets fetch failed:', { url, status: res.status, msg });
    if (res.status === 404) {
      throw new Error(
        'Backend returned 404 for Hevy Pro API key sync. Check that VITE_BACKEND_URL is correct (no trailing /api) and that your backend has been redeployed to the latest version.'
      );
    }
    throw new Error(msg);
  }
  return (await res.json()) as BackendSetsResponse<TSet>;
};

export const hevyBackendLogin = async (emailOrUsername: string, password: string): Promise<BackendLoginResponse> => {
  const res = await fetch(buildBackendUrl('/api/hevy/login'), {
    method: 'POST',
    headers: mergeAnalyticsHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as BackendLoginResponse;
};

export const hevyBackendGetAccount = async (authToken: string): Promise<{ username: string }> => {
  const res = await fetch(buildBackendUrl('/api/hevy/account'), {
    method: 'GET',
    headers: {
      ...mergeAnalyticsHeaders({
        'content-type': 'application/json',
        'auth-token': authToken,
      }),
    },
  });

  if (!res.ok) throw new Error(await parseError(res));
  const json = (await res.json()) as { username?: string };
  if (!json.username) throw new Error('Failed to read Hevy username from backend.');
  return { username: json.username };
};

export const hevyBackendGetSets = async <TSet>(authToken: string, username: string): Promise<BackendSetsResponse<TSet>> => {
  const params = new URLSearchParams({ username });
  const res = await fetch(buildBackendUrl(`/api/hevy/sets?${params.toString()}`), {
    method: 'GET',
    headers: {
      ...mergeAnalyticsHeaders({
        'content-type': 'application/json',
        'auth-token': authToken,
      }),
    },
  });

  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as BackendSetsResponse<TSet>;
};
