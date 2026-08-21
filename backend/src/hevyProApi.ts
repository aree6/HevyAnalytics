import type { HevyProWorkout } from './types';

const HEVY_PRO_BASE_URL = 'https://api.hevyapp.com';

const buildHeaders = (apiKey: string): Record<string, string> => {
  return {
    'content-type': 'application/json',
    'api-key': apiKey,
  };
};

const parseErrorBody = async (res: Response): Promise<string> => {
  try {
    const text = await res.text();
    return text || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
};

export interface HevyProUserInfoResponse {
  data: {
    id: string;
    name: string;
    url: string;
  };
}

export interface HevyProWorkoutsPageResponse {
  page: number;
  page_count: number;
  workouts: HevyProWorkout[];
}

export const hevyProGetWorkoutsPage = async (
  apiKey: string,
  opts: { page: number; pageSize?: number }
): Promise<HevyProWorkoutsPageResponse> => {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 10, 1), 10);
  const params = new URLSearchParams({
    page: String(Math.max(opts.page, 1)),
    pageSize: String(pageSize),
  });

  const res = await fetch(`${HEVY_PRO_BASE_URL}/v1/workouts?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders(apiKey),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as HevyProWorkoutsPageResponse;
};

export const hevyProGetUserInfo = async (apiKey: string): Promise<HevyProUserInfoResponse> => {
  const res = await fetch(`${HEVY_PRO_BASE_URL}/v1/user/info`, {
    method: 'GET',
    headers: buildHeaders(apiKey),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as HevyProUserInfoResponse;
};

export const hevyProValidateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    await hevyProGetWorkoutsPage(apiKey, { page: 1, pageSize: 1 });
    return true;
  } catch (err) {
    const status = (err as any)?.statusCode;
    if (status === 401 || status === 403) return false;
    // A timeout/abort is a network blip, not proof the key is bad — surfacing
    // `{valid:false}` here made users delete good keys. Let it throw (500).
    if ((err as any)?.name === 'TimeoutError' || (err as any)?.name === 'AbortError') throw err;
    return false;
  }
};

export const hevyProGetAllWorkouts = async (apiKey: string): Promise<{ workouts: HevyProWorkout[]; truncated: boolean }> => {
  const out: HevyProWorkout[] = [];
  let page = 1;
  let pageCount = 1;
  // Safety cap: page_count is server-controlled; never loop unbounded.
  // Truncation is surfaced (not silent) so callers can say so.
  const MAX_PAGES = 500;
  let truncated = false;

  while (page <= pageCount && page <= MAX_PAGES) {
    const resp = await hevyProGetWorkoutsPage(apiKey, { page, pageSize: 10 });
    pageCount = Number(resp.page_count ?? 1) || 1;
    out.push(...(resp.workouts ?? []));
    page += 1;
  }
  if (page <= pageCount) truncated = true;

  return { workouts: out, truncated };
};
