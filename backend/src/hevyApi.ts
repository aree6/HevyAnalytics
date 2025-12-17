import type {
  HevyAccountResponse,
  HevyLoginResponse,
  HevyPagedWorkoutsResponse,
} from './types';

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const HEVY_BASE_URL = process.env.HEVY_BASE_URL ?? 'https://api.hevyapp.com';

const buildHeaders = (authToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': requireEnv('HEVY_X_API_KEY'),
  };
  if (authToken) headers['auth-token'] = authToken;
  return headers;
};

const parseErrorBody = async (res: Response): Promise<string> => {
  try {
    const text = await res.text();
    return text || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
};

export const hevyLogin = async (emailOrUsername: string, password: string): Promise<HevyLoginResponse> => {
  const res = await fetch(`${HEVY_BASE_URL}/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ emailOrUsername, password, useAuth2_0: true }),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as HevyLoginResponse;
};

export const hevyValidateAuthToken = async (authToken: string): Promise<boolean> => {
  const res = await fetch(`${HEVY_BASE_URL}/validate_auth_token`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ authToken }),
  });

  if (res.status === 200) return true;
  if (res.status === 404) return false;

  const msg = await parseErrorBody(res);
  const err = new Error(msg);
  (err as any).statusCode = res.status;
  throw err;
};

export const hevyGetAccount = async (authToken: string): Promise<HevyAccountResponse> => {
  const res = await fetch(`${HEVY_BASE_URL}/user/account`, {
    method: 'GET',
    headers: buildHeaders(authToken),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as HevyAccountResponse;
};

export const hevyGetWorkoutsPaged = async (
  authToken: string,
  opts: { username: string; offset: number }
): Promise<HevyPagedWorkoutsResponse> => {
  const params = new URLSearchParams({
    username: opts.username,
    offset: String(opts.offset),
  });

  const res = await fetch(`${HEVY_BASE_URL}/user_workouts_paged?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders(authToken),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as HevyPagedWorkoutsResponse;
};
