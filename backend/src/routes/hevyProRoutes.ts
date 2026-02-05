import express from 'express';
import { hevyProGetAllWorkouts, hevyProValidateApiKey } from '../hevyProApi';
import { mapHevyProWorkoutsToWorkoutSets } from '../mapHevyProWorkoutsToWorkoutSets';

export const createHevyProRouter = (opts: {
  loginLimiter: express.RequestHandler;
  getCachedResponse: <T>(key: string, compute: () => Promise<T>) => Promise<T>;
}) => {
  const { loginLimiter, getCachedResponse } = opts;
  const router = express.Router();

  router.post('/api-key/validate', loginLimiter, async (req, res) => {
    const apiKey = String(req.body?.apiKey ?? '').trim();
    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });

    try {
      const valid = await hevyProValidateApiKey(apiKey);
      res.json({ valid });
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Validate failed' });
    }
  });

  router.post('/api-key/sets', async (req, res) => {
    const apiKey = String(req.body?.apiKey ?? '').trim();
    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });

    try {
      const cacheKey = `hevyProSets:${apiKey}`;
      const { workouts, sets } = await getCachedResponse(cacheKey, async () => {
        const workouts = await hevyProGetAllWorkouts(apiKey);
        const sets = mapHevyProWorkoutsToWorkoutSets(workouts);
        return { workouts, sets };
      });
      res.json({ sets, meta: { workouts: workouts.length } });
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Failed to fetch sets' });
    }
  });

  return router;
};
