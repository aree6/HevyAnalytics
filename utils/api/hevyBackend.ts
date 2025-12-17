const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/g, '');

export const getBackendBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return normalizeBaseUrl(envUrl.trim());
  if ((import.meta as any).env?.DEV) return 'http://localhost:5000';
  return '';
};

const parseError = async (res: Response): Promise<string> => {
  try {
    const data = await res.json();
    const msg = (data && (data.error || data.detail)) as string | undefined;
    return msg || `${res.status} ${res.statusText}`;
  } catch {
    try {
      const text = await res.text();
      return text || `${res.status} ${res.statusText}`;
    } catch {
      return `${res.status} ${res.statusText}`;
    }
  }
};

export interface BackendLoginResponse {
  auth_token: string;
  user_id: string;
  expires_at?: string;
}

export interface BackendSetsResponse<TSet> {
  sets: TSet[];
  meta?: {
    workouts?: number;
  };
}

export const hevyBackendLogin = async (emailOrUsername: string, password: string): Promise<BackendLoginResponse> => {
  const base = getBackendBaseUrl();
  if (!base) throw new Error('Missing VITE_BACKEND_URL (backend API).');

  const res = await fetch(`${base}/api/hevy/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as BackendLoginResponse;
};

export const hevyBackendGetAccount = async (authToken: string): Promise<{ username: string }> => {
  const base = getBackendBaseUrl();
  if (!base) throw new Error('Missing VITE_BACKEND_URL (backend API).');

  const res = await fetch(`${base}/api/hevy/account`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'auth-token': authToken,
    },
  });

  if (!res.ok) throw new Error(await parseError(res));
  const json = (await res.json()) as { username?: string };
  if (!json.username) throw new Error('Failed to read Hevy username from backend.');
  return { username: json.username };
};

export const hevyBackendGetSets = async <TSet>(authToken: string, username: string): Promise<BackendSetsResponse<TSet>> => {
  const base = getBackendBaseUrl();
  if (!base) throw new Error('Missing VITE_BACKEND_URL (backend API).');

  const params = new URLSearchParams({ username });
  const res = await fetch(`${base}/api/hevy/sets?${params.toString()}`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'auth-token': authToken,
    },
  });

  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as BackendSetsResponse<TSet>;
};
