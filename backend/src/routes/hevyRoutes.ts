import express from 'express';
import { hevyGetAccount, hevyGetWorkoutsPaged, hevyLogin, hevyValidateAuthToken } from '../hevyApi';
import { mapHevyWorkoutsToWorkoutSets } from '../mapToWorkoutSets';

export const createHevyRouter = (opts: {
  loginLimiter: express.RequestHandler;
  requireAuthTokenHeader: (req: express.Request) => string;
  getCachedResponse: <T>(key: string, compute: () => Promise<T>) => Promise<T>;
}) => {
  const { loginLimiter, requireAuthTokenHeader, getCachedResponse } = opts;
  const router = express.Router();

  router.post('/login', loginLimiter, async (req, res) => {
    const emailOrUsername = String(req.body?.emailOrUsername ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Missing emailOrUsername or password' });
    }

    try {
      const data = await hevyLogin(emailOrUsername, password);
      res.json({ auth_token: data.auth_token, user_id: data.user_id, expires_at: data.expires_at });
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      const message = (err as Error).message || 'Login failed';
      if (status === 401) {
        return res.status(401).json({
          error: `${message}.`,
        });
      }
      res.status(status).json({ error: message });
    }
  });

  router.post('/validate', async (req, res) => {
    const authToken = String(req.body?.auth_token ?? '').trim();
    if (!authToken) return res.status(400).json({ error: 'Missing auth_token' });

    try {
      const valid = await hevyValidateAuthToken(authToken);
      res.json({ valid });
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Validate failed' });
    }
  });

  router.get('/account', async (req, res) => {
    try {
      const token = requireAuthTokenHeader(req);
      const data = await hevyGetAccount(token);
      res.json(data);
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Failed to fetch account' });
    }
  });

  router.get('/workouts', async (req, res) => {
    const username = String(req.query.username ?? '').trim();
    const offset = Number(req.query.offset ?? 0);

    if (!username) return res.status(400).json({ error: 'Missing username' });
    if (!Number.isFinite(offset) || offset < 0) return res.status(400).json({ error: 'Invalid offset' });

    try {
      const token = requireAuthTokenHeader(req);
      const data = await hevyGetWorkoutsPaged(token, { username, offset });
      res.json(data);
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Failed to fetch workouts' });
    }
  });

  router.get('/sets', async (req, res) => {
    const username = String(req.query.username ?? '').trim();
    const maxPages = req.query.maxPages != null ? Number(req.query.maxPages) : undefined;

    if (!username) return res.status(400).json({ error: 'Missing username' });
    if (maxPages != null && (!Number.isFinite(maxPages) || maxPages <= 0)) {
      return res.status(400).json({ error: 'Invalid maxPages' });
    }

    try {
      const token = requireAuthTokenHeader(req);
      const cacheKey = `hevySets:${token}:${username}:${maxPages ?? 'all'}`;
      const { workouts, sets } = await getCachedResponse(cacheKey, async () => {
        const allWorkouts = [] as any[];
        let offset = 0;
        let page = 0;

        while (true) {
          if (maxPages != null && page >= maxPages) break;

          const data = await hevyGetWorkoutsPaged(token, { username, offset });
          const workouts = data.workouts ?? [];
          if (workouts.length === 0) break;

          allWorkouts.push(...workouts);
          offset += 5;
          page += 1;
        }

        const sets = mapHevyWorkoutsToWorkoutSets(allWorkouts);
        return { workouts: allWorkouts, sets };
      });
      res.json({ sets, meta: { workouts: workouts.length } });
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Failed to fetch sets' });
    }
  });

  return router;
};
