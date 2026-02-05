import express from 'express';
import { lyfatGetAllWorkouts, lyfatGetAllWorkoutSummaries, lyfatValidateApiKey } from '../lyfta';
import { mapLyfataWorkoutsToWorkoutSets } from '../mapLyfataWorkoutsToWorkoutSets';

export const createLyftaRouter = (opts: {
  loginLimiter: express.RequestHandler;
  getCachedResponse: <T>(key: string, compute: () => Promise<T>) => Promise<T>;
}) => {
  const { loginLimiter, getCachedResponse } = opts;
  const router = express.Router();

  router.post('/validate', loginLimiter, async (req, res) => {
    const apiKey = String(req.body?.apiKey ?? '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing apiKey' });
    }

    try {
      const valid = await lyfatValidateApiKey(apiKey);
      res.json({ valid });
    } catch (err) {
      const status = (err as any).statusCode ?? 500;
      res.status(status).json({ error: (err as Error).message || 'Validation failed' });
    }
  });

  router.post('/sets', async (req, res) => {
    const apiKey = String(req.body?.apiKey ?? '').trim();

    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });

    try {
      const cacheKey = `lyftaSets:${apiKey}`;
      const { workouts, sets } = await getCachedResponse(cacheKey, async () => {
        // Fetch both workout details and summaries in parallel
        const [workouts, summaries] = await Promise.all([
          lyfatGetAllWorkouts(apiKey),
          lyfatGetAllWorkoutSummaries(apiKey),
        ]);
        const sets = mapLyfataWorkoutsToWorkoutSets(workouts, summaries);
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
