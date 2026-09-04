import type { HevyPagedWorkoutsResponse } from './types';
import { timeoutSignal } from './abortSignal';

const LYFTA_BASE_URL = 'https://my.lyfta.app';

const buildHeaders = (apiKey: string): Record<string, string> => {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
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

export interface LyfatGetWorkoutsResponse {
  status: boolean;
  count: number;
  total_records: number;
  total_pages: number;
  current_page: number;
  limit: number;
  workouts: Array<{
    id: number;
    title: string;
    body_weight: number;
    workout_perform_date: string;
    total_volume: number;
    totalLiftedWeight: number;
    user: {
      username: string;
    };
    exercises: Array<{
      exercise_id: number;
      excercise_name: string;
      exercise_type: string;
      exercise_image: string;
      exercise_rest_time: number;
      sets: Array<{
        id: string;
        weight: string;
        reps: string;
        rir?: string;
        duration?: string;
        distance?: string;
        set_type_id?: string;
        is_completed: boolean;
        record_type?: string;
        record_level?: string;
        record_value?: string;
      }>;
    }>;
  }>;
}

export interface LyfatGetWorkoutSummaryResponse {
  status: boolean;
  count: number;
  total_records: number;
  total_pages: number;
  current_page: number;
  limit: number;
  workouts: Array<{
    id: string;
    title: string;
    description: string | null;
    workout_duration: string; // e.g. "01:06:25"
    total_volume: string;
    workout_perform_date: string;
  }>;
}

export const lyfatGetWorkouts = async (
  apiKey: string,
  opts: { limit?: number; page?: number } = {}
): Promise<LyfatGetWorkoutsResponse> => {
  const { limit = 100, page = 1 } = opts;
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 100)), // Cap at 100
    page: String(page),
  });

  const res = await fetch(`${LYFTA_BASE_URL}/api/v1/workouts?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders(apiKey),
    signal: timeoutSignal(20_000),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as LyfatGetWorkoutsResponse;
};

export const lyfatValidateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const res = await fetch(`${LYFTA_BASE_URL}/api/v1/exercises?limit=1`, {
      method: 'GET',
      headers: buildHeaders(apiKey),
    });

    if (res.status === 200) return true;
    if (res.status === 401 || res.status === 403) return false;

    // Any other status is a validation error
    return false;
  } catch {
    return false;
  }
};

export const lyfatGetAllWorkouts = async (apiKey: string): Promise<{ workouts: LyfatGetWorkoutsResponse['workouts']; truncated: boolean }> => {
  const allWorkouts: LyfatGetWorkoutsResponse['workouts'] = [];
  let page = 1;
  let hasMore = true;
  // Safety cap: total_pages is server-controlled; never loop unbounded.
  // Truncation is surfaced (not silent) so callers can say so.
  const MAX_PAGES = 500;
  let truncated = false;

  while (hasMore && page <= MAX_PAGES) {
    const response = await lyfatGetWorkouts(apiKey, { limit: 100, page });
    if (!Array.isArray(response.workouts)) {
      throw new Error('Invalid response from Lyfta API');
    }
    allWorkouts.push(...response.workouts);

    if (page >= response.total_pages) {
      hasMore = false;
    } else {
      page++;
    }
  }
  if (hasMore) truncated = true;

  return { workouts: allWorkouts, truncated };
};

export const lyfatGetWorkoutSummaries = async (
  apiKey: string,
  opts: { limit?: number; page?: number } = {}
): Promise<LyfatGetWorkoutSummaryResponse> => {
  const { limit = 1000, page = 1 } = opts;
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 1000)), // Cap at 1000 for summary endpoint
    page: String(page),
  });

  const res = await fetch(`${LYFTA_BASE_URL}/api/v1/workouts/summary?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders(apiKey),
    // Summary pages carry up to 1000 records — allow longer than the 20s default.
    signal: timeoutSignal(45_000),
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }

  return (await res.json()) as LyfatGetWorkoutSummaryResponse;
};

interface LyfatGetExerciseProgressResponse {
  status: boolean;
  weight_unit: string;
  data: unknown[];
}

export const lyfatGetExerciseWeightUnit = async (
  apiKey: string,
  exerciseId: string | number,
): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      exercise_id: String(exerciseId),
      duration: '1',
    });
    const res = await fetch(`${LYFTA_BASE_URL}/api/v1/exercises/progress?${params.toString()}`, {
      method: 'GET',
      headers: buildHeaders(apiKey),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as LyfatGetExerciseProgressResponse;
    const unit = String(json.weight_unit ?? '').toLowerCase();
    if (unit === 'kg' || unit === 'lb' || unit === 'lbs') return unit;
    return null;
  } catch {
    return null;
  }
};

export const lyfatGetExerciseWeightUnits = async (
  apiKey: string,
  exerciseIds: (string | number)[],
): Promise<Map<string, string>> => {
  const unitMap = new Map<string, string>();
  const uniqueIds = [...new Set(exerciseIds.map(String))];

  const results = await Promise.allSettled(
    uniqueIds.map((id) => lyfatGetExerciseWeightUnit(apiKey, id)),
  );

  uniqueIds.forEach((id, i) => {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      unitMap.set(id, result.value);
    }
  });

  return unitMap;
};

export const lyfatGetAllWorkoutSummaries = async (apiKey: string): Promise<{ summaries: LyfatGetWorkoutSummaryResponse['workouts']; truncated: boolean }> => {
  const allSummaries: LyfatGetWorkoutSummaryResponse['workouts'] = [];
  let page = 1;
  let hasMore = true;
  // Safety cap: total_pages is server-controlled; never loop unbounded.
  // Truncation is surfaced (not silent) so callers can say so.
  const MAX_PAGES = 500;
  let truncated = false;

  while (hasMore && page <= MAX_PAGES) {
    const response = await lyfatGetWorkoutSummaries(apiKey, { limit: 1000, page });
    if (!Array.isArray(response.workouts)) {
      throw new Error('Invalid response from Lyfta API');
    }
    allSummaries.push(...response.workouts);

    if (page >= response.total_pages) {
      hasMore = false;
    } else {
      page++;
    }
  }
  if (hasMore) truncated = true;

  return { summaries: allSummaries, truncated };
};
